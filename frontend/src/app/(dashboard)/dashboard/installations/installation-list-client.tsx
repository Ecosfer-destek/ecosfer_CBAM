"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteInstallation } from "@/actions/installation";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Installation {
  id: string;
  name: string;
  company: { id: string; name: string } | null;
  country: { id: string; name: string } | null;
  city: { id: string; name: string } | null;
  email: string | null;
}

function ActionsCell({ installation }: { installation: Installation }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`"${installation.name}" tesisini silmek istediginizden emin misiniz?`))
      return;
    const result = await deleteInstallation(installation.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Tesis silindi");
      router.refresh();
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/installations/${installation.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/installations/${installation.id}?edit=true`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

const columns: ColumnDef<Installation>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tesis Adi" />
    ),
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sirket" />
    ),
    cell: ({ row }) => (
      <Link
        href={`/dashboard/companies/${row.original.company?.id}`}
        className="text-primary hover:underline"
      >
        {row.original.company?.name || "-"}
      </Link>
    ),
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
    id: "actions",
    header: () => <div className="text-right">Islemler</div>,
    cell: ({ row }) => <ActionsCell installation={row.original} />,
  },
];

export function InstallationListClient({
  installations,
}: {
  installations: Installation[];
}) {
  return (
    <DataTable
      columns={columns}
      data={installations}
      searchKey="name"
      searchPlaceholder="Tesis ara..."
      toolbar={
        <Button asChild>
          <Link href="/dashboard/installations/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Tesis
          </Link>
        </Button>
      }
    />
  );
}
