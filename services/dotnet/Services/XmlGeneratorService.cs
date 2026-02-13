using System.Security.Cryptography;
using System.Text;
using System.Xml.Linq;
using EcosferServices.Models;
using Npgsql;

namespace EcosferServices.Services;

/// <summary>
/// CBAM Declaration XML Generator
/// Generates EU-compliant XML for annual CBAM declarations
/// Uses System.Xml.Linq (XDocument/XElement) per EU specification
/// </summary>
public class XmlGeneratorService
{
    private readonly string _connectionString;
    private static readonly XNamespace CbamNs = "urn:eu:ec:cbam:declaration:v1";

    public XmlGeneratorService(string connectionString)
    {
        _connectionString = connectionString;
    }

    /// <summary>
    /// Generate complete CBAM Declaration XML for a given declaration ID
    /// </summary>
    public async Task<XmlGenerationResult> GenerateDeclarationXml(string declarationId, string tenantId)
    {
        var result = new XmlGenerationResult { DeclarationId = declarationId };

        try
        {
            // 1. Load declaration data from DB
            var data = await LoadDeclarationData(declarationId, tenantId);
            if (data == null)
            {
                result.Error = $"Declaration not found: {declarationId}";
                return result;
            }

            // 2. Build XML document
            var doc = BuildXmlDocument(data);

            // 3. Validate business rules
            var validationErrors = ValidateBusinessRules(data);
            result.ValidationErrors = validationErrors;

            if (validationErrors.Count > 0)
            {
                result.Warnings.Add($"{validationErrors.Count} business rule validation issue(s) found");
            }

            // 4. Serialize to string
            var xmlString = doc.Declaration?.ToString() + Environment.NewLine + doc.ToString();
            result.XmlContent = xmlString;

            // 5. Calculate SHA-256 hash
            result.Sha256Hash = ComputeSha256Hash(xmlString);

            result.Success = true;
        }
        catch (Exception ex)
        {
            result.Error = $"XML generation failed: {ex.Message}";
        }

        return result;
    }

