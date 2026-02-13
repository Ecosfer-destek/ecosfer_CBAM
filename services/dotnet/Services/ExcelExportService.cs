using Npgsql;
using OfficeOpenXml;

namespace EcosferServices.Services;

/// <summary>
/// Excel Export Service - reverse of ExcelImportService
/// Reads InstallationData from PostgreSQL and generates an Excel file with 5 sheets
/// matching the CBAM template: A_InstData, B_EmInst, C_Emissions&Energy, D_Processes, E_PurchPrec
/// </summary>
public class ExcelExportService
{
    private readonly string _connectionString;

    // Sheet names (matching import exactly)
    private const string Sheet_A = "A_InstData";
    private const string Sheet_B = "B_EmInst";
    private const string Sheet_C = "C_Emissions&Energy";
    private const string Sheet_D = "D_Processes";
    private const string Sheet_E = "E_PurchPrec";

    public ExcelExportService(string connectionString)
    {
        _connectionString = connectionString;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    /// <summary>
    /// Export all InstallationData related data to an Excel file with 5 sheets.
    /// Returns the Excel file as a byte array.
    /// </summary>
    public async Task<byte[]> ExportInstallationData(string installationDataId, string tenantId)
    {
        using var package = new ExcelPackage();
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync();

        // Verify the installationData belongs to the tenant
        var exists = await ExecuteScalar<string>(conn,
            @"SELECT id FROM installation_datas WHERE id = @id AND ""tenantId"" = @tenantId",
            new NpgsqlParameter("id", installationDataId),
            new NpgsqlParameter("tenantId", tenantId));

        if (exists == null)
            throw new InvalidOperationException($"InstallationData '{installationDataId}' not found for tenant '{tenantId}'");

        // Generate each sheet
        await ExportSheetA(package, conn, installationDataId);
        await ExportSheetB(package, conn, installationDataId);
        await ExportSheetC(package, conn, installationDataId);
        await ExportSheetD(package, conn, installationDataId);
        await ExportSheetE(package, conn, installationDataId);

        return await package.GetAsByteArrayAsync();
    }

    // ========================================================================
    // SHEET A: A_InstData
    // InstallationData basic fields + GoodsCategoryAndRoutes +
    // RelevantProductionProcesses + PurchasedPrecursors
    // ========================================================================
    private async Task ExportSheetA(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var ws = package.Workbook.Worksheets.Add(Sheet_A);

        // --- Section 1: Installation Data basic info ---
        ws.Cells["A1"].Value = "Installation Data";
        ws.Cells["A1"].Style.Font.Bold = true;

        var headers = new[] { "Field", "Value" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cells[2, i + 1].Value = headers[i];
            ws.Cells[2, i + 1].Style.Font.Bold = true;
        }

        await using (var cmd = new NpgsqlCommand(@"
            SELECT id.id, id.""startDate"", id.""endDate"", id.""cbamFileStatus"",
                   id.""tenantId"", id.""installationId"",
                   i.name AS ""installationName"", i.address AS ""installationAddress"",
                   c.name AS ""companyName""
            FROM installation_datas id
            JOIN installations i ON id.""installationId"" = i.id
            JOIN companies c ON i.""companyId"" = c.id
            WHERE id.id = @id", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                int row = 3;
                ws.Cells[row, 1].Value = "InstallationDataId"; ws.Cells[row, 2].Value = SafeRead(reader, "id"); row++;
                ws.Cells[row, 1].Value = "InstallationName"; ws.Cells[row, 2].Value = SafeRead(reader, "installationName"); row++;
                ws.Cells[row, 1].Value = "CompanyName"; ws.Cells[row, 2].Value = SafeRead(reader, "companyName"); row++;
                ws.Cells[row, 1].Value = "InstallationAddress"; ws.Cells[row, 2].Value = SafeRead(reader, "installationAddress"); row++;
                ws.Cells[row, 1].Value = "StartDate"; ws.Cells[row, 2].Value = SafeRead(reader, "startDate"); row++;
                ws.Cells[row, 1].Value = "EndDate"; ws.Cells[row, 2].Value = SafeRead(reader, "endDate"); row++;
                ws.Cells[row, 1].Value = "CbamFileStatus"; ws.Cells[row, 2].Value = SafeRead(reader, "cbamFileStatus"); row++;
            }
        }

        // --- Section 2: GoodsCategoryAndRoutes ---
        int gcStartRow = 12;
        ws.Cells[$"A{gcStartRow}"].Value = "Goods Category and Routes";
        ws.Cells[$"A{gcStartRow}"].Style.Font.Bold = true;

        var gcHeaders = new[] { "No", "GoodsCategoryId", "GoodsCategoryName", "RouteType",
            "Route1", "Route2", "Route3", "Route4", "Route5", "Route6" };
        for (int i = 0; i < gcHeaders.Length; i++)
        {
            ws.Cells[gcStartRow + 1, i + 1].Value = gcHeaders[i];
            ws.Cells[gcStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int gcRow = gcStartRow + 2;
        int gcNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT igcr.id, igcr.""routeType"", igcr.""goodsCategoryId"",
                   gc.name AS ""goodsCategoryName"",
                   igcr.route1, igcr.route2, igcr.route3,
                   igcr.route4, igcr.route5, igcr.route6
            FROM installation_goods_category_and_routes igcr
            LEFT JOIN goods_categories gc ON igcr.""goodsCategoryId"" = gc.id
            WHERE igcr.""installationDataId"" = @id
            ORDER BY igcr.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[gcRow, 1].Value = gcNum++;
                ws.Cells[gcRow, 2].Value = SafeRead(reader, "goodsCategoryId");
                ws.Cells[gcRow, 3].Value = SafeRead(reader, "goodsCategoryName");
                ws.Cells[gcRow, 4].Value = SafeRead(reader, "routeType");
                ws.Cells[gcRow, 5].Value = SafeRead(reader, "route1");
                ws.Cells[gcRow, 6].Value = SafeRead(reader, "route2");
                ws.Cells[gcRow, 7].Value = SafeRead(reader, "route3");
                ws.Cells[gcRow, 8].Value = SafeRead(reader, "route4");
                ws.Cells[gcRow, 9].Value = SafeRead(reader, "route5");
                ws.Cells[gcRow, 10].Value = SafeRead(reader, "route6");
                gcRow++;
            }
        }

        // --- Section 3: Relevant Production Processes ---
        int rppStartRow = gcRow + 2;
        ws.Cells[$"A{rppStartRow}"].Value = "Relevant Production Processes";
        ws.Cells[$"A{rppStartRow}"].Style.Font.Bold = true;

        var rppHeaders = new[] { "No", "GoodsCategoryId", "GoodsCategoryName", "Name", "ErrorMessage",
            "ProductionProcess1", "ProductionProcess2", "ProductionProcess3",
            "ProductionProcess4", "ProductionProcess5", "ProductionProcess6" };
        for (int i = 0; i < rppHeaders.Length; i++)
        {
            ws.Cells[rppStartRow + 1, i + 1].Value = rppHeaders[i];
            ws.Cells[rppStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int rppRow = rppStartRow + 2;
        int rppNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT rpp.id, rpp.""goodsCategoryId"", gc.name AS ""goodsCategoryName"",
                   rpp.name, rpp.""errorMessage"",
                   rpp.""productionProcess1"", rpp.""productionProcess2"", rpp.""productionProcess3"",
                   rpp.""productionProcess4"", rpp.""productionProcess5"", rpp.""productionProcess6""
            FROM relevant_production_processes rpp
            LEFT JOIN goods_categories gc ON rpp.""goodsCategoryId"" = gc.id
            WHERE rpp.""installationDataId"" = @id
            ORDER BY rpp.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[rppRow, 1].Value = rppNum++;
                ws.Cells[rppRow, 2].Value = SafeRead(reader, "goodsCategoryId");
                ws.Cells[rppRow, 3].Value = SafeRead(reader, "goodsCategoryName");
                ws.Cells[rppRow, 4].Value = SafeRead(reader, "name");
                ws.Cells[rppRow, 5].Value = SafeRead(reader, "errorMessage");
                ws.Cells[rppRow, 6].Value = SafeRead(reader, "productionProcess1");
                ws.Cells[rppRow, 7].Value = SafeRead(reader, "productionProcess2");
                ws.Cells[rppRow, 8].Value = SafeRead(reader, "productionProcess3");
                ws.Cells[rppRow, 9].Value = SafeRead(reader, "productionProcess4");
                ws.Cells[rppRow, 10].Value = SafeRead(reader, "productionProcess5");
                ws.Cells[rppRow, 11].Value = SafeRead(reader, "productionProcess6");
                rppRow++;
            }
        }

        // --- Section 4: Purchased Precursors ---
        int ppStartRow = rppRow + 2;
        ws.Cells[$"A{ppStartRow}"].Value = "Purchased Precursors";
        ws.Cells[$"A{ppStartRow}"].Style.Font.Bold = true;

        var ppHeaders = new[] { "No", "GoodsCategoryId", "GoodsCategoryName", "CountryId", "CountryName",
            "Name", "ErrorMessage", "Route1", "Route2", "Route3", "Route4", "Route5" };
        for (int i = 0; i < ppHeaders.Length; i++)
        {
            ws.Cells[ppStartRow + 1, i + 1].Value = ppHeaders[i];
            ws.Cells[ppStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int ppRow = ppStartRow + 2;
        int ppNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT pp.id, pp.""goodsCategoryId"", gc.name AS ""goodsCategoryName"",
                   pp.""countryId"", co.code AS ""countryCode"", co.name AS ""countryName"",
                   pp.name, pp.""errorMessage"",
                   pp.route1, pp.route2, pp.route3, pp.route4, pp.route5
            FROM purchased_precursors pp
            LEFT JOIN goods_categories gc ON pp.""goodsCategoryId"" = gc.id
            LEFT JOIN countries co ON pp.""countryId"" = co.id
            WHERE pp.""installationDataId"" = @id
            ORDER BY pp.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[ppRow, 1].Value = ppNum++;
                ws.Cells[ppRow, 2].Value = SafeRead(reader, "goodsCategoryId");
                ws.Cells[ppRow, 3].Value = SafeRead(reader, "goodsCategoryName");
                ws.Cells[ppRow, 4].Value = SafeRead(reader, "countryId");
                ws.Cells[ppRow, 5].Value = SafeRead(reader, "countryName");
                ws.Cells[ppRow, 6].Value = SafeRead(reader, "name");
                ws.Cells[ppRow, 7].Value = SafeRead(reader, "errorMessage");
                ws.Cells[ppRow, 8].Value = SafeRead(reader, "route1");
                ws.Cells[ppRow, 9].Value = SafeRead(reader, "route2");
                ws.Cells[ppRow, 10].Value = SafeRead(reader, "route3");
                ws.Cells[ppRow, 11].Value = SafeRead(reader, "route4");
                ws.Cells[ppRow, 12].Value = SafeRead(reader, "route5");
                ppRow++;
            }
        }

        ws.Cells[ws.Dimension.Address].AutoFitColumns();
    }

    // ========================================================================
    // SHEET B: B_EmInst - Emissions (SS, PFC, ES)
    // ========================================================================
    private async Task ExportSheetB(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var ws = package.Workbook.Worksheets.Add(Sheet_B);

        // --- Section 1: Source Streams excluding PFC (SS) ---
        ws.Cells["A1"].Value = "Source Streams (SS) - Calculation Based";
        ws.Cells["A1"].Style.Font.Bold = true;

        var ssHeaders = new[] { "No", "EmissionType", "EmissionMethod", "SourceStreamName",
            "AD_ActivityData", "AD_Unit",
            "NCV_Value", "NCV_Unit",
            "EF_EmissionFactor", "EF_Unit",
            "ConvF_ConversionFactor", "ConvF_Unit",
            "BioC_BiomassContent", "BioC_Unit",
            "CO2e_Fossil", "CO2e_Bio", "EnergyContent_TJ", "EnergyContent_BioTJ" };
        for (int i = 0; i < ssHeaders.Length; i++)
        {
            ws.Cells[2, i + 1].Value = ssHeaders[i];
            ws.Cells[2, i + 1].Style.Font.Bold = true;
        }

        int ssRow = 3;
        int ssNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT e.id, et.code AS ""emissionTypeCode"", em.code AS ""emissionMethodCode"",
                   e.""sourceStreamName"",
                   e.""adActivityData"", adu.code AS ""adUnitCode"",
                   e.""ncvNetCalorificValue"", ncvu.code AS ""ncvUnitCode"",
                   e.""efEmissionFactor"", efu.code AS ""efUnitCode"",
                   e.""convfConversionFactor"", convfu.code AS ""convfUnitCode"",
                   e.""biocBiomassContent"", biocu.code AS ""biocUnitCode"",
                   e.""co2eFossil"", e.""co2eBio"",
                   e.""energyContentTJ"", e.""energyContentBioTJ""
            FROM emissions e
            LEFT JOIN emission_types et ON e.""emissionTypeId"" = et.id
            LEFT JOIN emission_methods em ON e.""emissionMethodId"" = em.id
            LEFT JOIN ad_units adu ON e.""adUnitId"" = adu.id
            LEFT JOIN ncv_units ncvu ON e.""ncvUnitId"" = ncvu.id
            LEFT JOIN ef_units efu ON e.""efUnitId"" = efu.id
            LEFT JOIN convf_units convfu ON e.""convfUnitId"" = convfu.id
            LEFT JOIN bioc_units biocu ON e.""biocUnitId"" = biocu.id
            WHERE e.""installationDataId"" = @id AND et.code = 'SS'
            ORDER BY e.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[ssRow, 1].Value = ssNum++;
                ws.Cells[ssRow, 2].Value = SafeRead(reader, "emissionTypeCode");
                ws.Cells[ssRow, 3].Value = SafeRead(reader, "emissionMethodCode");
                ws.Cells[ssRow, 4].Value = SafeRead(reader, "sourceStreamName");
                SetDecimalCell(ws, ssRow, 5, reader, "adActivityData");
                ws.Cells[ssRow, 6].Value = SafeRead(reader, "adUnitCode");
                SetDecimalCell(ws, ssRow, 7, reader, "ncvNetCalorificValue");
                ws.Cells[ssRow, 8].Value = SafeRead(reader, "ncvUnitCode");
                SetDecimalCell(ws, ssRow, 9, reader, "efEmissionFactor");
                ws.Cells[ssRow, 10].Value = SafeRead(reader, "efUnitCode");
                SetDecimalCell(ws, ssRow, 11, reader, "convfConversionFactor");
                ws.Cells[ssRow, 12].Value = SafeRead(reader, "convfUnitCode");
                SetDecimalCell(ws, ssRow, 13, reader, "biocBiomassContent");
                ws.Cells[ssRow, 14].Value = SafeRead(reader, "biocUnitCode");
                SetDecimalCell(ws, ssRow, 15, reader, "co2eFossil");
                SetDecimalCell(ws, ssRow, 16, reader, "co2eBio");
                SetDecimalCell(ws, ssRow, 17, reader, "energyContentTJ");
                SetDecimalCell(ws, ssRow, 18, reader, "energyContentBioTJ");
                ssRow++;
            }
        }

