import { getUsers } from "@/actions/auth";
import { UserManagementClient } from "./user-management-client";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground">
          Şirketinizdeki kullanıcıları yönetin
        </p>
      </div>
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
