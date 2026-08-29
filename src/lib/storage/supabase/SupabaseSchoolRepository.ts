import type { ISchoolRepository } from "@/lib/repositories/ISchoolRepository";
import type {
  Organization,
  OrganizationMember,
  Classroom,
  ClassroomStudent,
  ClassroomTeacher,
  CreateOrganizationInput,
  CreateClassroomInput,
  UpdateClassroomInput,
  CreateClassroomStudentInput,
  ClassroomStudentDetail,
  TeacherStudentDirectoryEntry,
  TeacherStudentProfile,
  UserDisplayInfo,
  ParentLinkStatus,
  StudentParentLinkInfo,
} from "@/types/school";
import type { ValidatedImportRow, ImportResult, ImportRowResult } from "@/types/schoolImport";
import { INVITATION_EXPIRY_DAYS } from "@/types/invitations";
import { DEFAULT_TEACHER_ORGANIZATION_NAME } from "@/types/school";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { QueryError, warnRepo } from "./errors";

type DbOrg     = Database["public"]["Tables"]["organizations"]["Row"];
type DbMember  = Database["public"]["Tables"]["organization_members"]["Row"];
type DbRoom    = Database["public"]["Tables"]["classrooms"]["Row"];
type DbStudent = Database["public"]["Tables"]["classroom_students"]["Row"];
type DbTeacher = Database["public"]["Tables"]["classroom_teachers"]["Row"];
type DbDisplay = Database["public"]["Tables"]["user_display_profiles"]["Row"];

function mapOrg(row: DbOrg): Organization {
  return {
    id:         row.id,
    name:       row.name,
    type:       row.type,
    createdBy:  row.created_by,
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  };
}

function mapMember(row: DbMember): OrganizationMember {
  return {
    id:             row.id,
    organizationId: row.organization_id,
    userId:         row.user_id,
    role:           row.role,
    status:         row.status,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  };
}

function mapClassroom(row: DbRoom): Classroom {
  return {
    id:             row.id,
    organizationId: row.organization_id,
    name:           row.name,
    gradeLevel:     row.grade_level,
    academicYear:   row.academic_year,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    archivedAt:     row.archived_at ?? null,
  };
}

function mapStudent(row: DbStudent): ClassroomStudent {
  return {
    classroomId: row.classroom_id,
    childId:     row.child_id,
    createdAt:   row.created_at,
  };
}

function mapTeacher(row: DbTeacher): ClassroomTeacher {
  return {
    classroomId:    row.classroom_id,
    teacherUserId:  row.teacher_user_id,
    createdAt:      row.created_at,
  };
}

function mapDisplay(row: DbDisplay): UserDisplayInfo {
  return { userId: row.user_id, email: row.email, role: row.role };
}

const SERVER_ORGS: Organization[] = [];
const SERVER_CLASSROOMS: Classroom[] = [];

/**
 * Supabase-backed school/classroom repository.
 *
 * Caches hydrated data in memory and re-notifies subscribers on changes.
 * RLS policies restrict each query to the current authenticated user's scope.
 */
export class SupabaseSchoolRepository implements ISchoolRepository {
  private _orgs: Organization[] = SERVER_ORGS;
  private _members: OrganizationMember[] = [];
  private _classrooms: Classroom[] = SERVER_CLASSROOMS;
  private _classroomStudents: ClassroomStudent[] = [];
  private _classroomTeachers: ClassroomTeacher[] = [];
  private readonly _listeners = new Set<() => void>();
  private _hydratePromise: Promise<void> | null = null;
  private _hydrateGen = 0;

  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── useSyncExternalStore ──────────────────────────────────────────────────────

  subscribe(callback: () => void): () => void {
    this._listeners.add(callback);
    this._triggerHydrate();
    return () => { this._listeners.delete(callback); };
  }

  // ── Organizations ─────────────────────────────────────────────────────────────

  listMyOrganizations(): Organization[] {
    return this._orgs;
  }

  getServerOrganizations(): Organization[] {
    return SERVER_ORGS;
  }

