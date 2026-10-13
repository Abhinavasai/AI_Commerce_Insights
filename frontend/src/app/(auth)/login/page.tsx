import { redirect } from "next/navigation";

/** Login disabled for Vercel demo — go straight to the Signal deck. */
export default function LoginPage() {
  redirect("/dashboard");
}