        // --- Section 2: PFC Emissions ---
        int pfcStartRow = ssRow + 2;
        ws.Cells[$"A{pfcStartRow}"].Value = "PFC Emissions";
        ws.Cells[$"A{pfcStartRow}"].Style.Font.Bold = true;

        var pfcHeaders = new[] { "No", "EmissionType", "EmissionMethod2", "TechnologyType",
            "AD_ActivityData", "AD_Unit",
            "A_Frequency", "A_Duration", "A_SefCf4",
            "B_Aeo", "B_Ce", "B_Ovc",
            "F_C2f6",
            "T_C2f6Emission",
            "TCO2e_GwpCf4", "TCO2e_GwpC2f6",
            "TCO2e_Cf4Emission", "TCO2e_C2f6Emission",
            "CollectionEfficiency", "CO2e_Fossil" };
        for (int i = 0; i < pfcHeaders.Length; i++)
        {
            ws.Cells[pfcStartRow + 1, i + 1].Value = pfcHeaders[i];
            ws.Cells[pfcStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int pfcRow = pfcStartRow + 2;
        int pfcNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT e.id, et.code AS ""emissionTypeCode"", em2.name AS ""emissionMethod2Name"",
                   e.""technologyType"",
                   e.""adActivityData"", adu.name AS ""adUnitName"",
                   e.""aFrequency"", e.""aDuration"", e.""aSefCf4"",
                   e.""bAeo"", e.""bCe"", e.""bOvc"",
                   e.""fC2f6"",
                   e.""tC2f6Emission"",
                   e.""tCo2eGwpCf4"", e.""tCo2eGwpC2f6"",
                   e.""tCo2eCf4Emission"", e.""tCo2eC2f6Emission"",
                   e.""collectionEfficiency"", e.""co2eFossil""
            FROM emissions e
            LEFT JOIN emission_types et ON e.""emissionTypeId"" = et.id
            LEFT JOIN emission_methods_2 em2 ON e.""emissionMethod2Id"" = em2.id
            LEFT JOIN ad_units adu ON e.""adUnitId"" = adu.id
            WHERE e.""installationDataId"" = @id AND et.code = 'PFC'
            ORDER BY e.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[pfcRow, 1].Value = pfcNum++;
                ws.Cells[pfcRow, 2].Value = SafeRead(reader, "emissionTypeCode");
                ws.Cells[pfcRow, 3].Value = SafeRead(reader, "emissionMethod2Name");
                ws.Cells[pfcRow, 4].Value = SafeRead(reader, "technologyType");
                SetDecimalCell(ws, pfcRow, 5, reader, "adActivityData");
                ws.Cells[pfcRow, 6].Value = SafeRead(reader, "adUnitName");
                SetDecimalCell(ws, pfcRow, 7, reader, "aFrequency");
                SetDecimalCell(ws, pfcRow, 8, reader, "aDuration");
                SetDecimalCell(ws, pfcRow, 9, reader, "aSefCf4");
                SetDecimalCell(ws, pfcRow, 10, reader, "bAeo");
                SetDecimalCell(ws, pfcRow, 11, reader, "bCe");
                SetDecimalCell(ws, pfcRow, 12, reader, "bOvc");
                SetDecimalCell(ws, pfcRow, 13, reader, "fC2f6");
                SetDecimalCell(ws, pfcRow, 14, reader, "tC2f6Emission");
                SetDecimalCell(ws, pfcRow, 15, reader, "tCo2eGwpCf4");
                SetDecimalCell(ws, pfcRow, 16, reader, "tCo2eGwpC2f6");
                SetDecimalCell(ws, pfcRow, 17, reader, "tCo2eCf4Emission");
                SetDecimalCell(ws, pfcRow, 18, reader, "tCo2eC2f6Emission");
                SetDecimalCell(ws, pfcRow, 19, reader, "collectionEfficiency");
                SetDecimalCell(ws, pfcRow, 20, reader, "co2eFossil");
                pfcRow++;
            }
        }

