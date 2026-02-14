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
import { useTranslations } from "next-intl";

const ROLE_KEYS = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "OPERATOR",
  "SUPPLIER",
  "CBAM_DECLARANT",
  "VERIFIER",
] as const;

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
  const t = useTranslations("settings.usersPage");
  const tAuth = useTranslations("auth");
  const tCommon = useTranslations("common");
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
      toast.success(t("userCreated"));
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
        currentActive ? t("userDeactivated") : t("userActivated")
      );
      router.refresh();
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm(t("confirmDelete"))) return;
    const result = await deleteUser(userId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("userDeleted"));
      router.refresh();
    }
  }

  async function handleRoleChange(userId: string, role: string) {
    const result = await updateUser(userId, { role });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("roleUpdated"));
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
              {t("newUser")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createUser")}</DialogTitle>
              <DialogDescription>
                {t("createUserDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t("fullName")}</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("email")}</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("password")}</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t("role")}</Label>
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
                    {ROLE_KEYS.map((role) => (
                      <SelectItem key={role} value={role}>
                        {tAuth(`roles.${role}`)}
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
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? tCommon("creating") : tCommon("create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fullName")}</TableHead>
              <TableHead>{t("email")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("lastLogin")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t("noUsers")}
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
                        {ROLE_KEYS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {tAuth(`roles.${role}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
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
