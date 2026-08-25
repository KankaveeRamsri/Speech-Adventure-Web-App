// Re-exported from the provider so every existing import path
// (`@/hooks/useTrustedAppRole`) keeps working unchanged. The actual
// resolution now happens once, at the app root — see
// src/providers/TrustedRoleProvider.tsx.
export {
  useTrustedAppRole,
  type TrustedAppRoleStatus,
  type TrustedAppRoleResult,
} from "@/providers/TrustedRoleProvider";
