import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      tenantId: string;
      tenantName: string;
      permissions: string[];
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    tenantId: string;
    tenantName: string;
    permissions: string[];
  }
}
