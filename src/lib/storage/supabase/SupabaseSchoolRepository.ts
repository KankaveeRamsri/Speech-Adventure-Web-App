import type { ISchoolRepository } from "@/lib/repositories/ISchoolRepository";
import type {
  Organization,
  OrganizationMember,
  Classroom,
  ClassroomStudent,
  ClassroomTeacher,
  CreateOrganizationInput,
  CreateClassroomInput,
} from "@/types/school";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { QueryError, warnRepo } from "./errors";

type DbOrg    = Database["public"]["Tables"]["organizations"]["Row"];
type DbMember = Database["public"]["Tables"]["organization_members"]["Row"];
type DbRoom   = Database["public"]["Tables"]["classrooms"]["Row"];
type DbStudent = Database["public"]["Tables"]["classroom_students"]["Row"];
type DbTeacher = Database["public"]["Tables"]["classroom_teachers"]["Row"];

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

const SERVER_ORGS: Organization[] = [];

/**
 * Supabase-backed school/classroom repository.
 *
 * Caches hydrated data in memory and re-notifies subscribers on changes.
 * RLS policies restrict each query to the current authenticated user's scope.
 */
export class SupabaseSchoolRepository implements ISchoolRepository {
  private _orgs: Organization[] = SERVER_ORGS;
  private _members: OrganizationMember[] = [];
  private _classrooms: Classroom[] = [];
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
    this._classrooms = [];
    this._classroomStudents = [];
    this._classroomTeachers = [];
    this._notify();
  }

  public rehydrate(): void {
    this._hydratePromise = null;
    this._hydrateGen++;
    this._triggerHydrate();
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
      this.client.from("classroom_teachers").select("*").eq("teacher_user_id", user.id),
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