        // --- Section 3: ES (MBA) Emissions ---
        int esStartRow = pfcRow + 2;
        ws.Cells[$"A{esStartRow}"].Value = "ES (Measurement Based) Emissions";
        ws.Cells[$"A{esStartRow}"].Style.Font.Bold = true;

        var esHeaders = new[] { "No", "EmissionType", "EmissionMethod3", "TypeOfGhg",
            "BioC_BiomassContent", "BioC_Unit",
            "HourlyGhgConc", "GhgConc_Unit",
            "HoursOperating", "HoursOp_Unit",
            "FlueGasFlow", "FlueGas_Unit",
            "AnnualAmountOfGhg", "AnnualGhg_Unit",
            "GWP_tCO2e", "CO2e_Fossil", "CO2e_Bio" };
        for (int i = 0; i < esHeaders.Length; i++)
        {
            ws.Cells[esStartRow + 1, i + 1].Value = esHeaders[i];
            ws.Cells[esStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int esRow = esStartRow + 2;
        int esNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT e.id, et.code AS ""emissionTypeCode"", em3.name AS ""emissionMethod3Name"",
                   tog.name AS ""typeOfGhgName"",
                   e.""biocBiomassContent"", biocu.name AS ""biocUnitName"",
                   e.""hourlyGhgConcAverage"", ghgcu.name AS ""ghgConcUnitName"",
                   e.""hoursOperating"", hou.name AS ""hoursOperatingUnitName"",
                   e.""flueGasFlowAverage"", fgfu.name AS ""flueGasFlowUnitName"",
                   e.""annualAmountOfGhg"", aaghu.name AS ""annualAmountOfGhgUnitName"",
                   e.""gwpTco2e"", e.""co2eFossil"", e.""co2eBio""
            FROM emissions e
            LEFT JOIN emission_types et ON e.""emissionTypeId"" = et.id
            LEFT JOIN emission_methods_3 em3 ON e.""emissionMethod3Id"" = em3.id
            LEFT JOIN types_of_ghg tog ON e.""typeOfGhgId"" = tog.id
            LEFT JOIN bioc_units biocu ON e.""biocUnitId"" = biocu.id
            LEFT JOIN ghg_conc_units ghgcu ON e.""hourlyGhgConcUnitId"" = ghgcu.id
            LEFT JOIN hours_operating_units hou ON e.""hoursOperatingUnitId"" = hou.id
            LEFT JOIN flue_gas_flow_units fgfu ON e.""flueGasFlowUnitId"" = fgfu.id
            LEFT JOIN annual_amount_of_ghg_units aaghu ON e.""annualAmountOfGhgUnitId"" = aaghu.id
            WHERE e.""installationDataId"" = @id AND et.code = 'ES'
            ORDER BY e.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[esRow, 1].Value = esNum++;
                ws.Cells[esRow, 2].Value = SafeRead(reader, "emissionTypeCode");
                ws.Cells[esRow, 3].Value = SafeRead(reader, "emissionMethod3Name");
                ws.Cells[esRow, 4].Value = SafeRead(reader, "typeOfGhgName");
                SetDecimalCell(ws, esRow, 5, reader, "biocBiomassContent");
                ws.Cells[esRow, 6].Value = SafeRead(reader, "biocUnitName");
                SetDecimalCell(ws, esRow, 7, reader, "hourlyGhgConcAverage");
                ws.Cells[esRow, 8].Value = SafeRead(reader, "ghgConcUnitName");
                SetDecimalCell(ws, esRow, 9, reader, "hoursOperating");
                ws.Cells[esRow, 10].Value = SafeRead(reader, "hoursOperatingUnitName");
                SetDecimalCell(ws, esRow, 11, reader, "flueGasFlowAverage");
                ws.Cells[esRow, 12].Value = SafeRead(reader, "flueGasFlowUnitName");
                SetDecimalCell(ws, esRow, 13, reader, "annualAmountOfGhg");
                ws.Cells[esRow, 14].Value = SafeRead(reader, "annualAmountOfGhgUnitName");
                SetDecimalCell(ws, esRow, 15, reader, "gwpTco2e");
                SetDecimalCell(ws, esRow, 16, reader, "co2eFossil");
                SetDecimalCell(ws, esRow, 17, reader, "co2eBio");
                esRow++;
            }
        }

