import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Create account",
  description: `Create an account for ${BRAND_NAME}.`,
};

export default function RegisterPage() {
  return <RegisterForm />;
}
