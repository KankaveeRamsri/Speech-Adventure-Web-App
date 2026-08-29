import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { localRead, localWrite } from "@/lib/storage/local/localStorageClient";
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
  UserDisplayInfo,
  StudentParentLinkInfo,
} from "@/types/school";
import type { ValidatedImportRow, ImportResult, ImportRowResult } from "@/types/schoolImport";
import { DEFAULT_TEACHER_ORGANIZATION_NAME } from "@/types/school";

// ── Stored shape ───────────────────────────────────────────────────────────────

interface SchoolStore {
  organizations: Organization[];
  members: OrganizationMember[];
  classrooms: Classroom[];
  classroomStudents: ClassroomStudent[];
  classroomTeachers: ClassroomTeacher[];
}

const EMPTY_STORE: SchoolStore = {
  organizations: [],
  members: [],
  classrooms: [],
  classroomStudents: [],
  classroomTeachers: [],
};

const SERVER_ORGS: Organization[] = [];

// ── Module-level state (shared key — org data visible to all users on device) ──

let _store: SchoolStore = EMPTY_STORE;
let _userId: string | null = null;
let _initialized = false;
const _listeners = new Set<() => void>();

// In-flight guard for ensureTeacherOrganization — prevents a duplicate org
// being created if the hook that calls it fires twice in the same tick
// (e.g. React StrictMode double-invoking an effect) before the first
// createSchoolOrganization() write has landed.
let _ensureOrgPromise: Promise<{ organizationId: string }> | null = null;
let _ensureOrgUserId: string | null = null;

function _isBrowser(): boolean {
  return typeof window !== "undefined";
}

function _read(): SchoolStore {
  try {
    const raw = localRead(STORAGE_KEYS.SCHOOL);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<SchoolStore>;
    return {
      organizations: parsed.organizations ?? [],
      members: parsed.members ?? [],
      // Normalize archivedAt for rows written before Phase 2.
      classrooms: (parsed.classrooms ?? []).map((c) => ({ ...c, archivedAt: c.archivedAt ?? null })),
      classroomStudents: parsed.classroomStudents ?? [],
      classroomTeachers: parsed.classroomTeachers ?? [],
    };
  } catch {
    return EMPTY_STORE;
  }
}

function _write(): void {
  localWrite(STORAGE_KEYS.SCHOOL, JSON.stringify(_store));
}

function _init(): void {
  if (!_isBrowser() || _initialized) return;
  _initialized = true;
  _store = _read();
}

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