    private XDocument BuildXmlDocument(DeclarationData data)
    {
        var doc = new XDocument(
            new XDeclaration("1.0", "UTF-8", "yes"),
            new XElement(CbamNs + "CBAMDeclaration",
                new XAttribute(XNamespace.Xmlns + "cbam", CbamNs.NamespaceName),
                new XAttribute("version", "1.0"),
                new XAttribute("generatedAt", DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")),

                // Declaration Header
                BuildDeclarationHeader(data),

                // Declarant Information
                BuildDeclarantInfo(data),

                // Goods Imported
                BuildGoodsImported(data),

                // Embedded Emissions Summary
                BuildEmissionsSummary(data),

                // Certificates Surrendered
                BuildCertificatesSurrendered(data),

                // Free Allocation Adjustments
                BuildFreeAllocationAdjustments(data),

                // Verification Statement
                BuildVerificationStatement(data),

                // Integrity
                new XElement(CbamNs + "IntegrityCheck",
                    new XElement(CbamNs + "Algorithm", "SHA-256"),
                    new XElement(CbamNs + "GeneratedBy", "Ecosfer SKDM Platform v2.0")
                )
            )
        );

        return doc;
    }

    private XElement BuildDeclarationHeader(DeclarationData data)
    {
        return new XElement(CbamNs + "DeclarationHeader",
            new XElement(CbamNs + "DeclarationId", data.Id),
            new XElement(CbamNs + "ReportingYear", data.Year),
            new XElement(CbamNs + "Status", data.Status),
            data.SubmissionDate.HasValue
                ? new XElement(CbamNs + "SubmissionDate", data.SubmissionDate.Value.ToString("yyyy-MM-dd"))
                : null!,
            data.TotalEmissions.HasValue
                ? new XElement(CbamNs + "TotalEmbeddedEmissions",
                    new XAttribute("unit", "tCO2e"),
                    data.TotalEmissions.Value)
                : null!,
            data.TotalCertificates.HasValue
                ? new XElement(CbamNs + "TotalCertificatesSurrendered", data.TotalCertificates.Value)
                : null!,
            data.Notes != null ? new XElement(CbamNs + "Notes", data.Notes) : null!
        );
    }

    private XElement BuildDeclarantInfo(DeclarationData data)
    {
        return new XElement(CbamNs + "DeclarantInformation",
            new XElement(CbamNs + "CompanyName", data.CompanyName ?? ""),
            data.CompanyTaxNumber != null
                ? new XElement(CbamNs + "TaxIdentificationNumber", data.CompanyTaxNumber)
                : null!,
            data.CompanyAddress != null
                ? new XElement(CbamNs + "Address", data.CompanyAddress)
                : null!,
            data.CompanyCountry != null
                ? new XElement(CbamNs + "Country", data.CompanyCountry)
                : null!
        );
    }

    private XElement BuildGoodsImported(DeclarationData data)
    {
        var goodsElement = new XElement(CbamNs + "GoodsImported",
            new XAttribute("count", data.ImportedGoods.Count)
        );

        foreach (var good in data.ImportedGoods)
        {
            goodsElement.Add(new XElement(CbamNs + "Good",
                new XElement(CbamNs + "GoodsCategory", good.GoodsCategoryName ?? ""),
                good.CnCode != null ? new XElement(CbamNs + "CNCode", good.CnCode) : null!,
                good.CountryOfOrigin != null ? new XElement(CbamNs + "CountryOfOrigin", good.CountryOfOrigin) : null!,
                good.InstallationName != null ? new XElement(CbamNs + "InstallationOfOrigin", good.InstallationName) : null!,
                good.ProductionRoute != null ? new XElement(CbamNs + "ProductionRoute", good.ProductionRoute) : null!,
                good.QuantityImported.HasValue
                    ? new XElement(CbamNs + "QuantityImported",
                        good.Unit != null ? new XAttribute("unit", good.Unit) : null!,
                        good.QuantityImported.Value)
                    : null!,
                new XElement(CbamNs + "EmbeddedEmissions",
                    good.SpecificEmbeddedEmissions.HasValue
                        ? new XElement(CbamNs + "SpecificEmbeddedEmissions",
                            new XAttribute("unit", "tCO2e/t"),
                            good.SpecificEmbeddedEmissions.Value)
                        : null!,
                    good.TotalEmbeddedEmissions.HasValue
                        ? new XElement(CbamNs + "TotalEmbeddedEmissions",
                            new XAttribute("unit", "tCO2e"),
                            good.TotalEmbeddedEmissions.Value)
                        : null!,
                    good.DirectEmissions.HasValue
                        ? new XElement(CbamNs + "DirectEmissions",
                            new XAttribute("unit", "tCO2e"),
                            good.DirectEmissions.Value)
                        : null!,
                    good.IndirectEmissions.HasValue
                        ? new XElement(CbamNs + "IndirectEmissions",
                            new XAttribute("unit", "tCO2e"),
                            good.IndirectEmissions.Value)
                        : null!,
                    good.EmissionSource != null
                        ? new XElement(CbamNs + "EmissionSource", good.EmissionSource)
                        : null!
                )
            ));
        }

        return goodsElement;
    }

    private XElement BuildEmissionsSummary(DeclarationData data)
    {
        decimal totalDirect = data.ImportedGoods.Sum(g => g.DirectEmissions ?? 0);
        decimal totalIndirect = data.ImportedGoods.Sum(g => g.IndirectEmissions ?? 0);
        decimal totalEmbedded = data.ImportedGoods.Sum(g => g.TotalEmbeddedEmissions ?? 0);

        return new XElement(CbamNs + "EmissionsSummary",
            new XElement(CbamNs + "TotalDirectEmissions",
                new XAttribute("unit", "tCO2e"), totalDirect),
            new XElement(CbamNs + "TotalIndirectEmissions",
                new XAttribute("unit", "tCO2e"), totalIndirect),
            new XElement(CbamNs + "TotalEmbeddedEmissions",
                new XAttribute("unit", "tCO2e"), totalEmbedded)
        );
    }

    private XElement BuildCertificatesSurrendered(DeclarationData data)
    {
        var certElement = new XElement(CbamNs + "CertificatesSurrendered",
            new XAttribute("count", data.CertificatesSurrendered.Count),
            new XAttribute("totalQuantity", data.CertificatesSurrendered.Sum(c => c.Quantity))
        );

        foreach (var cert in data.CertificatesSurrendered)
        {
            certElement.Add(new XElement(CbamNs + "Certificate",
                new XElement(CbamNs + "CertificateNumber", cert.CertificateNo ?? ""),
                new XElement(CbamNs + "Quantity", cert.Quantity),
                new XElement(CbamNs + "SurrenderDate", cert.SurrenderDate.ToString("yyyy-MM-dd")),
                cert.PricePerTonne.HasValue
                    ? new XElement(CbamNs + "PricePerTonne",
                        new XAttribute("currency", "EUR"),
                        cert.PricePerTonne.Value)
                    : null!
            ));
        }

        return certElement;
    }

    private XElement BuildFreeAllocationAdjustments(DeclarationData data)
    {
        var adjustElement = new XElement(CbamNs + "FreeAllocationAdjustments",
            new XAttribute("count", data.FreeAllocationAdjustments.Count)
        );

        foreach (var adj in data.FreeAllocationAdjustments)
        {
            adjustElement.Add(new XElement(CbamNs + "Adjustment",
                new XElement(CbamNs + "Type", adj.AdjustmentType ?? ""),
                adj.Amount.HasValue
                    ? new XElement(CbamNs + "Amount", adj.Amount.Value)
                    : null!,
                adj.Description != null
                    ? new XElement(CbamNs + "Description", adj.Description)
                    : null!,
                adj.EffectiveDate.HasValue
                    ? new XElement(CbamNs + "EffectiveDate", adj.EffectiveDate.Value.ToString("yyyy-MM-dd"))
                    : null!
            ));
        }

        return adjustElement;
    }

    private XElement BuildVerificationStatement(DeclarationData data)
    {
        var v = data.Verification;
        if (v == null)
        {
            return new XElement(CbamNs + "VerificationStatement",
                new XElement(CbamNs + "Status", "NOT_PROVIDED")
            );
        }

        return new XElement(CbamNs + "VerificationStatement",
            new XElement(CbamNs + "Status", "PROVIDED"),
            v.VerifierName != null ? new XElement(CbamNs + "VerifierName", v.VerifierName) : null!,
            v.VerifierAccreditation != null ? new XElement(CbamNs + "AccreditationNumber", v.VerifierAccreditation) : null!,
            v.Opinion != null ? new XElement(CbamNs + "Opinion", v.Opinion) : null!,
            v.VerificationPeriod != null ? new XElement(CbamNs + "VerificationPeriod", v.VerificationPeriod) : null!,
            v.IssueDate.HasValue ? new XElement(CbamNs + "IssueDate", v.IssueDate.Value.ToString("yyyy-MM-dd")) : null!,
            v.Notes != null ? new XElement(CbamNs + "Notes", v.Notes) : null!
        );
    }

    private List<string> ValidateBusinessRules(DeclarationData data)
    {
        var errors = new List<string>();

        if (data.Year < 2023 || data.Year > 2035)
            errors.Add($"Reporting year {data.Year} is outside valid range (2023-2035)");

        if (string.IsNullOrEmpty(data.CompanyName))
            errors.Add("Company name is required");

        if (data.ImportedGoods.Count == 0)
            errors.Add("At least one imported good must be declared");

        foreach (var good in data.ImportedGoods)
        {
            if (string.IsNullOrEmpty(good.CnCode))
                errors.Add($"CN code is missing for good: {good.GoodsCategoryName}");

            if (!good.TotalEmbeddedEmissions.HasValue || good.TotalEmbeddedEmissions <= 0)
                errors.Add($"Total embedded emissions must be positive for: {good.GoodsCategoryName}");
        }

        // Certificates check
        int totalSurrendered = data.CertificatesSurrendered.Sum(c => c.Quantity);
        if (data.TotalCertificates.HasValue && totalSurrendered != data.TotalCertificates.Value)
            errors.Add($"Certificate surrender total ({totalSurrendered}) doesn't match declaration total ({data.TotalCertificates.Value})");

        return errors;
    }

    private static string ComputeSha256Hash(string xml)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(xml));
        return Convert.ToHexStringLower(bytes);
    }

    /// <summary>
    /// Load declaration data including goods, certificates, verifications from PostgreSQL
    /// </summary>
    private async Task<DeclarationData?> LoadDeclarationData(string declarationId, string tenantId)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // 1. Load declaration
        await using var cmdDecl = new NpgsqlCommand(@"
            SELECT d.id, d.year, d.status, d.""submissionDate"", d.""totalEmissions"",
                   d.""totalCertificates"", d.notes, d.""tenantId"",
                   t.name as tenant_name
            FROM annual_declarations d
            LEFT JOIN tenants t ON t.id = d.""tenantId""
            WHERE d.id = @id AND d.""tenantId"" = @tenantId", conn);
        cmdDecl.Parameters.AddWithValue("id", declarationId);
        cmdDecl.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdr = await cmdDecl.ExecuteReaderAsync();
        if (!await rdr.ReadAsync()) return null;

        var data = new DeclarationData
        {
            Id = rdr.GetString(0),
            Year = rdr.GetInt32(1),
            Status = rdr.GetString(2),
            SubmissionDate = rdr.IsDBNull(3) ? null : rdr.GetDateTime(3),
            TotalEmissions = rdr.IsDBNull(4) ? null : rdr.GetDecimal(4),
            TotalCertificates = rdr.IsDBNull(5) ? null : rdr.GetInt32(5),
            Notes = rdr.IsDBNull(6) ? null : rdr.GetString(6),
            TenantId = rdr.GetString(7),
            TenantName = rdr.IsDBNull(8) ? null : rdr.GetString(8)
        };
        await rdr.CloseAsync();

        // 2. Load company info (first company of the tenant)
        await using var cmdCompany = new NpgsqlCommand(@"
            SELECT c.name, c.""taxNumber"", c.address,
                   co.name as country_name
            FROM companies c
            LEFT JOIN countries co ON co.id = c.""countryId""
            WHERE c.""tenantId"" = @tenantId
            LIMIT 1", conn);
        cmdCompany.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdrComp = await cmdCompany.ExecuteReaderAsync();
        if (await rdrComp.ReadAsync())
        {
            data.CompanyName = rdrComp.IsDBNull(0) ? null : rdrComp.GetString(0);
            data.CompanyTaxNumber = rdrComp.IsDBNull(1) ? null : rdrComp.GetString(1);
            data.CompanyAddress = rdrComp.IsDBNull(2) ? null : rdrComp.GetString(2);
            data.CompanyCountry = rdrComp.IsDBNull(3) ? null : rdrComp.GetString(3);
        }
        await rdrComp.CloseAsync();

        // 3. Load imported goods (from installation data + goods categories + production processes)
        await using var cmdGoods = new NpgsqlCommand(@"
            SELECT gc.name as category_name,
                   cn.code as cn_code,
                   co.name as country_of_origin,
                   inst.name as installation_name,
                   rpp.""dTotalProductionLevelValue"" as qty,
                   rpp.""dDirectlyAttributableEmissionsValue"" as direct_em,
                   rpp.""dEmissionsFromHeatBalanceValue"" as heat_em,
                   rpp.""dEmissionsFromWasteGasesBalanceValue"" as waste_em,
                   igcr.""routeType""
            FROM installation_datas id
            JOIN installations inst ON inst.id = id.""installationId""
            LEFT JOIN installation_goods_category_and_routes igcr ON igcr.""installationDataId"" = id.id
            LEFT JOIN goods_categories gc ON gc.id = igcr.""goodsCategoryId""
            LEFT JOIN relevant_production_processes rpp ON rpp.""installationDataId"" = id.id
                AND rpp.""goodsCategoryId"" = igcr.""goodsCategoryId""
            LEFT JOIN cn_codes cn ON cn.""goodsCategoryId"" = gc.id
            LEFT JOIN countries co ON co.id = inst.""countryId""
            WHERE id.""tenantId"" = @tenantId
            ORDER BY gc.name", conn);
        cmdGoods.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdrGoods = await cmdGoods.ExecuteReaderAsync();
        var seenCategories = new HashSet<string>();
        while (await rdrGoods.ReadAsync())
        {
            var catName = rdrGoods.IsDBNull(0) ? "" : rdrGoods.GetString(0);
            if (seenCategories.Contains(catName)) continue;
            seenCategories.Add(catName);

            var direct = rdrGoods.IsDBNull(5) ? 0m : rdrGoods.GetDecimal(5);
            var heat = rdrGoods.IsDBNull(6) ? 0m : rdrGoods.GetDecimal(6);
            var waste = rdrGoods.IsDBNull(7) ? 0m : rdrGoods.GetDecimal(7);

            data.ImportedGoods.Add(new ImportedGood
            {
                GoodsCategoryName = catName,
                CnCode = rdrGoods.IsDBNull(1) ? null : rdrGoods.GetString(1),
                CountryOfOrigin = rdrGoods.IsDBNull(2) ? null : rdrGoods.GetString(2),
                InstallationName = rdrGoods.IsDBNull(3) ? null : rdrGoods.GetString(3),
                QuantityImported = rdrGoods.IsDBNull(4) ? null : rdrGoods.GetDecimal(4),
                DirectEmissions = direct,
                IndirectEmissions = heat + waste,
                TotalEmbeddedEmissions = direct + heat + waste,
                ProductionRoute = rdrGoods.IsDBNull(8) ? null : rdrGoods.GetString(8)
            });
        }
        await rdrGoods.CloseAsync();

        // 4. Load certificate surrenders
        await using var cmdCerts = new NpgsqlCommand(@"
            SELECT cb.""certificateNo"", cs.quantity, cs.""surrenderDate"", cb.""pricePerTonne""
            FROM certificate_surrenders cs
            JOIN cbam_certificates cb ON cb.id = cs.""certificateId""
            WHERE cs.""declarationId"" = @declarationId", conn);
        cmdCerts.Parameters.AddWithValue("declarationId", declarationId);

        await using var rdrCerts = await cmdCerts.ExecuteReaderAsync();
        while (await rdrCerts.ReadAsync())
        {
            data.CertificatesSurrendered.Add(new CertificateSurrenderData
            {
                CertificateNo = rdrCerts.IsDBNull(0) ? null : rdrCerts.GetString(0),
                Quantity = rdrCerts.GetInt32(1),
                SurrenderDate = rdrCerts.GetDateTime(2),
                PricePerTonne = rdrCerts.IsDBNull(3) ? null : rdrCerts.GetDecimal(3)
            });
        }
        await rdrCerts.CloseAsync();

        // 5. Load free allocation adjustments
        await using var cmdAdj = new NpgsqlCommand(@"
            SELECT ""adjustmentType"", amount, description, ""effectiveDate""
            FROM free_allocation_adjustments
            WHERE ""declarationId"" = @declarationId", conn);
        cmdAdj.Parameters.AddWithValue("declarationId", declarationId);

        await using var rdrAdj = await cmdAdj.ExecuteReaderAsync();
        while (await rdrAdj.ReadAsync())
        {
            data.FreeAllocationAdjustments.Add(new FreeAllocationData
            {
                AdjustmentType = rdrAdj.IsDBNull(0) ? null : rdrAdj.GetString(0),
                Amount = rdrAdj.IsDBNull(1) ? null : rdrAdj.GetDecimal(1),
                Description = rdrAdj.IsDBNull(2) ? null : rdrAdj.GetString(2),
                EffectiveDate = rdrAdj.IsDBNull(3) ? null : rdrAdj.GetDateTime(3)
            });
        }
        await rdrAdj.CloseAsync();

        // 6. Load verification document
        await using var cmdVerify = new NpgsqlCommand(@"
            SELECT ""verifierName"", ""verifierAccreditation"", opinion,
                   ""verificationPeriod"", ""issueDate"", notes
            FROM verification_documents
            WHERE ""tenantId"" = @tenantId
            ORDER BY ""createdAt"" DESC
            LIMIT 1", conn);
        cmdVerify.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdrVerify = await cmdVerify.ExecuteReaderAsync();
        if (await rdrVerify.ReadAsync())
        {
            data.Verification = new VerificationData
            {
                VerifierName = rdrVerify.IsDBNull(0) ? null : rdrVerify.GetString(0),
                VerifierAccreditation = rdrVerify.IsDBNull(1) ? null : rdrVerify.GetString(1),
                Opinion = rdrVerify.IsDBNull(2) ? null : rdrVerify.GetString(2),
                VerificationPeriod = rdrVerify.IsDBNull(3) ? null : rdrVerify.GetString(3),
                IssueDate = rdrVerify.IsDBNull(4) ? null : rdrVerify.GetDateTime(4),
                Notes = rdrVerify.IsDBNull(5) ? null : rdrVerify.GetString(5)
            };
        }
        await rdrVerify.CloseAsync();

        return data;
    }
}
