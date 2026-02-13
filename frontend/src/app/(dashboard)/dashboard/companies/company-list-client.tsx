"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteCompany } from "@/actions/company";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  officialName: string | null;
  taxNumber: string | null;
  email: string | null;
  phone: string | null;
  country: { id: string; name: string } | null;
  city: { id: string; name: string } | null;
}

function ActionsCell({ company }: { company: Company }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`"${company.name}" sirketini silmek istediginizden emin misiniz?`))
      return;
    const result = await deleteCompany(company.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Sirket silindi");
      router.refresh();
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/companies/${company.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/companies/${company.id}?edit=true`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sirket Adi" />
    ),
  },
  {
    accessorKey: "taxNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vergi No" />
    ),
    cell: ({ row }) => row.original.taxNumber || "-",
  },
  {
    accessorKey: "country",
    header: "Ulke",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.country?.name || "-"}</Badge>
    ),
  },
  {
    accessorKey: "city",
    header: "Sehir",
    cell: ({ row }) => row.original.city?.name || "-",
  },
  {
    accessorKey: "email",
    header: "E-posta",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Islemler</div>,
    cell: ({ row }) => <ActionsCell company={row.original} />,
  },
];

export function CompanyListClient({ companies }: { companies: Company[] }) {
  return (
    <DataTable
      columns={columns}
      data={companies}
      searchKey="name"
      searchPlaceholder="Sirket ara..."
      toolbar={
        <Button asChild>
          <Link href="/dashboard/companies/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Sirket
          </Link>
        </Button>
      }
    />
  );
}
