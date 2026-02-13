namespace EcosferServices.Models;

public class PdfGenerationResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public byte[]? PdfContent { get; set; }
    public string FileName { get; set; } = "";
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}

public class PdfReportRequest
{
    public string InstallationDataId { get; set; } = "";
    public string TenantId { get; set; } = "";
    public string? Language { get; set; } = "tr";
}

public class InstallationSummaryData
{
    // Company & Installation
    public string CompanyName { get; set; } = "";
    public string? CompanyAddress { get; set; }
    public string? CompanyCountry { get; set; }
    public string InstallationName { get; set; } = "";
    public string? InstallationAddress { get; set; }
    public string? InstallationCountry { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Goods categories
    public List<GoodsCategoryRow> GoodsCategories { get; set; } = [];

    // Emissions summary
    public List<EmissionSummaryRow> Emissions { get; set; } = [];
    public decimal TotalCo2eFossil { get; set; }
    public decimal TotalCo2eBio { get; set; }
    public decimal TotalEnergyTJ { get; set; }

    // Fuel balance
    public List<FuelBalanceRow> FuelBalances { get; set; } = [];

    // GHG balance
    public List<GhgBalanceRow> GhgBalances { get; set; } = [];

    // Production processes
    public List<ProductionProcessRow> ProductionProcesses { get; set; } = [];

    // Precursors
    public List<PrecursorRow> Precursors { get; set; } = [];
}

public class GoodsCategoryRow
{
    public string? CategoryName { get; set; }
    public string? RouteType { get; set; }
    public string? Routes { get; set; }
}

public class EmissionSummaryRow
{
    public string? SourceStream { get; set; }
    public string? EmissionType { get; set; }
    public string? Method { get; set; }
    public decimal? ActivityData { get; set; }
    public string? AdUnit { get; set; }
    public decimal? Co2eFossil { get; set; }
    public decimal? Co2eBio { get; set; }
    public decimal? EnergyTJ { get; set; }
}

public class FuelBalanceRow
{
    public string? Label { get; set; }
    public decimal? Value { get; set; }
    public string? Unit { get; set; }
}

public class GhgBalanceRow
{
    public string? Type { get; set; }
    public decimal? Value { get; set; }
    public string? Unit { get; set; }
}

public class ProductionProcessRow
{
    public string? GoodsCategory { get; set; }
    public decimal? TotalProductionLevel { get; set; }
    public decimal? DirectEmissions { get; set; }
    public decimal? HeatEmissions { get; set; }
    public decimal? WasteGasEmissions { get; set; }
}

public class PrecursorRow
{
    public string? GoodsCategory { get; set; }
    public string? Country { get; set; }
    public decimal? TotalPurchasedLevel { get; set; }
    public decimal? SpecificEmbeddedEmissions { get; set; }
}
