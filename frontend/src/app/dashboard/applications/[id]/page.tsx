import type { Metadata } from "next";

import { EditApplicationForm } from "@/components/applications/EditApplicationForm";

export const metadata: Metadata = {
  title: "Edit application",
  description: "Edit or delete an application",
};

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditApplicationForm applicationId={id} />;
}
