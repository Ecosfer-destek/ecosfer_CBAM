import { getUsers } from "@/actions/auth";
import { UserManagementClient } from "./user-management-client";
import { getTranslations } from "next-intl/server";

export default async function UsersPage() {
  const t = await getTranslations("settings");
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("usersPage.title")}</h1>
        <p className="text-muted-foreground">
          {t("usersPage.subtitle")}
        </p>
      </div>
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
