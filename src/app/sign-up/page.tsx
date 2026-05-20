import { permanentRedirect } from "next/navigation";

// Alias route — canonical URL is /auth/signup
export default function SignUpAlias() {
  permanentRedirect("/auth/signup");
}
