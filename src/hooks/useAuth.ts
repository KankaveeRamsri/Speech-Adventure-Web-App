import { useAuthContext } from "@/providers/AuthProvider";

export function useAuth() {
  return useAuthContext();
}

// Re-export role helpers so callers can import from one place.
export {
  getUserRole,
  isParent,
  isTeacher,
  isTherapist,
  isSchoolAdmin,
  isProfessionalRole,
} from "@/lib/auth/roleHelpers";