        ws.Cells[ws.Dimension?.Address ?? "A1"].AutoFitColumns();
    }

    // ========================================================================
    // SHEET C: C_Emissions&Energy
    // FuelBalance + GhgBalanceByType + GhgBalanceByMonitoringMethodologyType
    // + Quality Data references
    // ========================================================================
    private async Task ExportSheetC(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var ws = package.Workbook.Worksheets.Add(Sheet_C);

        // --- Section 1: Fuel Balance ---
        ws.Cells["A1"].Value = "Fuel Balance";
        ws.Cells["A1"].Style.Font.Bold = true;

        var fbHeaders = new[] { "No", "Name", "Unit",
            "TotalFuelInput", "DirectFuelForCbamGoods", "FuelForElectricity",
            "DirectFuelForNonCbamGoods", "Rest" };
        for (int i = 0; i < fbHeaders.Length; i++)
        {
            ws.Cells[2, i + 1].Value = fbHeaders[i];
            ws.Cells[2, i + 1].Style.Font.Bold = true;
        }

        int fbRow = 3;
        int fbNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT fb.id, fb.name, fbu.name AS ""unitName"",
                   fb.""totalFuelInput"", fb.""directFuelForCbamGoods"",
                   fb.""fuelForElectricity"", fb.""directFuelForNonCbamGoods"", fb.rest
            FROM fuel_balances fb
            LEFT JOIN fuel_balance_units fbu ON fb.""unitId"" = fbu.id
            WHERE fb.""installationDataId"" = @id
            ORDER BY fb.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[fbRow, 1].Value = fbNum++;
                ws.Cells[fbRow, 2].Value = SafeRead(reader, "name");
                ws.Cells[fbRow, 3].Value = SafeRead(reader, "unitName");
                SetDecimalCell(ws, fbRow, 4, reader, "totalFuelInput");
                SetDecimalCell(ws, fbRow, 5, reader, "directFuelForCbamGoods");
                SetDecimalCell(ws, fbRow, 6, reader, "fuelForElectricity");
                SetDecimalCell(ws, fbRow, 7, reader, "directFuelForNonCbamGoods");
                SetDecimalCell(ws, fbRow, 8, reader, "rest");
                fbRow++;
            }
        }

        // --- Section 2: GHG Balance by Type ---
        int ghgStartRow = fbRow + 2;
        ws.Cells[$"A{ghgStartRow}"].Value = "GHG Balance by Type";
        ws.Cells[$"A{ghgStartRow}"].Style.Font.Bold = true;

        var ghgHeaders = new[] { "No", "Name", "Unit",
            "TotalCO2Emissions", "BiomassEmissions", "TotalN2OEmissions",
            "TotalPFCEmissions", "TotalDirectEmissions", "TotalIndirectEmissions", "TotalEmissions" };
        for (int i = 0; i < ghgHeaders.Length; i++)
        {
            ws.Cells[ghgStartRow + 1, i + 1].Value = ghgHeaders[i];
            ws.Cells[ghgStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int ghgRow = ghgStartRow + 2;
        int ghgNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT gbt.id, gbt.name, gbu.name AS ""unitName"",
                   gbt.""totalCo2Emissions"", gbt.""biomassEmissions"", gbt.""totalN2oEmissions"",
                   gbt.""totalPfcEmissions"", gbt.""totalDirectEmissions"",
                   gbt.""totalIndirectEmissions"", gbt.""totalEmissions""
            FROM ghg_balance_by_types gbt
            LEFT JOIN ghg_balance_units gbu ON gbt.""unitId"" = gbu.id
            WHERE gbt.""installationDataId"" = @id
            ORDER BY gbt.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[ghgRow, 1].Value = ghgNum++;
                ws.Cells[ghgRow, 2].Value = SafeRead(reader, "name");
                ws.Cells[ghgRow, 3].Value = SafeRead(reader, "unitName");
                SetDecimalCell(ws, ghgRow, 4, reader, "totalCo2Emissions");
                SetDecimalCell(ws, ghgRow, 5, reader, "biomassEmissions");
                SetDecimalCell(ws, ghgRow, 6, reader, "totalN2oEmissions");
                SetDecimalCell(ws, ghgRow, 7, reader, "totalPfcEmissions");
                SetDecimalCell(ws, ghgRow, 8, reader, "totalDirectEmissions");
                SetDecimalCell(ws, ghgRow, 9, reader, "totalIndirectEmissions");
                SetDecimalCell(ws, ghgRow, 10, reader, "totalEmissions");
                ghgRow++;
            }
        }

        // --- Section 3: GHG Balance by Monitoring Methodology Type ---
        int mmStartRow = ghgRow + 2;
        ws.Cells[$"A{mmStartRow}"].Value = "GHG Balance by Monitoring Methodology Type";
        ws.Cells[$"A{mmStartRow}"].Style.Font.Bold = true;

        var mmHeaders = new[] { "No", "Name", "Unit",
            "CalculationBasedExclPFC", "TotalPFCEmissions", "MeasurementBased", "Other" };
        for (int i = 0; i < mmHeaders.Length; i++)
        {
            ws.Cells[mmStartRow + 1, i + 1].Value = mmHeaders[i];
            ws.Cells[mmStartRow + 1, i + 1].Style.Font.Bold = true;
        }

        int mmRow = mmStartRow + 2;
        int mmNum = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT gbmm.id, gbmm.name, gbu.name AS ""unitName"",
                   gbmm.""calculationBasedExclPfcEmissions"", gbmm.""totalPfcEmissions"",
                   gbmm.""measurementBased"", gbmm.other
            FROM ghg_balance_by_monitoring_methodology_types gbmm
            LEFT JOIN ghg_balance_units gbu ON gbmm.""unitId"" = gbu.id
            WHERE gbmm.""installationDataId"" = @id
            ORDER BY gbmm.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[mmRow, 1].Value = mmNum++;
                ws.Cells[mmRow, 2].Value = SafeRead(reader, "name");
                ws.Cells[mmRow, 3].Value = SafeRead(reader, "unitName");
                SetDecimalCell(ws, mmRow, 4, reader, "calculationBasedExclPfcEmissions");
                SetDecimalCell(ws, mmRow, 5, reader, "totalPfcEmissions");
                SetDecimalCell(ws, mmRow, 6, reader, "measurementBased");
                SetDecimalCell(ws, mmRow, 7, reader, "other");
                mmRow++;
            }
        }

        // --- Section 4: Quality Data References ---
        int qdStartRow = mmRow + 2;
        ws.Cells[$"A{qdStartRow}"].Value = "Quality Data References";
        ws.Cells[$"A{qdStartRow}"].Style.Font.Bold = true;

        ws.Cells[qdStartRow + 1, 1].Value = "Field";
        ws.Cells[qdStartRow + 1, 2].Value = "Value";
        ws.Cells[qdStartRow + 1, 1].Style.Font.Bold = true;
        ws.Cells[qdStartRow + 1, 2].Style.Font.Bold = true;

        await using (var cmd = new NpgsqlCommand(@"
            SELECT gidq.""qualityLevel"", jdv.justification, ioqa.description AS ""qaDescription""
            FROM installation_datas id
            LEFT JOIN general_info_on_data_quality gidq ON id.""generalInfoOnDataQualityId"" = gidq.id
            LEFT JOIN justification_for_default_values jdv ON id.""justificationForDefaultValueId"" = jdv.id
            LEFT JOIN info_on_quality_assurance ioqa ON id.""infoOnQualityAssuranceId"" = ioqa.id
            WHERE id.id = @id", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                int qdRow = qdStartRow + 2;
                ws.Cells[qdRow, 1].Value = "GeneralInfoOnDataQuality"; ws.Cells[qdRow, 2].Value = SafeRead(reader, "qualityLevel"); qdRow++;
                ws.Cells[qdRow, 1].Value = "JustificationForDefaultValue"; ws.Cells[qdRow, 2].Value = SafeRead(reader, "justification"); qdRow++;
                ws.Cells[qdRow, 1].Value = "InfoOnQualityAssurance"; ws.Cells[qdRow, 2].Value = SafeRead(reader, "qaDescription");
            }
        }

        ws.Cells[ws.Dimension?.Address ?? "A1"].AutoFitColumns();
    }

    // ========================================================================
    // SHEET D: D_Processes
    // RelevantProductionProcess D-section fields + DTotalProductionLevel
    // BUG FIX reflected: 3 separate fields (direct, heat, waste)
    // ========================================================================
    private async Task ExportSheetD(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var ws = package.Workbook.Worksheets.Add(Sheet_D);

        ws.Cells["A1"].Value = "Production Processes (D Section)";
        ws.Cells["A1"].Style.Font.Bold = true;

        var headers = new[] { "No", "GoodsCategoryName", "ProcessName",
            "DTotalProductionLevel",
            "DProducedForTheMarket",
            "DConsumedForNonCbamGoods",
            "DApplicableElements_MeasurableHeat", "DApplicableElements_WasteGases",
            "DDirectlyAttributableEmissions",
            "DEmissionsFromHeatBalance",
            "DEmissionsFromWasteGasesBalance",
            "DMeasurableHeat_AmountImported", "DMeasurableHeat_AmountExported",
            "DMeasurableHeat_EFImported", "DMeasurableHeat_EFExported",
            "DWasteGases_AmountImported", "DWasteGases_AmountExported",
            "DWasteGases_EFImported", "DWasteGases_EFExported",
            "DIndirectEmissions_ElecConsumption", "DIndirectEmissions_EFValue",
            "DIndirectEmissions_EFSource",
            "DElectricityExported_AmountsExported", "DElectricityExported_EFValue" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cells[2, i + 1].Value = headers[i];
            ws.Cells[2, i + 1].Style.Font.Bold = true;
        }

        int row = 3;
        int num = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT rpp.id, gc.name AS ""goodsCategoryName"", rpp.name,
                   dpl.amount AS ""dTotalProductionLevel"",
                   rpp.""dProducedForTheMarket"",
                   rpp.""dConsumedForNonCbamGoodsWithinTheInstallation"",
                   rpp.""dApplicableElementsMeasurableHeat"", rpp.""dApplicableElementsWasteGases"",
                   rpp.""dDirectlyAttributableEmissionsValue"",
                   rpp.""dEmissionsFromHeatBalanceValue"",
                   rpp.""dEmissionsFromWasteGasesBalanceValue"",
                   rpp.""dMeasurableHeatAmountImported"", rpp.""dMeasurableHeatAmountExported"",
                   rpp.""dMeasurableHeatEmissionsFactorImported"", rpp.""dMeasurableHeatEmissionsFactorExported"",
                   rpp.""dWasteGasesAmountImported"", rpp.""dWasteGasesAmountExported"",
                   rpp.""dWasteGasesEmissionsFactorImported"", rpp.""dWasteGasesEmissionsFactorExported"",
                   rpp.""dIndirectEmissionsElectricityConsumption"",
                   rpp.""dIndirectEmissionsEmissionFactorValue"",
                   rpp.""dIndirectEmissionsSourceOfEmissionFactor"",
                   rpp.""dElectricityExportedAmountsExported"",
                   rpp.""dElectricityExportedEmissionFactorValue""
            FROM relevant_production_processes rpp
            LEFT JOIN goods_categories gc ON rpp.""goodsCategoryId"" = gc.id
            LEFT JOIN d_total_production_levels dpl ON dpl.""relevantProductionProcessId"" = rpp.id
            WHERE rpp.""installationDataId"" = @id
            ORDER BY rpp.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[row, 1].Value = num++;
                ws.Cells[row, 2].Value = SafeRead(reader, "goodsCategoryName");
                ws.Cells[row, 3].Value = SafeRead(reader, "name");
                SetDecimalCell(ws, row, 4, reader, "dTotalProductionLevel");
                SetDecimalCell(ws, row, 5, reader, "dProducedForTheMarket");
                SetDecimalCell(ws, row, 6, reader, "dConsumedForNonCbamGoodsWithinTheInstallation");
                ws.Cells[row, 7].Value = SafeReadBool(reader, "dApplicableElementsMeasurableHeat");
                ws.Cells[row, 8].Value = SafeReadBool(reader, "dApplicableElementsWasteGases");
                // BUG FIX: 3 separate fields
                SetDecimalCell(ws, row, 9, reader, "dDirectlyAttributableEmissionsValue");
                SetDecimalCell(ws, row, 10, reader, "dEmissionsFromHeatBalanceValue");
                SetDecimalCell(ws, row, 11, reader, "dEmissionsFromWasteGasesBalanceValue");
                SetDecimalCell(ws, row, 12, reader, "dMeasurableHeatAmountImported");
                SetDecimalCell(ws, row, 13, reader, "dMeasurableHeatAmountExported");
                SetDecimalCell(ws, row, 14, reader, "dMeasurableHeatEmissionsFactorImported");
                SetDecimalCell(ws, row, 15, reader, "dMeasurableHeatEmissionsFactorExported");
                SetDecimalCell(ws, row, 16, reader, "dWasteGasesAmountImported");
                SetDecimalCell(ws, row, 17, reader, "dWasteGasesAmountExported");
                SetDecimalCell(ws, row, 18, reader, "dWasteGasesEmissionsFactorImported");
                SetDecimalCell(ws, row, 19, reader, "dWasteGasesEmissionsFactorExported");
                SetDecimalCell(ws, row, 20, reader, "dIndirectEmissionsElectricityConsumption");
                SetDecimalCell(ws, row, 21, reader, "dIndirectEmissionsEmissionFactorValue");
                ws.Cells[row, 22].Value = SafeRead(reader, "dIndirectEmissionsSourceOfEmissionFactor");
                SetDecimalCell(ws, row, 23, reader, "dElectricityExportedAmountsExported");
                SetDecimalCell(ws, row, 24, reader, "dElectricityExportedEmissionFactorValue");
                row++;
            }
        }

        ws.Cells[ws.Dimension?.Address ?? "A1"].AutoFitColumns();
    }

    // ========================================================================
    // SHEET E: E_PurchPrec
    // PurchasedPrecursor E-section fields + ETotalPurchasedLevel
    // ========================================================================
    private async Task ExportSheetE(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var ws = package.Workbook.Worksheets.Add(Sheet_E);

        ws.Cells["A1"].Value = "Purchased Precursors (E Section)";
        ws.Cells["A1"].Style.Font.Bold = true;

        var headers = new[] { "No", "GoodsCategoryName", "CountryCode", "ProcessName",
            "ETotalPurchasedLevel",
            "ETotalPurchaseForPossibleConsumption",
            "EConsumedForOtherPurposesForNonCbam",
            "ESpecificEmbedEmissions",
            "ESpecificEmbedDirectEmissions_Value", "ESpecificEmbedDirectEmissions_Source",
            "ESpecificElectricityConsumption_Value", "ESpecificElectricityConsumption_Source",
            "EElectricityEmissionFactor_Value", "EElectricityEmissionFactor_Source",
            "ESpecificEmbeddedIndirectEmissions_Value" };
        for (int i = 0; i < headers.Length; i++)
        {
            ws.Cells[2, i + 1].Value = headers[i];
            ws.Cells[2, i + 1].Style.Font.Bold = true;
        }

        int row = 3;
        int num = 1;
        await using (var cmd = new NpgsqlCommand(@"
            SELECT pp.id, gc.name AS ""goodsCategoryName"", co.code AS ""countryCode"",
                   pp.name,
                   epl.amount AS ""eTotalPurchasedLevel"",
                   pp.""eTotalPurchaseForPossibleConsumption"",
                   pp.""eConsumedForOtherPurposesForNonCbam"",
                   pp.""eSpecificEmbedEmissions"",
                   pp.""eSpecificEmbedDirectEmissionsValue"",
                   pp.""eSpecificEmbedDirectEmissionsSource"",
                   pp.""eSpecificElectricityConsumptionValue"",
                   pp.""eSpecificElectricityConsumptionSource"",
                   pp.""eElectricityEmissionFactorValue"",
                   pp.""eElectricityEmissionFactorSource"",
                   pp.""eSpecificEmbeddedIndirectEmissionsValue""
            FROM purchased_precursors pp
            LEFT JOIN goods_categories gc ON pp.""goodsCategoryId"" = gc.id
            LEFT JOIN countries co ON pp.""countryId"" = co.id
            LEFT JOIN e_total_purchased_levels epl ON epl.""purchasedPrecursorId"" = pp.id
            WHERE pp.""installationDataId"" = @id
            ORDER BY pp.""createdAt""", conn))
        {
            cmd.Parameters.AddWithValue("id", installationDataId);
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                ws.Cells[row, 1].Value = num++;
                ws.Cells[row, 2].Value = SafeRead(reader, "goodsCategoryName");
                ws.Cells[row, 3].Value = SafeRead(reader, "countryCode");
                ws.Cells[row, 4].Value = SafeRead(reader, "name");
                SetDecimalCell(ws, row, 5, reader, "eTotalPurchasedLevel");
                SetDecimalCell(ws, row, 6, reader, "eTotalPurchaseForPossibleConsumption");
                SetDecimalCell(ws, row, 7, reader, "eConsumedForOtherPurposesForNonCbam");
                ws.Cells[row, 8].Value = SafeRead(reader, "eSpecificEmbedEmissions");
                SetDecimalCell(ws, row, 9, reader, "eSpecificEmbedDirectEmissionsValue");
                ws.Cells[row, 10].Value = SafeRead(reader, "eSpecificEmbedDirectEmissionsSource");
                SetDecimalCell(ws, row, 11, reader, "eSpecificElectricityConsumptionValue");
                ws.Cells[row, 12].Value = SafeRead(reader, "eSpecificElectricityConsumptionSource");
                SetDecimalCell(ws, row, 13, reader, "eElectricityEmissionFactorValue");
                ws.Cells[row, 14].Value = SafeRead(reader, "eElectricityEmissionFactorSource");
                SetDecimalCell(ws, row, 15, reader, "eSpecificEmbeddedIndirectEmissionsValue");
                row++;
            }
        }

        ws.Cells[ws.Dimension?.Address ?? "A1"].AutoFitColumns();
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    /// <summary>
    /// Safely read a string value from a data reader, returning null for DBNull.
    /// </summary>
    private static string? SafeRead(NpgsqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        if (reader.IsDBNull(ordinal)) return null;
        return reader.GetValue(ordinal)?.ToString();
    }

    /// <summary>
    /// Safely read a boolean value from a data reader.
    /// </summary>
    private static string? SafeReadBool(NpgsqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        if (reader.IsDBNull(ordinal)) return null;
        return reader.GetBoolean(ordinal) ? "True" : "False";
    }

    /// <summary>
    /// Set a decimal value in an Excel cell from a data reader.
    /// </summary>
    private static void SetDecimalCell(ExcelWorksheet ws, int row, int col, NpgsqlDataReader reader, string column)
    {
        var ordinal = reader.GetOrdinal(column);
        if (!reader.IsDBNull(ordinal))
        {
            ws.Cells[row, col].Value = reader.GetDecimal(ordinal);
        }
    }

    private static async Task<T?> ExecuteScalar<T>(NpgsqlConnection conn, string sql, params NpgsqlParameter[] parameters)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddRange(parameters);
        var result = await cmd.ExecuteScalarAsync();
        if (result == null || result == DBNull.Value) return default;
        return (T)Convert.ChangeType(result, typeof(T));
    }
}
