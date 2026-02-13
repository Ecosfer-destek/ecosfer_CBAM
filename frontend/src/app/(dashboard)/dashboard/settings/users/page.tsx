import { getUsers } from "@/actions/auth";
import { UserManagementClient } from "./user-management-client";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kullanici Yonetimi</h1>
        <p className="text-muted-foreground">
          Sirketinizdeki kullanicilari yonetin
        </p>
      </div>
      <UserManagementClient initialUsers={users} />
    </div>
  );
}
