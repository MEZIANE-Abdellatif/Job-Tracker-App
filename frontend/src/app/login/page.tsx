import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${BRAND_NAME}.`,
};

export default function LoginPage() {
  return <LoginForm />;
}
