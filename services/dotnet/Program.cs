using EcosferServices.Models;
using EcosferServices.Services;
using Microsoft.AspNetCore.Mvc;
using Prometheus;
using Serilog;
using Serilog.Events;
using System.Diagnostics;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .WriteTo.Console(new Serilog.Formatting.Json.JsonFormatter())
    .Enrich.WithProperty("service", "ecosfer-dotnet")
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Ecosfer SKDM Services", Version = "v1" });
});

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:3000"];
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register services
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")!;
builder.Services.AddSingleton(sp => new ExcelImportService(connectionString));
builder.Services.AddSingleton(sp => new ExcelExportService(connectionString));
builder.Services.AddSingleton(sp => new XmlGeneratorService(connectionString));
builder.Services.AddSingleton<XsdValidatorService>();
builder.Services.AddSingleton(sp => new PdfReportService(connectionString));

var app = builder.Build();

// Prometheus metrics middleware
app.UseHttpMetrics(options =>
{
    options.AddCustomLabel("service", context => "ecosfer-dotnet");
});

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// Prometheus metrics endpoint
app.MapMetrics();

// Health check with uptime
var startTime = DateTime.UtcNow;
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    service = "ecosfer-dotnet",
    timestamp = DateTime.UtcNow,
    uptime = (DateTime.UtcNow - startTime).ToString()
}));

// ============================================================================
// Excel Import - Full 5-sheet CBAM import (migrated from v1.0's 1,160-line controller)
// ============================================================================
app.MapPost("/api/v1/excel/import", async (
    [FromForm] IFormFile file,
    [FromForm] string installationDataId,
    [FromForm] string tenantId,
    ExcelImportService importService) =>
{
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No file provided" });

    if (string.IsNullOrEmpty(installationDataId))
        return Results.BadRequest(new { error = "installationDataId is required" });

    if (string.IsNullOrEmpty(tenantId))
        return Results.BadRequest(new { error = "tenantId is required" });

    using var timer = EcosferServices.Metrics.AppMetrics.ExcelImportDuration.NewTimer();
    using var stream = file.OpenReadStream();
    var result = await importService.ImportAllSheets(stream, installationDataId, tenantId);

    if (result.Success)
    {
        EcosferServices.Metrics.AppMetrics.ExcelImportTotal.WithLabels("success").Inc();
        var sheets = new[] {
            ("A_InstData", result.SheetA), ("B_EmInst", result.SheetB),
            ("C_Emissions", result.SheetC), ("D_Processes", result.SheetD), ("E_PurchPrec", result.SheetE)
        };
        foreach (var (name, sheet) in sheets)
            EcosferServices.Metrics.AppMetrics.ExcelSheetsProcessed.WithLabels(name, sheet.Imported ? "success" : "error").Inc();
    }
    else
    {
        EcosferServices.Metrics.AppMetrics.ExcelImportTotal.WithLabels("failure").Inc();
        EcosferServices.Metrics.AppMetrics.ExcelImportFailures.Inc();
    }

    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
})
.WithName("ImportExcel")
.WithOpenApi()
.DisableAntiforgery();

// Import individual sheets
app.MapPost("/api/v1/excel/import/{sheetName}", async (
    string sheetName,
    [FromForm] IFormFile file,
    [FromForm] string installationDataId,
    [FromForm] string tenantId,
    ExcelImportService importService) =>
{
    if (file == null || file.Length == 0)
        return Results.BadRequest(new { error = "No file provided" });

    using var stream = file.OpenReadStream();
    var result = await importService.ImportAllSheets(stream, installationDataId, tenantId);

    return result.Success ? Results.Ok(result) : Results.BadRequest(result);
})
.WithName("ImportExcelSheet")
.WithOpenApi()
.DisableAntiforgery();

