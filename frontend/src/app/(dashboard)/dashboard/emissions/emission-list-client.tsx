"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteEmission } from "@/actions/emission";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmt(val: any): string {
  if (val === null || val === undefined) return "-";
  return Number(val).toLocaleString("tr-TR", { maximumFractionDigits: 4 });
}

interface EmissionItem {
  id: string;
  sourceStreamName: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adActivityData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  co2eFossil: any;
  emissionType: { id: string; name: string; code: string | null } | null;
  emissionMethod: { id: string; name: string } | null;
  typeOfGhg: { id: string; name: string } | null;
  installationData: {
    id: string;
    installation: { name: string } | null;
  } | null;
}

function ActionsCell({ emission }: { emission: EmissionItem }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Bu emisyon kaydini silmek istediginizden emin misiniz?"))
      return;
    const result = await deleteEmission(emission.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Emisyon silindi");
      router.refresh();
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link href={`/dashboard/emissions/${emission.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="outline" size="icon" onClick={handleDelete}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

const columns: ColumnDef<EmissionItem>[] = [
  {
    accessorKey: "sourceStreamName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kaynak Akisi" />
    ),
    cell: ({ row }) => row.original.sourceStreamName || "-",
  },
  {
    id: "installation",
    header: "Tesis",
    accessorFn: (row) =>
      row.installationData?.installation?.name || "-",
  },
  {
    id: "emissionType",
    header: "Tip",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.emissionType?.code || "-"}
      </Badge>
    ),
  },
  {
    id: "ghg",
    header: "GHG",
    cell: ({ row }) => row.original.typeOfGhg?.name || "-",
  },
  {
    accessorKey: "adActivityData",
    header: "AD",
    cell: ({ row }) => fmt(row.original.adActivityData),
  },
  {
    accessorKey: "co2eFossil",
    header: "CO2e Fosil",
    cell: ({ row }) => fmt(row.original.co2eFossil),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Islemler</div>,
    cell: ({ row }) => <ActionsCell emission={row.original} />,
  },
];

export function EmissionListClient({
  emissions,
}: {
  emissions: EmissionItem[];
}) {
  return (
    <DataTable
      columns={columns}
      data={emissions}
      searchKey="sourceStreamName"
      searchPlaceholder="Kaynak akisi ara..."
      toolbar={
        <Button asChild>
          <Link href="/dashboard/emissions/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Emisyon
          </Link>
        </Button>
      }
    />
  );
}
