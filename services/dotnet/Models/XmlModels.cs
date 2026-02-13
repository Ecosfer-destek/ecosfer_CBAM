namespace EcosferServices.Models;

public class XmlGenerationResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string? XmlContent { get; set; }
    public string? Sha256Hash { get; set; }
    public List<string> ValidationErrors { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
    public string DeclarationId { get; set; } = "";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class DeclarationData
{
    // Declaration header
    public string Id { get; set; } = "";
    public int Year { get; set; }
    public string Status { get; set; } = "";
    public DateTime? SubmissionDate { get; set; }
    public decimal? TotalEmissions { get; set; }
    public int? TotalCertificates { get; set; }
    public string? Notes { get; set; }
    public string TenantId { get; set; } = "";

    // Tenant/Company info
    public string? TenantName { get; set; }
    public string? CompanyName { get; set; }
    public string? CompanyTaxNumber { get; set; }
    public string? CompanyAddress { get; set; }
    public string? CompanyCountry { get; set; }

    // Goods imported (from installation data)
    public List<ImportedGood> ImportedGoods { get; set; } = [];

    // Certificates surrendered
    public List<CertificateSurrenderData> CertificatesSurrendered { get; set; } = [];

    // Free allocation adjustments
    public List<FreeAllocationData> FreeAllocationAdjustments { get; set; } = [];

    // Verification
    public VerificationData? Verification { get; set; }
}

public class ImportedGood
{
    public string? GoodsCategoryName { get; set; }
    public string? CnCode { get; set; }
    public string? CountryOfOrigin { get; set; }
    public string? InstallationName { get; set; }
    public decimal? QuantityImported { get; set; }
    public string? Unit { get; set; }
    public decimal? SpecificEmbeddedEmissions { get; set; }
    public decimal? TotalEmbeddedEmissions { get; set; }
    public decimal? DirectEmissions { get; set; }
    public decimal? IndirectEmissions { get; set; }
    public string? EmissionSource { get; set; }
    public string? ProductionRoute { get; set; }
}

public class CertificateSurrenderData
{
    public string? CertificateNo { get; set; }
    public int Quantity { get; set; }
    public DateTime SurrenderDate { get; set; }
    public decimal? PricePerTonne { get; set; }
}

public class FreeAllocationData
{
    public string? AdjustmentType { get; set; }
    public decimal? Amount { get; set; }
    public string? Description { get; set; }
    public DateTime? EffectiveDate { get; set; }
}

public class VerificationData
{
    public string? VerifierName { get; set; }
    public string? VerifierAccreditation { get; set; }
    public string? Opinion { get; set; }
    public string? VerificationPeriod { get; set; }
    public DateTime? IssueDate { get; set; }
    public string? Notes { get; set; }
}
