import { notFound } from "next/navigation";
import { getInstallation } from "@/actions/installation";
import { InstallationDetailClient } from "./installation-detail-client";

export default async function InstallationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const installation = await getInstallation(id);

  if (!installation) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <InstallationDetailClient installation={installation as any} />;
}