  async createSchoolOrganization(input: CreateOrganizationInput): Promise<Organization> {
    // Use SECURITY DEFINER RPC to atomically insert org + owner membership.
    // Direct INSERT on organizations would hit the RLS chicken-and-egg problem:
    // the org_members INSERT policy (is_org_admin) fails before any member exists.
    const { data: orgId, error: rpcErr } = await this.client.rpc(
      "create_school_organization",
      { p_name: input.name, p_type: input.type },
    );

    if (rpcErr || !orgId) {
      warnRepo("SupabaseSchoolRepository.createSchoolOrganization",
        new QueryError("organizations", "rpc:create_school_organization", rpcErr ?? new Error("no org id returned")));
      throw new Error(rpcErr?.message ?? "Failed to create organization");
    }

    // Fetch the full org row — now readable because the owner member row exists.
    const { data, error: fetchErr } = await this.client
      .from("organizations")
      .select("*")
      .eq("id", orgId)
      .single();

    if (fetchErr || !data) {
      warnRepo("SupabaseSchoolRepository.createSchoolOrganization:fetch",
        new QueryError("organizations", "select", fetchErr ?? new Error("no data")));
      throw new Error(fetchErr?.message ?? "Organization created but could not be fetched");
    }

    const org = mapOrg(data);
    this._orgs = [...this._orgs, org];
    this._notify();
    this.rehydrate();
    return org;
  }

  // ── Classrooms ────────────────────────────────────────────────────────────────

  listClassrooms(organizationId: string): Classroom[] {
    return this._classrooms.filter((c) => c.organizationId === organizationId);
  }

  getClassroomsSnapshot(): Classroom[] {
    return this._classrooms;
  }

  getServerClassroomsSnapshot(): Classroom[] {
    return SERVER_CLASSROOMS;
  }

