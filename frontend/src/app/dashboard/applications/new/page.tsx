import type { Metadata } from "next";

import { CreateApplicationForm } from "@/components/applications/CreateApplicationForm";

export const metadata: Metadata = {
  title: "New application",
  description: "Create a new job application entry",
};

export default function NewApplicationPage() {
  return <CreateApplicationForm />;
}
