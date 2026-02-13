import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;

// Models that have a tenantId field and require tenant isolation
const TENANT_SCOPED_MODELS = new Set([
  "company",
  "installation",
  "person",
  "installationData",
  "supplier",
  "report",
  "reportTemplate",
  "reportVerifierCompany",
  "reportVerifierRepresentative",
  "annualDeclaration",
  "cbamCertificate",
  "monitoringPlan",
  "verificationDocument",
  "authorisationApplication",
  "operatorRegistration",
  "accreditedVerifier",
  "indirectCustomsRepresentative",
  "importer",
]);

/**
 * Creates a tenant-scoped Prisma client that automatically filters
 * queries by tenantId and injects tenantId on creates.
 */
export function createTenantClient(tenantId: string): PrismaClient {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          // findUnique can't add extra where clauses easily,
          // so we rely on the unique constraint + post-check
          const result = await query(args);
          if (
            TENANT_SCOPED_MODELS.has(model) &&
            result &&
            "tenantId" in result &&
            (result as { tenantId: string }).tenantId !== tenantId
          ) {
            return null;
          }
          return result;
        },
        async create({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.data = { ...args.data, tenantId };
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                tenantId,
              }));
            } else {
              args.data = { ...args.data, tenantId };
            }
          }
          return query(args);
        },
        async update({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId } as typeof args.where;
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (TENANT_SCOPED_MODELS.has(model)) {
            args.where = { ...args.where, tenantId };
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}