  listActiveClassrooms(organizationId: string): Classroom[] {
    return this._classrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt === null,
    );
  }

  listArchivedClassrooms(organizationId: string): Classroom[] {
    return this._classrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt !== null,
    );
  }

  getClassroom(classroomId: string): Classroom | null {
    return this._classrooms.find((c) => c.id === classroomId) ?? null;
  }

  async createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    const { data, error } = await this.client
      .from("classrooms")
      .insert({
        organization_id: input.organizationId,
        name:            input.name,
        grade_level:     input.gradeLevel ?? null,
        academic_year:   input.academicYear ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      warnRepo("SupabaseSchoolRepository.createClassroom",
        new QueryError("classrooms", "insert", error ?? new Error("no data")));
      throw new Error(error?.message ?? "Failed to create classroom");
    }

    const classroom = mapClassroom(data);
    this._classrooms = [...this._classrooms, classroom];
    this._notify();
    return classroom;
  }

  async createClassroomForTeacher(
    input: CreateClassroomInput,
    teacherUserId: string,
  ): Promise<Classroom> {
    // Step 1: create the classroom.
    const classroom = await this.createClassroom(input);

    // Step 2: register the creating teacher. If this fails we must not leave
    // a teacherless classroom behind — delete it and surface the error.
    try {
      await this.assignTeacherToClassroom(classroom.id, teacherUserId);
    } catch (assignErr) {
      try {
        await this.client.from("classrooms").delete().eq("id", classroom.id);
      } catch (rollbackErr) {
        warnRepo(
          "SupabaseSchoolRepository.createClassroomForTeacher:rollback",
          rollbackErr instanceof Error ? rollbackErr : new Error(String(rollbackErr)),
        );
      }
      this._classrooms = this._classrooms.filter((c) => c.id !== classroom.id);
      this._notify();
      warnRepo(
        "SupabaseSchoolRepository.createClassroomForTeacher:assign",
        assignErr instanceof Error ? assignErr : new Error(String(assignErr)),
      );
      throw new Error(
        assignErr instanceof Error
          ? `สร้างห้องเรียนไม่สำเร็จ: ${assignErr.message}`
          : "สร้างห้องเรียนไม่สำเร็จ",
      );
    }

    return classroom;
  }

  async updateClassroom(
    classroomId: string,
    patch: UpdateClassroomInput,
  ): Promise<Classroom> {
    const dbPatch: Database["public"]["Tables"]["classrooms"]["Update"] = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.gradeLevel !== undefined) dbPatch.grade_level = patch.gradeLevel;
    if (patch.academicYear !== undefined) dbPatch.academic_year = patch.academicYear;

    const { data, error } = await this.client
      .from("classrooms")
      .update(dbPatch)
      .eq("id", classroomId)
      .select()
      .single();

    if (error || !data) {
      warnRepo("SupabaseSchoolRepository.updateClassroom",
        new QueryError("classrooms", "update", error ?? new Error("no data")));
      throw new Error(error?.message ?? "Failed to update classroom");
    }

    const classroom = mapClassroom(data);
    this._classrooms = this._classrooms.map((c) => (c.id === classroomId ? classroom : c));
    this._notify();
    return classroom;
  }

  async setClassroomArchived(classroomId: string, archived: boolean): Promise<Classroom> {
    // Sets archived_at ONLY — never touches classroom_students,
    // classroom_teachers, child_profiles, or practice history.
    const { data, error } = await this.client
      .from("classrooms")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", classroomId)
      .select()
      .single();

    if (error || !data) {
      warnRepo("SupabaseSchoolRepository.setClassroomArchived",
        new QueryError("classrooms", "update", error ?? new Error("no data")));
      throw new Error(error?.message ?? "Failed to change classroom status");
    }

    const classroom = mapClassroom(data);
    this._classrooms = this._classrooms.map((c) => (c.id === classroomId ? classroom : c));
    this._notify();
    return classroom;
  }

  // ── Classroom assignments ─────────────────────────────────────────────────────

  async assignTeacherToClassroom(classroomId: string, teacherUserId: string): Promise<ClassroomTeacher> {
    const existing = this._classroomTeachers.find(
      (t) => t.classroomId === classroomId && t.teacherUserId === teacherUserId,
    );
    if (existing) return existing;

    const { data, error } = await this.client
      .from("classroom_teachers")
      .insert({ classroom_id: classroomId, teacher_user_id: teacherUserId })
      .select()
      .single();

    if (error || !data) {
      warnRepo("SupabaseSchoolRepository.assignTeacherToClassroom",
        new QueryError("classroom_teachers", "insert", error ?? new Error("no data")));
      throw new Error(error?.message ?? "Failed to assign teacher");
    }

    const entry = mapTeacher(data);
    this._classroomTeachers = [...this._classroomTeachers, entry];
    this._notify();
    return entry;
  }

  async removeTeacherFromClassroom(classroomId: string, teacherUserId: string): Promise<void> {
    const prev = this._classroomTeachers;
    this._classroomTeachers = this._classroomTeachers.filter(
      (t) => !(t.classroomId === classroomId && t.teacherUserId === teacherUserId),
    );
    this._notify();

    const { error } = await this.client
      .from("classroom_teachers")
      .delete()
      .eq("classroom_id", classroomId)
      .eq("teacher_user_id", teacherUserId);

    if (error) {
      this._classroomTeachers = prev;
      this._notify();
      warnRepo("SupabaseSchoolRepository.removeTeacherFromClassroom",
        new QueryError("classroom_teachers", "delete", error));
      throw new Error(error.message);
    }
  }

  async addChildToClassroom(classroomId: string, childId: string): Promise<ClassroomStudent> {
    const existing = this._classroomStudents.find(
      (s) => s.classroomId === classroomId && s.childId === childId,
    );
    if (existing) return existing;

    const { data, error } = await this.client
      .from("classroom_students")
      .insert({ classroom_id: classroomId, child_id: childId })
      .select()
      .single();

    if (error || !data) {
      warnRepo("SupabaseSchoolRepository.addChildToClassroom",
        new QueryError("classroom_students", "insert", error ?? new Error("no data")));
      throw new Error(error?.message ?? "Failed to add child to classroom");
    }

    const entry = mapStudent(data);
    this._classroomStudents = [...this._classroomStudents, entry];
    this._notify();
    return entry;
  }

  async removeChildFromClassroom(classroomId: string, childId: string): Promise<void> {
    const prev = this._classroomStudents;
    this._classroomStudents = this._classroomStudents.filter(
      (s) => !(s.classroomId === classroomId && s.childId === childId),
    );
    this._notify();

    const { error } = await this.client
      .from("classroom_students")
      .delete()
      .eq("classroom_id", classroomId)
      .eq("child_id", childId);

    if (error) {
      this._classroomStudents = prev;
      this._notify();
      warnRepo("SupabaseSchoolRepository.removeChildFromClassroom",
        new QueryError("classroom_students", "delete", error));
      throw new Error(error.message);
    }
  }

  listChildrenForClassroom(classroomId: string): ClassroomStudent[] {
    return this._classroomStudents.filter((s) => s.classroomId === classroomId);
  }

  listClassroomsForTeacher(userId: string): Classroom[] {
    const assignedIds = new Set(
      this._classroomTeachers
        .filter((t) => t.teacherUserId === userId)
        .map((t) => t.classroomId),
    );
    return this._classrooms.filter((c) => assignedIds.has(c.id));
  }

  listTeachersForClassroom(classroomId: string): ClassroomTeacher[] {
    return this._classroomTeachers.filter((t) => t.classroomId === classroomId);
  }

  // ── Session boundary ─────────────────────────────────────────────────────────

  public reset(): void {
    this._hydrateGen++;
    this._hydratePromise = null;
    this._orgs = SERVER_ORGS;
    this._members = [];
    this._classrooms = SERVER_CLASSROOMS;
    this._classroomStudents = [];
    this._classroomTeachers = [];
    this._notify();
  }

  public rehydrate(): void {
    this._hydratePromise = null;
    this._hydrateGen++;
    this._triggerHydrate();
  }

  // ── User display ──────────────────────────────────────────────────────────────

  async findTeacherByEmail(email: string): Promise<UserDisplayInfo | null> {
    const { data, error } = await this.client
      .from("user_display_profiles")
      .select("*")
      .ilike("email", email.trim())
      .maybeSingle();

    if (error) {
      warnRepo("SupabaseSchoolRepository.findTeacherByEmail",
        new QueryError("user_display_profiles", "select", error));
      return null;
    }
    return data ? mapDisplay(data) : null;
  }

  async resolveUserDisplays(userIds: string[]): Promise<Map<string, UserDisplayInfo>> {
    if (userIds.length === 0) return new Map();
    const { data, error } = await this.client
      .from("user_display_profiles")
      .select("*")
      .in("user_id", userIds);

    if (error) {
      warnRepo("SupabaseSchoolRepository.resolveUserDisplays",
        new QueryError("user_display_profiles", "select", error));
      return new Map();
    }
    const result = new Map<string, UserDisplayInfo>();
    for (const row of (data ?? [])) {
      result.set(row.user_id, mapDisplay(row));
    }
    return result;
  }

  // ── Student import ────────────────────────────────────────────────────────────

  async listStudentCodes(organizationId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from("child_profiles")
      .select("student_code")
      .eq("organization_id", organizationId)
      .not("student_code", "is", null)
      .is("archived_at", null);

    if (error) {
      warnRepo("SupabaseSchoolRepository.listStudentCodes",
        new QueryError("child_profiles", "select", error));
      return [];
    }
    return (data ?? [])
      .map((r) => (r as { student_code: string | null }).student_code ?? "")
      .filter(Boolean);
  }

  async importStudents(
    rows: ValidatedImportRow[],
    classrooms: Classroom[],
    organizationId: string,
    creatorUserId: string,
  ): Promise<ImportResult> {
    const classroomMap = new Map(classrooms.map((c) => [c.name, c]));
    const results: ImportRowResult[] = [];

    const { data: { user: currentUser } } = await this.client.auth.getUser();
    const inviterEmail = currentUser?.email ?? undefined;

    for (const row of rows) {
      // Skip rows that cannot be imported
      if (row.status === "error") {
        results.push({ rowNumber: row.rowNumber, status: "failed", message: row.errors.join("; ") });
        continue;
      }
      if (row.isExistingInDb) {
        results.push({ rowNumber: row.rowNumber, status: "skipped", message: row.warnings.find((w) => w.includes("ข้าม")) ?? "ซ้ำ" });
        continue;
      }

      try {
        const { data: profile, error: profileErr } = await this.client
          .from("child_profiles")
          .insert({
            user_id:              creatorUserId,
            name:                 row.name || row.nickname || `Student ${row.studentCode}`,
            age:                  row.age ?? 6,
            target_sound:         row.targetSounds[0] ?? "ก",
            training_goal:        "",
            training_mode:        "speech_clarity",
            selected_sound_id:    row.targetSounds[0] ?? "ก",
            avatar_emoji:         "🧒",
            organization_id:      organizationId,
            student_code:         row.studentCode || null,
            nickname:             row.nickname || null,
            grade_level:          row.gradeLevel || null,
            parent_email_pending: row.parentEmail || null,
          })
          .select()
          .single();

        if (profileErr || !profile) {
          results.push({
            rowNumber: row.rowNumber,
            status:    "failed",
            message:   profileErr?.message ?? "สร้างโปรไฟล์ไม่สำเร็จ",
          });
          continue;
        }

        const classroom = classroomMap.get(row.classroom);
        if (classroom) {
          const { error: csErr } = await this.client
            .from("classroom_students")
            .insert({ classroom_id: classroom.id, child_id: profile.id });

          if (!csErr) {
            const entry: ClassroomStudent = {
              classroomId: classroom.id,
              childId:     profile.id,
              createdAt:   new Date().toISOString(),
            };
            this._classroomStudents = [...this._classroomStudents, entry];
          }
        }

        // Create parent invitation if parent_email provided
        if (row.parentEmail) {
          try {
            await this.ensureParentInvitationForChild(
              profile.id,
              row.parentEmail,
              creatorUserId,
              inviterEmail,
            );
          } catch (invErr) {
            warnRepo("SupabaseSchoolRepository.importStudents:parentInvite",
              invErr instanceof Error ? invErr : new Error(String(invErr)));
          }
        }

        results.push({ rowNumber: row.rowNumber, status: "created" });
      } catch (e) {
        results.push({
          rowNumber: row.rowNumber,
          status:    "failed",
          message:   e instanceof Error ? e.message : "เกิดข้อผิดพลาด",
        });
      }
    }

    this._notify();
    this.rehydrate();

    return {
      results,
      createdCount: results.filter((r) => r.status === "created").length,
      skippedCount: results.filter((r) => r.status === "skipped").length,
      failedCount:  results.filter((r) => r.status === "failed").length,
    };
  }

  async resolveStudentProfiles(
    childIds: string[],
  ): Promise<Map<string, { name: string; nickname: string | null }>> {
    if (childIds.length === 0) return new Map();

    const { data, error } = await this.client
      .from("child_profiles")
      .select("id, name, nickname")
      .in("id", childIds);

    if (error) {
      warnRepo("SupabaseSchoolRepository.resolveStudentProfiles",
        new QueryError("child_profiles", "select", error));
      return new Map();
    }

    const result = new Map<string, { name: string; nickname: string | null }>();
    for (const row of (data ?? [])) {
      result.set(row.id, {
        name:     row.name,
        nickname: (row as { nickname?: string | null }).nickname ?? null,
      });
    }
    return result;
  }

  async archiveStudent(childId: string): Promise<void> {
    const { error } = await this.client.rpc("archive_student", { p_child_id: childId });
    if (error) throw new Error(error.message);
    // Remove from local cache so UI updates immediately
    this._classroomStudents = this._classroomStudents.filter((s) => s.childId !== childId);
    this._notify();
  }

  // ── Parent linking (Phase 15) ─────────────────────────────────────────────────

  async listStudentParentLinks(classroomId: string, organizationId: string): Promise<StudentParentLinkInfo[]> {
    const classroomStudents = this._classroomStudents.filter((s) => s.classroomId === classroomId);
    const childIds = classroomStudents.map((s) => s.childId);
    if (childIds.length === 0) return [];

    const [profilesRes, invitationsRes] = await Promise.all([
      this.client
        .from("child_profiles")
        .select("id, name, nickname, student_code, parent_email_pending")
        .in("id", childIds)
        .eq("organization_id", organizationId),
      this.client
        .from("invitations")
        .select("id, child_id, email, status, token")
        .in("child_id", childIds)
        .eq("role", "parent")
        .order("created_at", { ascending: false }),
    ]);

    if (profilesRes.error) {
      warnRepo("SupabaseSchoolRepository.listStudentParentLinks:profiles",
        new QueryError("child_profiles", "select", profilesRes.error));
      return [];
    }

    // Map childId → best invitation (pending > accepted > revoked)
    const priority = (s: string) => (s === "pending" ? 3 : s === "accepted" ? 2 : 1);
    const invMap = new Map<string, { id: string; token: string; status: string }>();
    for (const inv of (invitationsRes.data ?? [])) {
      if (!inv.child_id) continue;
      const existing = invMap.get(inv.child_id);
      if (!existing || priority(inv.status) > priority(existing.status)) {
        invMap.set(inv.child_id, { id: inv.id, token: inv.token, status: inv.status });
      }
    }

    return (profilesRes.data ?? []).map((p) => {
      const inv = invMap.get(p.id);
      const parentEmail = (p as { parent_email_pending?: string | null }).parent_email_pending ?? null;

      let parentLinkStatus: ParentLinkStatus;
      if (!parentEmail) {
        parentLinkStatus = "no_parent_email";
      } else if (!inv) {
        parentLinkStatus = "missing_invite";
      } else {
        parentLinkStatus = inv.status as ParentLinkStatus;
      }

      return {
        childId:         p.id,
        name:            (p as { name: string }).name,
        nickname:        (p as { nickname?: string | null }).nickname ?? null,
        studentCode:     (p as { student_code?: string | null }).student_code ?? null,
        parentEmail,
        parentLinkStatus,
        invitationId:    inv?.id ?? null,
        invitationToken: inv?.token ?? null,
      };
    });
  }

  async ensureParentInvitationForChild(
    childId: string,
    parentEmail: string,
    invitedBy: string,
    inviterEmail?: string,
  ): Promise<{ id: string; token: string }> {
    const email = parentEmail.trim().toLowerCase();

    // Check for existing pending invitation
    const { data: existing } = await this.client
      .from("invitations")
      .select("id, token")
      .eq("child_id", childId)
      .eq("email", email)
      .eq("role", "parent")
      .eq("status", "pending")
      .maybeSingle();

    if (existing) return { id: existing.id, token: existing.token };

    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error } = await this.client.from("invitations").insert({
      id,
      email,
      role: "parent",
      child_id:      childId,
      invited_by:    invitedBy,
      inviter_email: inviterEmail ?? null,
      token,
      status:        "pending",
      expires_at:    expiresAt,
    });

    if (error) {
      // Race condition: another insert beat us — fetch the winner
      const { data: raceWinner } = await this.client
        .from("invitations")
        .select("id, token")
        .eq("child_id", childId)
        .eq("email", email)
        .eq("role", "parent")
        .eq("status", "pending")
        .maybeSingle();
      if (raceWinner) return { id: raceWinner.id, token: raceWinner.token };
      warnRepo("SupabaseSchoolRepository.ensureParentInvitationForChild",
        new QueryError("invitations", "insert", error));
      throw new Error(error.message);
    }

    return { id, token };
  }

  async revokeParentLink(childId: string): Promise<void> {
    const { error } = await this.client.rpc("revoke_parent_link_for_child", {
      p_child_id: childId,
    });
    if (error) throw new Error(error.message);
  }

  // ── Classroom membership (Teacher V2 Phase 2) ────────────────────────────────

  async createStudentInClassroom(
    classroomId: string,
    organizationId: string,
    teacherUserId: string,
    input: CreateClassroomStudentInput,
  ): Promise<ClassroomStudent> {
    // Step 1: create a teacher-managed profile. Owned by the teacher,
    // stamped with organization_id so it is an org student — NOT parent
    // linked (no parent_email_pending, no invitation).
    const { data: profile, error: profileErr } = await this.client
      .from("child_profiles")
      .insert({
        user_id:           teacherUserId,
        name:              input.name,
        age:               input.age ?? 6,
        target_sound:      "ก",
        training_goal:     "",
        training_mode:     "speech_clarity",
        selected_sound_id: "ก",
        avatar_emoji:      "🧒",
        organization_id:   organizationId,
        nickname:          input.nickname || null,
        grade_level:       input.gradeLevel || null,
      })
      .select()
      .single();

    if (profileErr || !profile) {
      warnRepo("SupabaseSchoolRepository.createStudentInClassroom:profile",
        new QueryError("child_profiles", "insert", profileErr ?? new Error("no data")));
      throw new Error(profileErr?.message ?? "สร้างโปรไฟล์นักเรียนไม่สำเร็จ");
    }

    // Step 2: enrol. On failure, roll the profile back so we don't leave an
    // orphan child_profiles row the teacher never sees in any classroom.
    try {
      return await this.addChildToClassroom(classroomId, profile.id);
    } catch (enrolErr) {
      try {
        await this.client.from("child_profiles").delete().eq("id", profile.id);
      } catch (rollbackErr) {
        warnRepo("SupabaseSchoolRepository.createStudentInClassroom:rollback",
          rollbackErr instanceof Error ? rollbackErr : new Error(String(rollbackErr)));
      }
      warnRepo("SupabaseSchoolRepository.createStudentInClassroom:enrol",
        enrolErr instanceof Error ? enrolErr : new Error(String(enrolErr)));
      throw new Error(
        enrolErr instanceof Error
          ? `เพิ่มนักเรียนไม่สำเร็จ: ${enrolErr.message}`
          : "เพิ่มนักเรียนไม่สำเร็จ",
      );
    }
  }

  async moveStudentBetweenClassrooms(
    childId: string,
    fromClassroomId: string,
    toClassroomId: string,
  ): Promise<void> {
    if (fromClassroomId === toClassroomId) return;

    const from = this._classrooms.find((c) => c.id === fromClassroomId);
    const to = this._classrooms.find((c) => c.id === toClassroomId);
    if (!from || !to) throw new Error("ไม่พบห้องเรียน");
    if (from.organizationId !== to.organizationId) {
      throw new Error("ไม่สามารถย้ายนักเรียนข้ามองค์กรได้");
    }

    // Add to the destination first; only remove from the source once the
    // child is safely enrolled in the target, so a failure never drops the
    // child out of every classroom.
    await this.addChildToClassroom(toClassroomId, childId);
    await this.removeChildFromClassroom(fromClassroomId, childId);
  }

  async listClassroomStudentDetails(classroomId: string): Promise<ClassroomStudentDetail[]> {
    const rows = this._classroomStudents.filter((s) => s.classroomId === classroomId);
    if (rows.length === 0) return [];

    const { data: { user } } = await this.client.auth.getUser();
    const ids = rows.map((r) => r.childId);

    const { data, error } = await this.client
      .from("child_profiles")
      .select("id, name, nickname, avatar_emoji, user_id")
      .in("id", ids);

    if (error) {
      warnRepo("SupabaseSchoolRepository.listClassroomStudentDetails",
        new QueryError("child_profiles", "select", error));
    }

    const profileMap = new Map(
      (data ?? []).map((p) => [
        p.id,
        p as { id: string; name: string; nickname: string | null; avatar_emoji: string | null; user_id: string },
      ]),
    );

    return rows
      .map((r) => {
        const p = profileMap.get(r.childId);
        return {
          childId:        r.childId,
          classroomId:    r.classroomId,
          name:           p?.name ?? "นักเรียน",
          nickname:       p?.nickname ?? null,
          avatarEmoji:    p?.avatar_emoji ?? null,
          addedAt:        r.createdAt,
          teacherManaged: !!(p && user && p.user_id === user.id),
        };
      })
      .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
  }

  async listTeacherStudentDirectory(userId: string): Promise<TeacherStudentDirectoryEntry[]> {
    const myClassroomIds = new Set(
      this._classroomTeachers.filter((t) => t.teacherUserId === userId).map((t) => t.classroomId),
    );
    const activeClassrooms = this._classrooms.filter(
      (c) => myClassroomIds.has(c.id) && c.archivedAt === null,
    );
    const activeIds = new Set(activeClassrooms.map((c) => c.id));
    const classroomNameMap = new Map(activeClassrooms.map((c) => [c.id, c.name]));

    const membership = this._classroomStudents.filter((s) => activeIds.has(s.classroomId));
    if (membership.length === 0) return [];

    const childIds = [...new Set(membership.map((s) => s.childId))];
    const { data, error } = await this.client
      .from("child_profiles")
      .select("id, name, nickname, avatar_emoji")
      .in("id", childIds);

    if (error) {
      warnRepo("SupabaseSchoolRepository.listTeacherStudentDirectory",
        new QueryError("child_profiles", "select", error));
    }
    const profileMap = new Map(
      (data ?? []).map((p) => [
        p.id,
        p as { id: string; name: string; nickname: string | null; avatar_emoji: string | null },
      ]),
    );

    const byChild = new Map<string, TeacherStudentDirectoryEntry>();
    for (const m of membership) {
      let entry = byChild.get(m.childId);
      if (!entry) {
        const p = profileMap.get(m.childId);
        entry = {
          childId:     m.childId,
          name:        p?.name ?? "นักเรียน",
          nickname:    p?.nickname ?? null,
          avatarEmoji: p?.avatar_emoji ?? null,
          classrooms:  [],
        };
        byChild.set(m.childId, entry);
      }
      const name = classroomNameMap.get(m.classroomId);
      if (name && !entry.classrooms.some((c) => c.id === m.classroomId)) {
        entry.classrooms.push({ id: m.classroomId, name });
      }
    }

    return [...byChild.values()].sort((a, b) => a.name.localeCompare(b.name, "th"));
  }

  async getStudentProfile(
    childId: string,
    teacherUserId: string,
  ): Promise<TeacherStudentProfile | null> {
    if (!childId) return null;

    const { data, error } = await this.client
      .from("child_profiles")
      .select("id, name, nickname, avatar_emoji, age, grade_level, training_mode, target_sound, user_id")
      .eq("id", childId)
      .maybeSingle();

    if (error) {
      warnRepo("SupabaseSchoolRepository.getStudentProfile",
        new QueryError("child_profiles", "select", error));
      return null;
    }
    if (!data) return null; // does not exist OR no access — caller must not distinguish

    const row = data as {
      id: string; name: string; nickname: string | null; avatar_emoji: string | null;
      age: number | null; grade_level: string | null; training_mode: string;
      target_sound: string | null; user_id: string;
    };

    // Which of the teacher's classrooms currently contain this child.
    const myClassroomIds = new Set(
      this._classroomTeachers.filter((t) => t.teacherUserId === teacherUserId).map((t) => t.classroomId),
    );
    const classrooms = this._classroomStudents
      .filter((s) => s.childId === childId && myClassroomIds.has(s.classroomId))
      .map((s) => this._classrooms.find((c) => c.id === s.classroomId))
      .filter((c): c is NonNullable<typeof c> => !!c && c.archivedAt === null)
      .map((c) => ({ id: c.id, name: c.name }));

    return {
      childId:       row.id,
      name:          row.name,
      nickname:      row.nickname ?? null,
      avatarEmoji:   row.avatar_emoji ?? null,
      age:           row.age ?? null,
      gradeLevel:    row.grade_level ?? null,
      trainingMode:  row.training_mode ?? "speech_clarity",
      targetSound:   row.target_sound ?? null,
      teacherManaged: row.user_id === teacherUserId,
      classrooms,
    };
  }

  // ── Teacher self-serve provisioning (Teacher V2 Phase 1) ──────────────────────

  async ensureTeacherOrganization(_userId: string): Promise<{ organizationId: string }> {
    // Delegates the check-then-create to a SECURITY DEFINER RPC so it's
    // atomic (advisory-locked per user) even under concurrent calls — see
    // supabase/migrations/*_ensure_teacher_organization.sql. auth.uid() is
    // used server-side, so the userId param isn't sent explicitly.
    const { data: orgId, error } = await this.client.rpc("ensure_teacher_organization", {
      p_name: DEFAULT_TEACHER_ORGANIZATION_NAME,
    });

    if (error || !orgId) {
      warnRepo("SupabaseSchoolRepository.ensureTeacherOrganization",
        new QueryError("organizations", "rpc:ensure_teacher_organization", error ?? new Error("no org id returned")));
      throw new Error(error?.message ?? "Failed to provision teacher organization");
    }

    // Refresh the cache so listMyOrganizations()/listClassroomsForTeacher()
    // reflect the (possibly newly created) organization immediately.
    this.rehydrate();

    return { organizationId: orgId };
  }

  public setScope(_userId: string | null): void {
    // Scope handled via Supabase RLS
  }

  // ── Private ───────────────────────────────────────────────────────────────────

  private _notify(): void {
    this._listeners.forEach((cb) => cb());
  }

  private _triggerHydrate(): void {
    if (this._hydratePromise) return;
    this._hydratePromise = this._hydrate().catch((err) => {
      warnRepo("SupabaseSchoolRepository._hydrate", err);
    });
  }

  private async _hydrate(): Promise<void> {
    const myGen = this._hydrateGen;

    const { data: { user } } = await this.client.auth.getUser();
    if (!user || this._hydrateGen !== myGen) return;

    const [orgsRes, membersRes, roomsRes, studentsRes, teachersRes] = await Promise.all([
      this.client.from("organizations").select("*"),
      this.client.from("organization_members").select("*").eq("user_id", user.id),
      this.client.from("classrooms").select("*"),
      this.client.from("classroom_students").select("*"),
      // No user filter here — RLS handles scoping:
      //   org members see all teachers in their org's classrooms
      //   teachers (non-org-members) see only their own assignments
      this.client.from("classroom_teachers").select("*"),
    ]);

    if (this._hydrateGen !== myGen) return;

    if (orgsRes.error)     warnRepo("SupabaseSchoolRepository._hydrate:orgs",     new QueryError("organizations", "select", orgsRes.error));
    if (membersRes.error)  warnRepo("SupabaseSchoolRepository._hydrate:members",  new QueryError("organization_members", "select", membersRes.error));
    if (roomsRes.error)    warnRepo("SupabaseSchoolRepository._hydrate:classrooms", new QueryError("classrooms", "select", roomsRes.error));
    if (studentsRes.error) warnRepo("SupabaseSchoolRepository._hydrate:students", new QueryError("classroom_students", "select", studentsRes.error));
    if (teachersRes.error) warnRepo("SupabaseSchoolRepository._hydrate:teachers", new QueryError("classroom_teachers", "select", teachersRes.error));

    this._orgs             = (orgsRes.data     ?? []).map(mapOrg);
    this._members          = (membersRes.data  ?? []).map(mapMember);
    this._classrooms       = (roomsRes.data    ?? []).map(mapClassroom);
    this._classroomStudents = (studentsRes.data ?? []).map(mapStudent);
    this._classroomTeachers = (teachersRes.data ?? []).map(mapTeacher);
    this._notify();
  }
}
