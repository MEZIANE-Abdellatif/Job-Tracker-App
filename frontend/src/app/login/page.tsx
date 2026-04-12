import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Log in to Job tracker",
};

export default function LoginPage() {
  return <LoginForm />;
}