function _id(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * localStorage-backed school repository.
 *
 * Uses a single unscoped key (all school data shared on same device) so that
 * school admin and teacher on the same device can both access the same data
 * in local/demo mode. setScope() keeps _userId for org membership filtering.
 */
export class LocalSchoolRepository implements ISchoolRepository {
  subscribe(callback: () => void): () => void {
    _listeners.add(callback);
    return () => { _listeners.delete(callback); };
  }

  // ── Organizations ─────────────────────────────────────────────────────────────

  listMyOrganizations(): Organization[] {
    _init();
    if (!_userId) return [];
    const memberOrgIds = new Set(
      _store.members
        .filter((m) => m.userId === _userId && m.status === "active")
        .map((m) => m.organizationId),
    );
    return _store.organizations.filter((o) => memberOrgIds.has(o.id));
  }

  getServerOrganizations(): Organization[] {
    return SERVER_ORGS;
  }

  async createSchoolOrganization(input: CreateOrganizationInput): Promise<Organization> {
    _init();
    const now = new Date().toISOString();
    const org: Organization = {
      id: _id(),
      name: input.name,
      type: input.type,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    };
    // Auto-add creator as owner member
    const member: OrganizationMember = {
      id: _id(),
      organizationId: org.id,
      userId: input.createdBy,
      role: "owner",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    _store = {
      ..._store,
      organizations: [..._store.organizations, org],
      members: [..._store.members, member],
    };
    _write();
    _notify();
    return org;
  }

  // ── Classrooms ────────────────────────────────────────────────────────────────

  listClassrooms(organizationId: string): Classroom[] {
    _init();
    return _store.classrooms.filter((c) => c.organizationId === organizationId);
  }

  listActiveClassrooms(organizationId: string): Classroom[] {
    _init();
    return _store.classrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt === null,
    );
  }

  listArchivedClassrooms(organizationId: string): Classroom[] {
    _init();
    return _store.classrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt !== null,
    );
  }

  getClassroom(classroomId: string): Classroom | null {
    _init();
    return _store.classrooms.find((c) => c.id === classroomId) ?? null;
  }

  async createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    _init();
    const now = new Date().toISOString();
    const classroom: Classroom = {
      id: _id(),
      organizationId: input.organizationId,
      name: input.name,
      gradeLevel: input.gradeLevel ?? null,
      academicYear: input.academicYear ?? null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };
    _store = { ..._store, classrooms: [..._store.classrooms, classroom] };
    _write();
    _notify();
    return classroom;
  }

  async createClassroomForTeacher(
    input: CreateClassroomInput,
    teacherUserId: string,
  ): Promise<Classroom> {
    const classroom = await this.createClassroom(input);
    try {
      await this.assignTeacherToClassroom(classroom.id, teacherUserId);
    } catch (err) {
      _store = {
        ..._store,
        classrooms: _store.classrooms.filter((c) => c.id !== classroom.id),
      };
      _write();
      _notify();
      throw err instanceof Error ? err : new Error("สร้างห้องเรียนไม่สำเร็จ");
    }
    return classroom;
  }

  async updateClassroom(
    classroomId: string,
    patch: UpdateClassroomInput,
  ): Promise<Classroom> {
    _init();
    let updated: Classroom | null = null;
    _store = {
      ..._store,
      classrooms: _store.classrooms.map((c) => {
        if (c.id !== classroomId) return c;
        updated = {
          ...c,
          name: patch.name ?? c.name,
          gradeLevel: patch.gradeLevel !== undefined ? patch.gradeLevel : c.gradeLevel,
          academicYear:
            patch.academicYear !== undefined ? patch.academicYear : c.academicYear,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    };
    if (!updated) throw new Error("ไม่พบห้องเรียน");
    _write();
    _notify();
    return updated;
  }

  async setClassroomArchived(classroomId: string, archived: boolean): Promise<Classroom> {
    _init();
    let updated: Classroom | null = null;
    _store = {
      ..._store,
      classrooms: _store.classrooms.map((c) => {
        if (c.id !== classroomId) return c;
        updated = {
          ...c,
          archivedAt: archived ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        };
        return updated;
      }),
    };
    if (!updated) throw new Error("ไม่พบห้องเรียน");
    _write();
    _notify();
    return updated;
  }

  // ── Classroom assignments ─────────────────────────────────────────────────────

  async assignTeacherToClassroom(classroomId: string, teacherUserId: string): Promise<ClassroomTeacher> {
    _init();
    const existing = _store.classroomTeachers.find(
      (t) => t.classroomId === classroomId && t.teacherUserId === teacherUserId,
    );
    if (existing) return existing;
    const entry: ClassroomTeacher = {
      classroomId,
      teacherUserId,
      createdAt: new Date().toISOString(),
    };
    _store = { ..._store, classroomTeachers: [..._store.classroomTeachers, entry] };
    _write();
    _notify();
    return entry;
  }

  async removeTeacherFromClassroom(classroomId: string, teacherUserId: string): Promise<void> {
    _init();
    _store = {
      ..._store,
      classroomTeachers: _store.classroomTeachers.filter(
        (t) => !(t.classroomId === classroomId && t.teacherUserId === teacherUserId),
      ),
    };
    _write();
    _notify();
  }

  async addChildToClassroom(classroomId: string, childId: string): Promise<ClassroomStudent> {
    _init();
    const existing = _store.classroomStudents.find(
      (s) => s.classroomId === classroomId && s.childId === childId,
    );
    if (existing) return existing;
    const entry: ClassroomStudent = {
      classroomId,
      childId,
      createdAt: new Date().toISOString(),
    };
    _store = { ..._store, classroomStudents: [..._store.classroomStudents, entry] };
    _write();
    _notify();
    return entry;
  }

  async removeChildFromClassroom(classroomId: string, childId: string): Promise<void> {
    _init();
    _store = {
      ..._store,
      classroomStudents: _store.classroomStudents.filter(
        (s) => !(s.classroomId === classroomId && s.childId === childId),
      ),
    };
    _write();
    _notify();
  }

  listChildrenForClassroom(classroomId: string): ClassroomStudent[] {
    _init();
    return _store.classroomStudents.filter((s) => s.classroomId === classroomId);
  }

  async createStudentInClassroom(
    classroomId: string,
    _organizationId: string,
    _teacherUserId: string,
    _input: CreateClassroomStudentInput,
  ): Promise<ClassroomStudent> {
    // local/demo mode does not persist child_profiles here — just enrol a
    // synthetic membership row so the UI flow is exercisable offline.
    return this.addChildToClassroom(classroomId, _id());
  }

  async moveStudentBetweenClassrooms(
    childId: string,
    fromClassroomId: string,
    toClassroomId: string,
  ): Promise<void> {
    if (fromClassroomId === toClassroomId) return;
    const from = _store.classrooms.find((c) => c.id === fromClassroomId);
    const to = _store.classrooms.find((c) => c.id === toClassroomId);
    if (from && to && from.organizationId !== to.organizationId) {
      throw new Error("ไม่สามารถย้ายนักเรียนข้ามองค์กรได้");
    }
    await this.addChildToClassroom(toClassroomId, childId);
    await this.removeChildFromClassroom(fromClassroomId, childId);
  }

  async listClassroomStudentDetails(classroomId: string): Promise<ClassroomStudentDetail[]> {
    _init();
    return _store.classroomStudents
      .filter((s) => s.classroomId === classroomId)
      .map((s) => ({
        childId:        s.childId,
        classroomId:    s.classroomId,
        name:           `นักเรียน ${s.childId.slice(0, 6)}`,
        nickname:       null,
        avatarEmoji:    null,
        addedAt:        s.createdAt,
        teacherManaged: true,
      }));
  }

  async listTeacherStudentDirectory(userId: string): Promise<TeacherStudentDirectoryEntry[]> {
    _init();
    const myClassroomIds = new Set(
      _store.classroomTeachers.filter((t) => t.teacherUserId === userId).map((t) => t.classroomId),
    );
    const active = _store.classrooms.filter(
      (c) => myClassroomIds.has(c.id) && c.archivedAt === null,
    );
    const nameMap = new Map(active.map((c) => [c.id, c.name]));
    const byChild = new Map<string, TeacherStudentDirectoryEntry>();
    for (const s of _store.classroomStudents) {
      if (!nameMap.has(s.classroomId)) continue;
      let entry = byChild.get(s.childId);
      if (!entry) {
        entry = {
          childId: s.childId,
          name: `นักเรียน ${s.childId.slice(0, 6)}`,
          nickname: null,
          avatarEmoji: null,
          classrooms: [],
        };
        byChild.set(s.childId, entry);
      }
      entry.classrooms.push({ id: s.classroomId, name: nameMap.get(s.classroomId)! });
    }
    return [...byChild.values()];
  }

  listClassroomsForTeacher(userId: string): Classroom[] {
    _init();
    const classroomIds = new Set(
      _store.classroomTeachers
        .filter((t) => t.teacherUserId === userId)
        .map((t) => t.classroomId),
    );
    return _store.classrooms.filter((c) => classroomIds.has(c.id));
  }

  listTeachersForClassroom(classroomId: string): ClassroomTeacher[] {
    _init();
    return _store.classroomTeachers.filter((t) => t.classroomId === classroomId);
  }

  // ── User display ──────────────────────────────────────────────────────────────

  async findTeacherByEmail(_email: string): Promise<UserDisplayInfo | null> {
    return null; // not available in local/demo mode
  }

  async resolveUserDisplays(_userIds: string[]): Promise<Map<string, UserDisplayInfo>> {
    return new Map(); // not available in local/demo mode
  }

  // ── Student profile resolution ───────────────────────────────────────────────

  async resolveStudentProfiles(
    _childIds: string[],
  ): Promise<Map<string, { name: string; nickname: string | null }>> {
    return new Map(); // not available in local/demo mode
  }

  // ── Student import (local/demo mode — minimal mock) ──────────────────────────

  async listStudentCodes(_organizationId: string): Promise<string[]> {
    return []; // not tracked in local storage
  }

  async importStudents(
    rows: ValidatedImportRow[],
    classrooms: Classroom[],
    _organizationId: string,
    _creatorUserId: string,
  ): Promise<ImportResult> {
    _init();
    const classroomMap = new Map(classrooms.map((c) => [c.name, c]));
    const results: ImportRowResult[] = [];

    for (const row of rows) {
      if (row.status === "error") {
        results.push({ rowNumber: row.rowNumber, status: "failed", message: row.errors.join("; ") });
        continue;
      }
      if (row.isExistingInDb) {
        results.push({ rowNumber: row.rowNumber, status: "skipped" });
        continue;
      }

      const classroom = classroomMap.get(row.classroom);
      if (classroom) {
        const entry: ClassroomStudent = {
          classroomId: classroom.id,
          childId:     _id(),
          createdAt:   new Date().toISOString(),
        };
        _store = { ..._store, classroomStudents: [..._store.classroomStudents, entry] };
      }

      results.push({ rowNumber: row.rowNumber, status: "created" });
    }

    _write();
    _notify();

    return {
      results,
      createdCount: results.filter((r) => r.status === "created").length,
      skippedCount: results.filter((r) => r.status === "skipped").length,
      failedCount:  results.filter((r) => r.status === "failed").length,
    };
  }

  async archiveStudent(_childId: string): Promise<void> {
    // Not implemented in local/demo mode — no-op
  }

  // ── Parent linking (Phase 15) — not available in local/demo mode ──────────────

  async listStudentParentLinks(_classroomId: string, _organizationId: string): Promise<StudentParentLinkInfo[]> {
    return [];
  }

  async ensureParentInvitationForChild(
    _childId: string,
    _parentEmail: string,
    _invitedBy: string,
    _inviterEmail?: string,
  ): Promise<{ id: string; token: string }> {
    return { id: _id(), token: _id() };
  }

  async revokeParentLink(_childId: string): Promise<void> {
    // Not implemented in local/demo mode — no-op
  }

  // ── Teacher self-serve provisioning (Teacher V2 Phase 1) ──────────────────────

  async ensureTeacherOrganization(userId: string): Promise<{ organizationId: string }> {
    _init();

    const existing = _store.members.find(
      (m) => m.userId === userId && (m.role === "owner" || m.role === "admin") && m.status === "active",
    );
    if (existing) return { organizationId: existing.organizationId };

    if (_ensureOrgPromise && _ensureOrgUserId === userId) return _ensureOrgPromise;

    _ensureOrgUserId = userId;
    _ensureOrgPromise = this.createSchoolOrganization({
      name: DEFAULT_TEACHER_ORGANIZATION_NAME,
      type: "school",
      createdBy: userId,
    })
      .then((org) => ({ organizationId: org.id }))
      .finally(() => {
        _ensureOrgPromise = null;
        _ensureOrgUserId = null;
      });

    return _ensureOrgPromise;
  }

  // ── Scope ─────────────────────────────────────────────────────────────────────

  setScope(userId: string | null): void {
    _userId = userId;
    _init();
    _notify();
  }
}
