import { notFound } from "next/navigation";
import { getCompany } from "@/actions/company";
import { CompanyDetailClient } from "./company-detail-client";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);

  if (!company) {
    notFound();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <CompanyDetailClient company={company as any} />;
}
