// Auth domain types for Speech Adventure.
// Supabase-specific shapes are mapped here so the rest of the app
// never imports from @supabase/supabase-js directly.

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export type AuthLoadingState = "initializing" | "ready";

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loadingState: AuthLoadingState;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}
