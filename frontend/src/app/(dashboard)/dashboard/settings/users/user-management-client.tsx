"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, deleteUser, updateUser } from "@/actions/auth";
import { toast } from "sonner";
import { Plus, Trash2, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Sistem Yoneticisi",
  COMPANY_ADMIN: "Sirket Yoneticisi",
  OPERATOR: "Operator",
  SUPPLIER: "Tedarikci",
  CBAM_DECLARANT: "CBAM Beyancisi",
  VERIFIER: "Dogrulayici",
};

const ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export function UserManagementClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERATOR",
  });
  const [isCreating, setIsCreating] = useState(false);

  async function handleCreate() {
    setIsCreating(true);
    const result = await createUser(newUser);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Kullanici olusturuldu");
      setShowCreateDialog(false);
      setNewUser({ name: "", email: "", password: "", role: "OPERATOR" });
      router.refresh();
    }
    setIsCreating(false);
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    const result = await updateUser(userId, { isActive: !currentActive });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        currentActive ? "Kullanici devre disi birakildi" : "Kullanici aktif edildi"
      );
      router.refresh();
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Bu kullaniciyi silmek istediginizden emin misiniz?")) return;
    const result = await deleteUser(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Kullanici silindi");
      router.refresh();
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const result = await updateUser(userId, { role });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Kullanici rolu guncellendi");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kullanici
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanici Olustur</DialogTitle>
              <DialogDescription>
                Sirketinize yeni bir kullanici ekleyin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Ad Soyad</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Sifre</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) =>
                    setNewUser((u) => ({ ...u, role: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Iptal
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "Olusturuluyor..." : "Olustur"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Son Giris</TableHead>
              <TableHead className="text-right">Islemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Henuz kullanici bulunmuyor
                </TableCell>
              </TableRow>
            ) : (
              initialUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString("tr-TR")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(user.id, user.isActive)
                        }
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
