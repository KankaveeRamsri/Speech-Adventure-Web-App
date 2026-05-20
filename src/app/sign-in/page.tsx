import { permanentRedirect } from "next/navigation";

// Alias route — canonical URL is /auth/signin
export default function SignInAlias() {
  permanentRedirect("/auth/signin");
}
