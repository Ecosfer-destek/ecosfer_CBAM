using EcosferServices.Models;
using Npgsql;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace EcosferServices.Services;

/// <summary>
/// PDF Report Generator using QuestPDF
/// Generates 5 report types:
/// 1. Installation Summary (Tesis Ozet Raporu)
/// 2. CBAM Declaration Report (CBAM Beyanname Raporu)
/// 3. Emission Detail Report (Emisyon Detay Raporu)
/// 4. Supplier Survey Report (Tedarikci Anket Raporu)
/// 5. Custom Report (Ozel Rapor - from ReportTemplate)
/// </summary>
public class PdfReportService
{
    private readonly string _connectionString;

    public PdfReportService(string connectionString)
    {
        _connectionString = connectionString;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<PdfGenerationResult> GenerateReport(string reportType, PdfReportRequest request)
    {
        var result = new PdfGenerationResult();

        try
        {
            byte[] pdf = reportType.ToLowerInvariant() switch
            {
                "installation-summary" => await GenerateInstallationSummary(request),
                "declaration" => await GenerateDeclarationReport(request),
                "emission-detail" => await GenerateEmissionDetailReport(request),
                "supplier-survey" => await GenerateSupplierSurveyReport(request),
                "custom" => await GenerateCustomReport(request),
                _ => throw new ArgumentException($"Unknown report type: {reportType}")
            };

            result.Success = true;
            result.PdfContent = pdf;
            result.FileName = $"CBAM_{reportType}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.pdf";
        }
        catch (Exception ex)
        {
            result.Error = $"PDF generation failed: {ex.Message}";
        }

        return result;
    }

    // ========================================================================
    // 1. Installation Summary Report
    // ========================================================================
    private async Task<byte[]> GenerateInstallationSummary(PdfReportRequest request)
    {
        var data = await LoadInstallationSummaryData(request.InstallationDataId, request.TenantId);
        var isTr = request.Language == "tr";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Element(h => ComposeHeader(h,
                    isTr ? "Tesis Özet Raporu" : "Installation Summary Report",
                    data.CompanyName, data.InstallationName, data.StartDate, data.EndDate));

                page.Content().Element(content =>
                {
                    content.PaddingVertical(10).Column(col =>
                    {
                        // Goods Categories
                        col.Item().Element(e => SectionTitle(e, isTr ? "Mal Kategorileri" : "Goods Categories"));
                        col.Item().Element(e => ComposeGoodsCategoriesTable(e, data.GoodsCategories, isTr));
                        col.Item().PaddingVertical(8);

                        // Emissions Summary
                        col.Item().Element(e => SectionTitle(e, isTr ? "Emisyon Özeti" : "Emissions Summary"));
                        col.Item().Element(e => ComposeEmissionsTable(e, data.Emissions, isTr));
                        col.Item().PaddingVertical(4);
                        col.Item().Text(text =>
                        {
                            text.Span($"{(isTr ? "Toplam CO₂e Fosil" : "Total CO₂e Fossil")}: ").Bold();
                            text.Span($"{data.TotalCo2eFossil:N4} tCO₂e");
                        });
                        col.Item().Text(text =>
                        {
                            text.Span($"{(isTr ? "Toplam CO₂e Bio" : "Total CO₂e Bio")}: ").Bold();
                            text.Span($"{data.TotalCo2eBio:N4} tCO₂e");
                        });
                        col.Item().Text(text =>
                        {
                            text.Span($"{(isTr ? "Toplam Enerji" : "Total Energy")}: ").Bold();
                            text.Span($"{data.TotalEnergyTJ:N4} TJ");
                        });
                        col.Item().PaddingVertical(8);

                        // Fuel Balance
                        if (data.FuelBalances.Count > 0)
                        {
                            col.Item().Element(e => SectionTitle(e, isTr ? "Yakıt Dengesi" : "Fuel Balance"));
                            col.Item().Element(e => ComposeFuelBalanceTable(e, data.FuelBalances, isTr));
                            col.Item().PaddingVertical(8);
                        }

                        // GHG Balance
                        if (data.GhgBalances.Count > 0)
                        {
                            col.Item().Element(e => SectionTitle(e, isTr ? "Sera Gazı Dengesi" : "GHG Balance"));
                            col.Item().Element(e => ComposeGhgBalanceTable(e, data.GhgBalances, isTr));
                            col.Item().PaddingVertical(8);
                        }

                        // Production Processes
                        if (data.ProductionProcesses.Count > 0)
                        {
                            col.Item().Element(e => SectionTitle(e, isTr ? "Üretim Prosesleri" : "Production Processes"));
                            col.Item().Element(e => ComposeProductionTable(e, data.ProductionProcesses, isTr));
                            col.Item().PaddingVertical(8);
                        }

                        // Precursors
                        if (data.Precursors.Count > 0)
                        {
                            col.Item().Element(e => SectionTitle(e, isTr ? "Prekürsorler" : "Precursors"));
                            col.Item().Element(e => ComposePrecursorTable(e, data.Precursors, isTr));
                        }
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    // ========================================================================
    // 2. Declaration Report
    // ========================================================================
    private async Task<byte[]> GenerateDeclarationReport(PdfReportRequest request)
    {
        var xmlService = new XmlGeneratorService(_connectionString);
        // We need declaration ID - use tenant's latest declaration
        var declId = await GetLatestDeclarationId(request.TenantId);
        var isTr = request.Language == "tr";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(isTr ? "CBAM Yıllık Beyanname Raporu" : "CBAM Annual Declaration Report")
                        .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().PaddingVertical(4).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
                    col.Item().Text($"{(isTr ? "Oluşturulma" : "Generated")}: {DateTime.Now:dd.MM.yyyy HH:mm}")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    if (string.IsNullOrEmpty(declId))
                    {
                        col.Item().Text(isTr ? "Henüz beyanname bulunamadı." : "No declaration found.")
                            .FontSize(12).FontColor(Colors.Red.Medium);
                    }
                    else
                    {
                        col.Item().Text($"{(isTr ? "Beyanname ID" : "Declaration ID")}: {declId}")
                            .FontSize(10);
                        col.Item().PaddingVertical(8);
                        col.Item().Text(isTr
                            ? "Detaylı beyanname verisi XML export üzerinden alınabilir."
                            : "Detailed declaration data available via XML export.");
                    }
                });

                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    // ========================================================================
    // 3. Emission Detail Report
    // ========================================================================
    private async Task<byte[]> GenerateEmissionDetailReport(PdfReportRequest request)
    {
        var data = await LoadInstallationSummaryData(request.InstallationDataId, request.TenantId);
        var isTr = request.Language == "tr";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(30);
                page.DefaultTextStyle(x => x.FontSize(8));

                page.Header().Element(h => ComposeHeader(h,
                    isTr ? "Emisyon Detay Raporu" : "Emission Detail Report",
                    data.CompanyName, data.InstallationName, data.StartDate, data.EndDate));

                page.Content().PaddingVertical(10).Column(col =>
                {
                    if (data.Emissions.Count == 0)
                    {
                        col.Item().Text(isTr ? "Emisyon verisi bulunamadı." : "No emission data found.")
                            .FontSize(11);
                        return;
                    }

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);  // Source
                            c.RelativeColumn(1.5f);  // Type
                            c.RelativeColumn(1.5f);  // Method
                            c.RelativeColumn(1.2f);  // AD
                            c.RelativeColumn(1);  // AD Unit
                            c.RelativeColumn(1.2f);  // CO2e Fossil
                            c.RelativeColumn(1.2f);  // CO2e Bio
                            c.RelativeColumn(1.2f);  // Energy TJ
                        });

                        table.Header(header =>
                        {
                            var headers = isTr
                                ? new[] { "Kaynak Akımı", "Tip", "Yöntem", "Faaliyet Verisi", "Birim", "CO₂e Fosil", "CO₂e Bio", "Enerji (TJ)" }
                                : new[] { "Source Stream", "Type", "Method", "Activity Data", "Unit", "CO₂e Fossil", "CO₂e Bio", "Energy (TJ)" };

                            foreach (var h in headers)
                                header.Cell().Background(Colors.Blue.Darken2).Padding(4)
                                    .Text(h).FontColor(Colors.White).FontSize(7).Bold();
                        });

                        foreach (var em in data.Emissions)
                        {
                            Cell(table, em.SourceStream ?? "-");
                            Cell(table, em.EmissionType ?? "-");
                            Cell(table, em.Method ?? "-");
                            Cell(table, em.ActivityData?.ToString("N4") ?? "-");
                            Cell(table, em.AdUnit ?? "-");
                            Cell(table, em.Co2eFossil?.ToString("N4") ?? "-");
                            Cell(table, em.Co2eBio?.ToString("N4") ?? "-");
                            Cell(table, em.EnergyTJ?.ToString("N4") ?? "-");
                        }
                    });

                    col.Item().PaddingTop(10).Text(text =>
                    {
                        text.Span(isTr ? "Toplam kayıt: " : "Total records: ").Bold();
                        text.Span($"{data.Emissions.Count}");
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    // ========================================================================
    // 4. Supplier Survey Report
    // ========================================================================
    private async Task<byte[]> GenerateSupplierSurveyReport(PdfReportRequest request)
    {
        var suppliers = await LoadSupplierData(request.TenantId);
        var isTr = request.Language == "tr";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(isTr ? "Tedarikçi Anket Raporu" : "Supplier Survey Report")
                        .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().PaddingVertical(4).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
                    col.Item().Text($"{(isTr ? "Oluşturulma" : "Generated")}: {DateTime.Now:dd.MM.yyyy HH:mm}")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    if (suppliers.Count == 0)
                    {
                        col.Item().Text(isTr ? "Henüz tedarikçi verisi bulunamadı." : "No supplier data found.")
                            .FontSize(11);
                        return;
                    }

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(2);
                            c.RelativeColumn(2);
                            c.RelativeColumn(1.5f);
                            c.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            var headers = isTr
                                ? new[] { "Tedarikçi", "İletişim", "Ülke", "Durum" }
                                : new[] { "Supplier", "Contact", "Country", "Status" };
                            foreach (var h in headers)
                                header.Cell().Background(Colors.Blue.Darken2).Padding(5)
                                    .Text(h).FontColor(Colors.White).Bold();
                        });

                        foreach (var s in suppliers)
                        {
                            Cell(table, s.Name);
                            Cell(table, s.Email ?? "-");
                            Cell(table, s.Country ?? "-");
                            Cell(table, s.SurveyStatus ?? "-");
                        }
                    });

                    col.Item().PaddingTop(10).Text(text =>
                    {
                        text.Span(isTr ? "Toplam tedarikçi: " : "Total suppliers: ").Bold();
                        text.Span($"{suppliers.Count}");
                    });
                });

                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    // ========================================================================
    // 5. Custom Report
    // ========================================================================
    private async Task<byte[]> GenerateCustomReport(PdfReportRequest request)
    {
        var sections = await LoadReportSections(request.InstallationDataId);
        var isTr = request.Language == "tr";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Column(col =>
                {
                    col.Item().Text(isTr ? "Özel Rapor" : "Custom Report")
                        .FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
                    col.Item().PaddingVertical(4).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
                });

                page.Content().PaddingVertical(15).Column(col =>
                {
                    foreach (var section in sections)
                    {
                        if (section.Level == "HEADING")
                        {
                            col.Item().PaddingTop(12).Text(section.Title ?? "")
                                .FontSize(14).Bold();
                        }
                        else
                        {
                            col.Item().PaddingTop(6).Text(section.Title ?? "")
                                .FontSize(11).Bold();
                        }

                        foreach (var content in section.Contents)
                        {
                            if (content.Type == "TEXT")
                            {
                                col.Item().PaddingTop(4).Text(content.Content ?? "").FontSize(10);
                            }
                        }
                    }

                    if (sections.Count == 0)
                    {
                        col.Item().Text(isTr ? "Rapor bölümleri bulunamadı." : "No report sections found.")
                            .FontSize(11);
                    }
                });

                page.Footer().Element(ComposeFooter);
            });
        });

        return document.GeneratePdf();
    }

    // ========================================================================
    // Shared PDF Components
    // ========================================================================

    private static void ComposeHeader(IContainer container, string title,
        string companyName, string installationName, DateTime? startDate, DateTime? endDate)
    {
        container.Column(col =>
        {
            col.Item().Text(title).FontSize(18).Bold().FontColor(Colors.Blue.Darken2);
            col.Item().PaddingVertical(4).LineHorizontal(2).LineColor(Colors.Blue.Darken2);
            col.Item().Row(row =>
            {
                row.RelativeItem().Text($"{companyName} - {installationName}").FontSize(10);
                if (startDate.HasValue)
                {
                    row.ConstantItem(200).AlignRight().Text(
                        $"{startDate:dd.MM.yyyy}" + (endDate.HasValue ? $" - {endDate:dd.MM.yyyy}" : "")
                    ).FontSize(9).FontColor(Colors.Grey.Darken1);
                }
            });
            col.Item().PaddingBottom(6).Text($"Oluşturulma: {DateTime.Now:dd.MM.yyyy HH:mm}")
                .FontSize(8).FontColor(Colors.Grey.Darken1);
        });
    }

    private static void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(text =>
        {
            text.DefaultTextStyle(x => x.FontSize(8).FontColor(Colors.Grey.Darken1));
            text.Span("Ecosfer SKDM Platform v2.0 | ");
            text.CurrentPageNumber();
            text.Span(" / ");
            text.TotalPages();
        });
    }

    private static void SectionTitle(IContainer container, string title)
    {
        container.PaddingBottom(4).Text(title).FontSize(13).Bold().FontColor(Colors.Blue.Darken1);
    }

    private static void Cell(TableDescriptor table, string text)
    {
        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(3)
            .Text(text).FontSize(8);
    }

    // ========================================================================
    // Table Composers
    // ========================================================================

    private static void ComposeGoodsCategoriesTable(IContainer container,
        List<GoodsCategoryRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(3);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Kategori", "Rota Tipi", "Rotalar" }
                    : new[] { "Category", "Route Type", "Routes" };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(4)
                        .Text(h).FontColor(Colors.White).FontSize(8).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.CategoryName ?? "-");
                Cell(table, row.RouteType ?? "-");
                Cell(table, row.Routes ?? "-");
            }
        });
    }

    private static void ComposeEmissionsTable(IContainer container,
        List<EmissionSummaryRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2);
                c.RelativeColumn(1.2f);
                c.RelativeColumn(1.2f);
                c.RelativeColumn(1.2f);
                c.RelativeColumn(1);
                c.RelativeColumn(1.2f);
                c.RelativeColumn(1.2f);
                c.RelativeColumn(1.2f);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Kaynak", "Tip", "Yöntem", "Faaliyet V.", "Birim", "CO₂e Fosil", "CO₂e Bio", "Enerji" }
                    : new[] { "Source", "Type", "Method", "Activity D.", "Unit", "CO₂e Fossil", "CO₂e Bio", "Energy" };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(3)
                        .Text(h).FontColor(Colors.White).FontSize(7).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.SourceStream ?? "-");
                Cell(table, row.EmissionType ?? "-");
                Cell(table, row.Method ?? "-");
                Cell(table, row.ActivityData?.ToString("N4") ?? "-");
                Cell(table, row.AdUnit ?? "-");
                Cell(table, row.Co2eFossil?.ToString("N4") ?? "-");
                Cell(table, row.Co2eBio?.ToString("N4") ?? "-");
                Cell(table, row.EnergyTJ?.ToString("N4") ?? "-");
            }
        });
    }

    private static void ComposeFuelBalanceTable(IContainer container,
        List<FuelBalanceRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(3);
                c.RelativeColumn(2);
                c.RelativeColumn(1.5f);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Etiket", "Değer", "Birim" }
                    : new[] { "Label", "Value", "Unit" };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(4)
                        .Text(h).FontColor(Colors.White).FontSize(8).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.Label ?? "-");
                Cell(table, row.Value?.ToString("N4") ?? "-");
                Cell(table, row.Unit ?? "-");
            }
        });
    }

    private static void ComposeGhgBalanceTable(IContainer container,
        List<GhgBalanceRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(3);
                c.RelativeColumn(2);
                c.RelativeColumn(1.5f);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Tip", "Değer", "Birim" }
                    : new[] { "Type", "Value", "Unit" };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(4)
                        .Text(h).FontColor(Colors.White).FontSize(8).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.Type ?? "-");
                Cell(table, row.Value?.ToString("N4") ?? "-");
                Cell(table, row.Unit ?? "-");
            }
        });
    }

    private static void ComposeProductionTable(IContainer container,
        List<ProductionProcessRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(1.5f);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Kategori", "Üretim Seviyesi", "Doğrudan Em.", "Isı Em.", "Atık Gaz Em." }
                    : new[] { "Category", "Production Level", "Direct Em.", "Heat Em.", "Waste Gas Em." };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(3)
                        .Text(h).FontColor(Colors.White).FontSize(7).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.GoodsCategory ?? "-");
                Cell(table, row.TotalProductionLevel?.ToString("N4") ?? "-");
                Cell(table, row.DirectEmissions?.ToString("N4") ?? "-");
                Cell(table, row.HeatEmissions?.ToString("N4") ?? "-");
                Cell(table, row.WasteGasEmissions?.ToString("N4") ?? "-");
            }
        });
    }

    private static void ComposePrecursorTable(IContainer container,
        List<PrecursorRow> rows, bool isTr)
    {
        container.Table(table =>
        {
            table.ColumnsDefinition(c =>
            {
                c.RelativeColumn(2);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(1.5f);
                c.RelativeColumn(2);
            });

            table.Header(header =>
            {
                var headers = isTr
                    ? new[] { "Kategori", "Ülke", "Satın Alınan", "Gömülü Em." }
                    : new[] { "Category", "Country", "Purchased", "Embedded Em." };
                foreach (var h in headers)
                    header.Cell().Background(Colors.Blue.Darken2).Padding(3)
                        .Text(h).FontColor(Colors.White).FontSize(7).Bold();
            });

            foreach (var row in rows)
            {
                Cell(table, row.GoodsCategory ?? "-");
                Cell(table, row.Country ?? "-");
                Cell(table, row.TotalPurchasedLevel?.ToString("N4") ?? "-");
                Cell(table, row.SpecificEmbeddedEmissions?.ToString("N4") ?? "-");
            }
        });
    }

    // ========================================================================
    // Data Loading
    // ========================================================================

    private async Task<InstallationSummaryData> LoadInstallationSummaryData(
        string installationDataId, string tenantId)
    {
        var data = new InstallationSummaryData();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Load installation + company info
        await using var cmdInst = new NpgsqlCommand(@"
            SELECT c.name as company_name, c.address as company_addr,
                   co_c.name as company_country,
                   i.name as inst_name, i.address as inst_addr,
                   co_i.name as inst_country,
                   id.""startDate"", id.""endDate""
            FROM installation_datas id
            JOIN installations i ON i.id = id.""installationId""
            JOIN companies c ON c.id = i.""companyId""
            LEFT JOIN countries co_c ON co_c.id = c.""countryId""
            LEFT JOIN countries co_i ON co_i.id = i.""countryId""
            WHERE id.id = @id AND id.""tenantId"" = @tenantId", conn);
        cmdInst.Parameters.AddWithValue("id", installationDataId);
        cmdInst.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdr = await cmdInst.ExecuteReaderAsync();
        if (await rdr.ReadAsync())
        {
            data.CompanyName = rdr.IsDBNull(0) ? "" : rdr.GetString(0);
            data.CompanyAddress = rdr.IsDBNull(1) ? null : rdr.GetString(1);
            data.CompanyCountry = rdr.IsDBNull(2) ? null : rdr.GetString(2);
            data.InstallationName = rdr.IsDBNull(3) ? "" : rdr.GetString(3);
            data.InstallationAddress = rdr.IsDBNull(4) ? null : rdr.GetString(4);
            data.InstallationCountry = rdr.IsDBNull(5) ? null : rdr.GetString(5);
            data.StartDate = rdr.IsDBNull(6) ? null : rdr.GetDateTime(6);
            data.EndDate = rdr.IsDBNull(7) ? null : rdr.GetDateTime(7);
        }
        await rdr.CloseAsync();

        // Goods categories
        await using var cmdGC = new NpgsqlCommand(@"
            SELECT gc.name, igcr.""routeType"",
                   CONCAT_WS(', ', igcr.route1, igcr.route2, igcr.route3, igcr.route4, igcr.route5, igcr.route6)
            FROM installation_goods_category_and_routes igcr
            LEFT JOIN goods_categories gc ON gc.id = igcr.""goodsCategoryId""
            WHERE igcr.""installationDataId"" = @id", conn);
        cmdGC.Parameters.AddWithValue("id", installationDataId);

        await using var rdrGC = await cmdGC.ExecuteReaderAsync();
        while (await rdrGC.ReadAsync())
        {
            data.GoodsCategories.Add(new GoodsCategoryRow
            {
                CategoryName = rdrGC.IsDBNull(0) ? null : rdrGC.GetString(0),
                RouteType = rdrGC.IsDBNull(1) ? null : rdrGC.GetString(1),
                Routes = rdrGC.IsDBNull(2) ? null : rdrGC.GetString(2)
            });
        }
        await rdrGC.CloseAsync();

        // Emissions
        await using var cmdEm = new NpgsqlCommand(@"
            SELECT e.""sourceStreamName"", et.name as em_type, em.name as em_method,
                   e.""adActivityData"", au.name as ad_unit,
                   e.""co2eFossil"", e.""co2eBio"", e.""energyContentTJ""
            FROM emissions e
            LEFT JOIN emission_types et ON et.id = e.""emissionTypeId""
            LEFT JOIN emission_methods em ON em.id = e.""emissionMethodId""
            LEFT JOIN ad_units au ON au.id = e.""adUnitId""
            WHERE e.""installationDataId"" = @id", conn);
        cmdEm.Parameters.AddWithValue("id", installationDataId);

        await using var rdrEm = await cmdEm.ExecuteReaderAsync();
        while (await rdrEm.ReadAsync())
        {
            var row = new EmissionSummaryRow
            {
                SourceStream = rdrEm.IsDBNull(0) ? null : rdrEm.GetString(0),
                EmissionType = rdrEm.IsDBNull(1) ? null : rdrEm.GetString(1),
                Method = rdrEm.IsDBNull(2) ? null : rdrEm.GetString(2),
                ActivityData = rdrEm.IsDBNull(3) ? null : rdrEm.GetDecimal(3),
                AdUnit = rdrEm.IsDBNull(4) ? null : rdrEm.GetString(4),
                Co2eFossil = rdrEm.IsDBNull(5) ? null : rdrEm.GetDecimal(5),
                Co2eBio = rdrEm.IsDBNull(6) ? null : rdrEm.GetDecimal(6),
                EnergyTJ = rdrEm.IsDBNull(7) ? null : rdrEm.GetDecimal(7)
            };
            data.Emissions.Add(row);
            data.TotalCo2eFossil += row.Co2eFossil ?? 0;
            data.TotalCo2eBio += row.Co2eBio ?? 0;
            data.TotalEnergyTJ += row.EnergyTJ ?? 0;
        }
        await rdrEm.CloseAsync();

        // Fuel balances
        await using var cmdFB = new NpgsqlCommand(@"
            SELECT fb.label, fb.value, fbu.name as unit
            FROM fuel_balances fb
            LEFT JOIN fuel_balance_units fbu ON fbu.id = fb.""unitId""
            WHERE fb.""installationDataId"" = @id", conn);
        cmdFB.Parameters.AddWithValue("id", installationDataId);

        await using var rdrFB = await cmdFB.ExecuteReaderAsync();
        while (await rdrFB.ReadAsync())
        {
            data.FuelBalances.Add(new FuelBalanceRow
            {
                Label = rdrFB.IsDBNull(0) ? null : rdrFB.GetString(0),
                Value = rdrFB.IsDBNull(1) ? null : rdrFB.GetDecimal(1),
                Unit = rdrFB.IsDBNull(2) ? null : rdrFB.GetString(2)
            });
        }
        await rdrFB.CloseAsync();

        // GHG balances
        await using var cmdGhg = new NpgsqlCommand(@"
            SELECT gb.""balanceType"", gb.value, gbu.name as unit
            FROM ghg_balance_by_types gb
            LEFT JOIN ghg_balance_units gbu ON gbu.id = gb.""unitId""
            WHERE gb.""installationDataId"" = @id", conn);
        cmdGhg.Parameters.AddWithValue("id", installationDataId);

        await using var rdrGhg = await cmdGhg.ExecuteReaderAsync();
        while (await rdrGhg.ReadAsync())
        {
            data.GhgBalances.Add(new GhgBalanceRow
            {
                Type = rdrGhg.IsDBNull(0) ? null : rdrGhg.GetString(0),
                Value = rdrGhg.IsDBNull(1) ? null : rdrGhg.GetDecimal(1),
                Unit = rdrGhg.IsDBNull(2) ? null : rdrGhg.GetString(2)
            });
        }
        await rdrGhg.CloseAsync();

        // Production processes
        await using var cmdProd = new NpgsqlCommand(@"
            SELECT gc.name as category,
                   rpp.""dTotalProductionLevelValue"",
                   rpp.""dDirectlyAttributableEmissionsValue"",
                   rpp.""dEmissionsFromHeatBalanceValue"",
                   rpp.""dEmissionsFromWasteGasesBalanceValue""
            FROM relevant_production_processes rpp
            LEFT JOIN goods_categories gc ON gc.id = rpp.""goodsCategoryId""
            WHERE rpp.""installationDataId"" = @id", conn);
        cmdProd.Parameters.AddWithValue("id", installationDataId);

        await using var rdrProd = await cmdProd.ExecuteReaderAsync();
        while (await rdrProd.ReadAsync())
        {
            data.ProductionProcesses.Add(new ProductionProcessRow
            {
                GoodsCategory = rdrProd.IsDBNull(0) ? null : rdrProd.GetString(0),
                TotalProductionLevel = rdrProd.IsDBNull(1) ? null : rdrProd.GetDecimal(1),
                DirectEmissions = rdrProd.IsDBNull(2) ? null : rdrProd.GetDecimal(2),
                HeatEmissions = rdrProd.IsDBNull(3) ? null : rdrProd.GetDecimal(3),
                WasteGasEmissions = rdrProd.IsDBNull(4) ? null : rdrProd.GetDecimal(4)
            });
        }
        await rdrProd.CloseAsync();

        // Precursors
        await using var cmdPrec = new NpgsqlCommand(@"
            SELECT gc.name as category, co.name as country,
                   pp.""eTotalPurchasedLevelValue"",
                   pp.""eSpecificEmbedEmissionsValue""
            FROM purchased_precursors pp
            LEFT JOIN goods_categories gc ON gc.id = pp.""goodsCategoryId""
            LEFT JOIN countries co ON co.id = pp.""countryId""
            WHERE pp.""installationDataId"" = @id", conn);
        cmdPrec.Parameters.AddWithValue("id", installationDataId);

        await using var rdrPrec = await cmdPrec.ExecuteReaderAsync();
        while (await rdrPrec.ReadAsync())
        {
            data.Precursors.Add(new PrecursorRow
            {
                GoodsCategory = rdrPrec.IsDBNull(0) ? null : rdrPrec.GetString(0),
                Country = rdrPrec.IsDBNull(1) ? null : rdrPrec.GetString(1),
                TotalPurchasedLevel = rdrPrec.IsDBNull(2) ? null : rdrPrec.GetDecimal(2),
                SpecificEmbeddedEmissions = rdrPrec.IsDBNull(3) ? null : rdrPrec.GetDecimal(3)
            });
        }
        await rdrPrec.CloseAsync();

        return data;
    }

    private async Task<string?> GetLatestDeclarationId(string tenantId)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT id FROM annual_declarations
            WHERE ""tenantId"" = @tenantId
            ORDER BY year DESC LIMIT 1", conn);
        cmd.Parameters.AddWithValue("tenantId", tenantId);
        var result = await cmd.ExecuteScalarAsync();
        return result?.ToString();
    }

    private async Task<List<SupplierInfo>> LoadSupplierData(string tenantId)
    {
        var suppliers = new List<SupplierInfo>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT s.name, s.email, co.name as country,
                   CASE WHEN ss.id IS NOT NULL THEN 'Completed' ELSE 'Pending' END as status
            FROM suppliers s
            LEFT JOIN countries co ON co.id = s.""countryId""
            LEFT JOIN supplier_surveys ss ON ss.""supplierId"" = s.id
            WHERE s.""tenantId"" = @tenantId", conn);
        cmd.Parameters.AddWithValue("tenantId", tenantId);

        await using var rdr = await cmd.ExecuteReaderAsync();
        while (await rdr.ReadAsync())
        {
            suppliers.Add(new SupplierInfo
            {
                Name = rdr.IsDBNull(0) ? "" : rdr.GetString(0),
                Email = rdr.IsDBNull(1) ? null : rdr.GetString(1),
                Country = rdr.IsDBNull(2) ? null : rdr.GetString(2),
                SurveyStatus = rdr.IsDBNull(3) ? null : rdr.GetString(3)
            });
        }
        return suppliers;
    }

    private async Task<List<ReportSectionInfo>> LoadReportSections(string installationDataId)
    {
        var sections = new List<ReportSectionInfo>();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(@"
            SELECT rs.id, rs.title, rs.""sectionLevel"", rs.""sortOrder""
            FROM report_sections rs
            WHERE rs.""installationDataId"" = @id
            ORDER BY rs.""sortOrder""", conn);
        cmd.Parameters.AddWithValue("id", installationDataId);

        await using var rdr = await cmd.ExecuteReaderAsync();
        while (await rdr.ReadAsync())
        {
            sections.Add(new ReportSectionInfo
            {
                Id = rdr.GetString(0),
                Title = rdr.IsDBNull(1) ? null : rdr.GetString(1),
                Level = rdr.IsDBNull(2) ? "HEADING" : rdr.GetString(2),
                SortOrder = rdr.IsDBNull(3) ? 0 : rdr.GetInt32(3)
            });
        }
        await rdr.CloseAsync();

        // Load contents for each section
        foreach (var section in sections)
        {
            await using var cmdContent = new NpgsqlCommand(@"
                SELECT ""contentType"", content FROM report_section_contents
                WHERE ""reportSectionId"" = @sectionId
                ORDER BY ""sortOrder""", conn);
            cmdContent.Parameters.AddWithValue("sectionId", section.Id);
            await using var rdrC = await cmdContent.ExecuteReaderAsync();
            while (await rdrC.ReadAsync())
            {
                section.Contents.Add(new ReportContentInfo
                {
                    Type = rdrC.IsDBNull(0) ? "TEXT" : rdrC.GetString(0),
                    Content = rdrC.IsDBNull(1) ? null : rdrC.GetString(1)
                });
            }
            await rdrC.CloseAsync();
        }

        return sections;
    }

    // Helper classes for data loading
    private class SupplierInfo
    {
        public string Name { get; set; } = "";
        public string? Email { get; set; }
        public string? Country { get; set; }
        public string? SurveyStatus { get; set; }
    }

    private class ReportSectionInfo
    {
        public string Id { get; set; } = "";
        public string? Title { get; set; }
        public string? Level { get; set; }
        public int SortOrder { get; set; }
        public List<ReportContentInfo> Contents { get; set; } = [];
    }

    private class ReportContentInfo
    {
        public string? Type { get; set; }
        public string? Content { get; set; }
    }
}
