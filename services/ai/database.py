from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def fetch_emission_data(db, installation_id: str, tenant_id: str) -> list[dict]:
    """Fetch emission records for an installation, grouped by period."""
    query = text("""
        SELECT
            e.id,
            e."createdAt",
            e."aDValue",
            e."eFValue",
            e."directEmissions",
            e."indirectEmissions",
            e."totalCo2Emissions",
            id2."reportingYear",
            et."name" as emission_type
        FROM "Emission" e
        JOIN "InstallationData" id2 ON e."installationDataId" = id2.id
        LEFT JOIN "EmissionType" et ON e."emissionTypeId" = et.id
        WHERE id2."installationId" = :installation_id
          AND id2."tenantId" = :tenant_id
        ORDER BY id2."reportingYear" ASC, e."createdAt" ASC
    """)
    result = db.execute(query, {"installation_id": installation_id, "tenant_id": tenant_id})
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]


def fetch_installation_summary(db, installation_id: str, tenant_id: str) -> dict | None:
    """Fetch installation basic info for report narrative."""
    query = text("""
        SELECT
            i.id,
            i."name" as installation_name,
            c."name" as company_name,
            co."name" as country_name
        FROM "Installation" i
        JOIN "Company" c ON i."companyId" = c.id
        LEFT JOIN "Country" co ON i."countryId" = co.id
        WHERE i.id = :installation_id
          AND i."tenantId" = :tenant_id
        LIMIT 1
    """)
    result = db.execute(query, {"installation_id": installation_id, "tenant_id": tenant_id})
    row = result.fetchone()
    return dict(row._mapping) if row else None


def fetch_balance_data(db, installation_id: str, tenant_id: str) -> list[dict]:
    """Fetch GHG balance data for analysis."""
    query = text("""
        SELECT
            gb.id,
            gb."directEmissions",
            gb."indirectEmissions",
            gb."totalEmissions",
            id2."reportingYear"
        FROM "GhgBalanceByType" gb
        JOIN "InstallationData" id2 ON gb."installationDataId" = id2.id
        WHERE id2."installationId" = :installation_id
          AND id2."tenantId" = :tenant_id
        ORDER BY id2."reportingYear" ASC
    """)
    result = db.execute(query, {"installation_id": installation_id, "tenant_id": tenant_id})
    rows = result.fetchall()
    return [dict(row._mapping) for row in rows]