// Excel Export - generates Excel file with 5 sheets from InstallationData
app.MapGet("/api/v1/excel/export/{installationDataId}", async (
    string installationDataId,
    [FromHeader(Name = "X-Tenant-Id")] string tenantId,
    ExcelExportService exportService) =>
{
    if (string.IsNullOrEmpty(tenantId))
        return Results.BadRequest(new { error = "X-Tenant-Id header is required" });

    if (string.IsNullOrEmpty(installationDataId))
        return Results.BadRequest(new { error = "installationDataId is required" });

    try
    {
        var bytes = await exportService.ExportInstallationData(installationDataId, tenantId);
        var fileName = $"CBAM_InstallationData_{installationDataId}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return Results.File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }
    catch (InvalidOperationException ex)
    {
        return Results.NotFound(new { error = ex.Message });
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Excel export failed for installationDataId={InstallationDataId}", installationDataId);
        return Results.Problem(
            detail: ex.Message,
            statusCode: 500,
            title: "Excel export failed");
    }
})
.WithName("ExportExcel")
.WithOpenApi();

// ============================================================================
// XML Generation - CBAM Declaration XML with XSD validation
// ============================================================================
app.MapPost("/api/v1/xml/generate/{declarationId}", async (
    string declarationId,
    [FromHeader(Name = "X-Tenant-Id")] string tenantId,
    XmlGeneratorService xmlService,
    XsdValidatorService xsdValidator) =>
{
    if (string.IsNullOrEmpty(tenantId))
        return Results.BadRequest(new { error = "X-Tenant-Id header is required" });

    var sw = Stopwatch.StartNew();
    var result = await xmlService.GenerateDeclarationXml(declarationId, tenantId);
    sw.Stop();
    EcosferServices.Metrics.AppMetrics.XmlGenerationDuration.Observe(sw.Elapsed.TotalSeconds);

    if (!result.Success)
    {
        EcosferServices.Metrics.AppMetrics.XmlGenerationTotal.WithLabels("failure").Inc();
        return Results.BadRequest(result);
    }

    EcosferServices.Metrics.AppMetrics.XmlGenerationTotal.WithLabels("success").Inc();

    // Validate generated XML
    if (result.XmlContent != null)
    {
        var xsdErrors = xsdValidator.ValidateXml(result.XmlContent);
        if (xsdErrors.Count > 0)
        {
            result.ValidationErrors.AddRange(xsdErrors);
            result.Warnings.Add($"{xsdErrors.Count} XSD validation issue(s) found");
        }
    }

    return Results.Ok(result);
})
.WithName("GenerateXml")
.WithOpenApi();

// Download XML as file
app.MapGet("/api/v1/xml/download/{declarationId}", async (
    string declarationId,
    [FromHeader(Name = "X-Tenant-Id")] string tenantId,
    XmlGeneratorService xmlService) =>
{
    if (string.IsNullOrEmpty(tenantId))
        return Results.BadRequest(new { error = "X-Tenant-Id header is required" });

    var result = await xmlService.GenerateDeclarationXml(declarationId, tenantId);

    if (!result.Success || result.XmlContent == null)
        return Results.BadRequest(new { error = result.Error ?? "XML generation failed" });

    var bytes = System.Text.Encoding.UTF8.GetBytes(result.XmlContent);
    return Results.File(bytes, "application/xml", $"CBAM_Declaration_{declarationId}.xml");
})
.WithName("DownloadXml")
.WithOpenApi();

// ============================================================================
// PDF Reports - QuestPDF (5 report types)
// ============================================================================
app.MapPost("/api/v1/reports/pdf/{reportType}", async (
    string reportType,
    [FromBody] PdfReportRequest request,
    PdfReportService pdfService) =>
{
    if (string.IsNullOrEmpty(request.TenantId))
        return Results.BadRequest(new { error = "tenantId is required" });

    var sw = Stopwatch.StartNew();
    var result = await pdfService.GenerateReport(reportType, request);
    sw.Stop();
    EcosferServices.Metrics.AppMetrics.PdfReportDuration.WithLabels(reportType).Observe(sw.Elapsed.TotalSeconds);

    if (!result.Success || result.PdfContent == null)
    {
        EcosferServices.Metrics.AppMetrics.PdfReportTotal.WithLabels(reportType, "failure").Inc();
        return Results.BadRequest(new { error = result.Error ?? "PDF generation failed" });
    }

    EcosferServices.Metrics.AppMetrics.PdfReportTotal.WithLabels(reportType, "success").Inc();
    return Results.File(result.PdfContent, "application/pdf", result.FileName);
})
.WithName("GeneratePdf")
.WithOpenApi();

// PDF preview (returns JSON metadata without file)
app.MapGet("/api/v1/reports/pdf/preview/{reportType}", (string reportType) =>
{
    var validTypes = new[] { "installation-summary", "declaration", "emission-detail", "supplier-survey", "custom" };
    if (!validTypes.Contains(reportType.ToLowerInvariant()))
        return Results.BadRequest(new { error = $"Invalid report type. Valid: {string.Join(", ", validTypes)}" });

    return Results.Ok(new
    {
        reportType,
        availableLanguages = new[] { "tr", "en", "de" },
        description = reportType switch
        {
            "installation-summary" => "Tesis Özet Raporu / Installation Summary Report",
            "declaration" => "CBAM Beyanname Raporu / CBAM Declaration Report",
            "emission-detail" => "Emisyon Detay Raporu / Emission Detail Report",
            "supplier-survey" => "Tedarikçi Anket Raporu / Supplier Survey Report",
            "custom" => "Özel Rapor / Custom Report",
            _ => reportType
        }
    });
})
.WithName("PreviewPdf")
.WithOpenApi();

app.Run();

// Expose the implicit Program class for integration testing with WebApplicationFactory
public partial class Program { }
