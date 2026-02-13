"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteInstallationData } from "@/actions/installation-data";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InstallationDataItem {
  id: string;
  startDate: Date | null;
  endDate: Date | null;
  installation: {
    id: string;
    name: string;
    company: { name: string } | null;
  } | null;
}

function ActionsCell({ item }: { item: InstallationDataItem }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Bu veri kaydını silmek istediğinizden emin misiniz?")) return;
    const result = await deleteInstallationData(item.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Veri kaydi silindi");
      router.refresh();
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/installation-data/${item.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

const columns: ColumnDef<InstallationDataItem>[] = [
  {
    id: "installation",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tesis" />
    ),
    accessorFn: (row) => row.installation?.name || "-",
  },
  {
    id: "company",
    header: "Şirket",
    accessorFn: (row) => row.installation?.company?.name || "-",
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Başlangıç" />
    ),
    cell: ({ row }) =>
      row.original.startDate
        ? new Date(row.original.startDate).toLocaleDateString("tr-TR")
        : "-",
  },
  {
    accessorKey: "endDate",
    header: "Bitiş",
    cell: ({ row }) =>
      row.original.endDate
        ? new Date(row.original.endDate).toLocaleDateString("tr-TR")
        : "-",
  },
  {
    id: "actions",
    header: () => <div className="text-right">İşlemler</div>,
    cell: ({ row }) => <ActionsCell item={row.original} />,
  },
];

export function InstallationDataListClient({
  dataList,
}: {
  dataList: InstallationDataItem[];
}) {
  return (
    <DataTable
      columns={columns}
      data={dataList}
      searchKey="installation"
      searchPlaceholder="Tesis ara..."
      toolbar={
        <Button asChild>
          <Link href="/dashboard/installation-data/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Veri Kaydı
          </Link>
        </Button>
      }
    />
  );
}
