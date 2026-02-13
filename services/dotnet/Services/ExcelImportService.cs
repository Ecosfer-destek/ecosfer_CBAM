using EcosferServices.Helpers;
using EcosferServices.Models;
using Npgsql;
using OfficeOpenXml;

namespace EcosferServices.Services;

/// <summary>
/// Excel Import Service - migrated from v1.0 CBAMExcelFileViewController.cs (1,160 lines)
/// Converts DevExpress Spreadsheet API to EPPlus 7.x
/// Key mappings: 5 sheets (A_InstData, B_EmInst, C_Emissions&Energy, D_Processes, E_PurchPrec)
/// BUG FIX: v1.0 L54/L65/L66 all wrote to DDirectlyAttributableEmissionsValue (data loss)
/// v2.0: L54 -> DDirectlyAttributableEmissions, L65 -> DEmissionsFromHeatBalance, L66 -> DEmissionsFromWasteGasesBalance
/// </summary>
public class ExcelImportService
{
    private readonly string _connectionString;

    // Sheet names (matching v1.0 exactly)
    private const string Sheet_A = "A_InstData";
    private const string Sheet_B = "B_EmInst";
    private const string Sheet_C = "C_Emissions&Energy";
    private const string Sheet_D = "D_Processes";
    private const string Sheet_E = "E_PurchPrec";

    public ExcelImportService(string connectionString)
    {
        _connectionString = connectionString;
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<ImportResult> ImportAllSheets(Stream fileStream, string installationDataId, string tenantId)
    {
        var result = new ImportResult { InstallationDataId = installationDataId };

        try
        {
            using var package = new ExcelPackage(fileStream);
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            // Sheet A: InstallationData - GoodsCategoryAndRoutes, RelevantProductionProcesses, PurchasedPrecursors
            result.SheetA = await ImportSheetA(package, conn, installationDataId, tenantId);

            // Sheet B: Emissions (SS, PFC, ES)
            result.SheetB = await ImportSheetB(package, conn, installationDataId);

            // Sheet C: Fuel Balance, GHG Balances, Quality Data
            result.SheetC = await ImportSheetC(package, conn, installationDataId);

            // Sheet D: Production Processes
            result.SheetD = await ImportSheetD(package, conn, installationDataId);

            // Sheet E: Purchased Precursors data
            result.SheetE = await ImportSheetE(package, conn, installationDataId);

            result.Success = true;
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Error = ex.Message;
        }

        return result;
    }

    // ========================================================================
    // SHEET A: A_InstData
    // v1.0 ref: Lines 59-271 of CBAMExcelFileViewController.cs
    // ========================================================================
    private async Task<SheetResult> ImportSheetA(ExcelPackage package, NpgsqlConnection conn, string installationDataId, string tenantId)
    {
        var result = new SheetResult();
        var ws = package.Workbook.Worksheets[Sheet_A];
        if (ws == null) { result.Errors.Add("Sheet A_InstData not found"); return result; }

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // 1. Clear existing GoodsCategoryAndRoutes
            await ExecuteNonQuery(conn, "DELETE FROM installation_goods_category_and_routes WHERE \"installationDataId\" = @id",
                new NpgsqlParameter("id", installationDataId));

            // 2. Import GoodsCategoryAndRoutes (rows 62-71, v1.0 ref: lines 88-123)
            for (int row = 62; row <= 71; row++)
            {
                var goodsCategoryName = ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]);
                if (goodsCategoryName == null) continue;

                var goodsCategoryId = await LookupId(conn, "goods_categories", "name", goodsCategoryName);
                if (goodsCategoryId == null) { result.Warnings.Add($"Row {row}: GoodsCategory '{goodsCategoryName}' not found"); continue; }

                var routeTypeText = ExcelHelper.SafeGetText(ws.Cells[$"G{row}"]);
                var routeType = routeTypeText?.Contains("All production routes") == true ? "AllProductionRoutes" : "DefinedRoutes";

                string? route1Id = null, route2Id = null, route3Id = null, route4Id = null, route5Id = null, route6Id = null;
                if (routeType == "DefinedRoutes")
                {
                    route1Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"I{row}"]));
                    route2Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"J{row}"]));
                    route3Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"K{row}"]));
                    route4Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"L{row}"]));
                    route5Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"M{row}"]));
                    route6Id = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"N{row}"]));
                }

                await ExecuteNonQuery(conn, @"
                    INSERT INTO installation_goods_category_and_routes
                    (id, ""installationDataId"", ""goodsCategoryId"", ""routeType"",
                     ""route1Id"", ""route2Id"", ""route3Id"", ""route4Id"", ""route5Id"", ""route6Id"", ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @gcId, @routeType::""RouteType"",
                     @r1, @r2, @r3, @r4, @r5, @r6, NOW())",
                    new NpgsqlParameter("instId", installationDataId),
                    new NpgsqlParameter("gcId", goodsCategoryId),
                    new NpgsqlParameter("routeType", routeType),
                    Param("r1", route1Id), Param("r2", route2Id), Param("r3", route3Id),
                    Param("r4", route4Id), Param("r5", route5Id), Param("r6", route6Id));

                result.RecordsCreated++;
            }

            // 3. Clear & import RelevantProductionProcesses (rows 82-91, v1.0 ref: lines 147-199)
            await ExecuteNonQuery(conn, "DELETE FROM relevant_production_processes WHERE \"installationDataId\" = @id",
                new NpgsqlParameter("id", installationDataId));

            for (int row = 82; row <= 91; row++)
            {
                var goodsCategoryName = ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]);
                if (goodsCategoryName == null) continue;

                var goodsCategoryId = await LookupId(conn, "goods_categories", "name", goodsCategoryName);
                if (goodsCategoryId == null) { result.Warnings.Add($"Row {row}: GoodsCategory '{goodsCategoryName}' not found"); continue; }

                var name = ExcelHelper.SafeGetText(ws.Cells[$"L{row}"]);
                var errorMessage = ExcelHelper.SafeGetText(ws.Cells[$"N{row}"]);

                var pp1 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"F{row}"]));
                var pp2 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"G{row}"]));
                var pp3 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"H{row}"]));
                var pp4 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"I{row}"]));
                var pp5 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"J{row}"]));
                var pp6 = await LookupId(conn, "production_processes", "name", ExcelHelper.SafeGetText(ws.Cells[$"K{row}"]));

                var rppId = await ExecuteScalar<string>(conn, @"
                    INSERT INTO relevant_production_processes
                    (id, ""installationDataId"", ""goodsCategoryId"", name, ""errorMessage"",
                     ""productionProcess1Id"", ""productionProcess2Id"", ""productionProcess3Id"",
                     ""productionProcess4Id"", ""productionProcess5Id"", ""productionProcess6Id"", ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @gcId, @name, @err,
                     @pp1, @pp2, @pp3, @pp4, @pp5, @pp6, NOW())
                    RETURNING id",
                    new NpgsqlParameter("instId", installationDataId),
                    new NpgsqlParameter("gcId", goodsCategoryId),
                    Param("name", name), Param("err", errorMessage),
                    Param("pp1", pp1), Param("pp2", pp2), Param("pp3", pp3),
                    Param("pp4", pp4), Param("pp5", pp5), Param("pp6", pp6));

                // Create DTotalProductionLevel record for Sheet D (v1.0 ref: lines 188-199)
                if (rppId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        INSERT INTO d_total_production_levels (id, ""relevantProductionProcessId"", amount, ""createdAt"")
                        VALUES (gen_random_uuid(), @rppId, 0, NOW())
                        ON CONFLICT DO NOTHING",
                        new NpgsqlParameter("rppId", rppId));
                }

                result.RecordsCreated++;
            }

            // 4. Clear & import PurchasedPrecursors (rows 101-120, v1.0 ref: lines 203-265)
            await ExecuteNonQuery(conn, "DELETE FROM purchased_precursors WHERE \"installationDataId\" = @id",
                new NpgsqlParameter("id", installationDataId));

            for (int row = 101; row <= 120; row++)
            {
                var goodsCategoryName = ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]);
                if (goodsCategoryName == null) continue;

                var goodsCategoryId = await LookupId(conn, "goods_categories", "name", goodsCategoryName);
                var countryCode = ExcelHelper.SafeGetText(ws.Cells[$"F{row}"]);
                var countryId = countryCode != null ? await LookupId(conn, "countries", "code", countryCode) : null;

                var name = ExcelHelper.SafeGetText(ws.Cells[$"L{row}"]);
                var errorMessage = ExcelHelper.SafeGetText(ws.Cells[$"N{row}"]);

                var r1 = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"G{row}"]));
                var r2 = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"H{row}"]));
                var r3 = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"I{row}"]));
                var r4 = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"J{row}"]));
                var r5 = await LookupId(conn, "production_routes", "name", ExcelHelper.SafeGetText(ws.Cells[$"K{row}"]));

                var ppId = await ExecuteScalar<string>(conn, @"
                    INSERT INTO purchased_precursors
                    (id, ""installationDataId"", ""goodsCategoryId"", ""countryId"", name, ""errorMessage"",
                     ""route1Id"", ""route2Id"", ""route3Id"", ""route4Id"", ""route5Id"", ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @gcId, @countryId, @name, @err,
                     @r1, @r2, @r3, @r4, @r5, NOW())
                    RETURNING id",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("gcId", goodsCategoryId), Param("countryId", countryId),
                    Param("name", name), Param("err", errorMessage),
                    Param("r1", r1), Param("r2", r2), Param("r3", r3), Param("r4", r4), Param("r5", r5));

                // Create ETotalPurchasedLevel record for Sheet E
                if (ppId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        INSERT INTO e_total_purchased_levels (id, ""purchasedPrecursorId"", amount, ""createdAt"")
                        VALUES (gen_random_uuid(), @ppId, 0, NOW())
                        ON CONFLICT DO NOTHING",
                        new NpgsqlParameter("ppId", ppId));
                }

                result.RecordsCreated++;
            }

            await tx.CommitAsync();
            result.Imported = true;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            result.Errors.Add($"Sheet A error: {ex.Message}");
        }

        return result;
    }

    // ========================================================================
    // SHEET B: B_EmInst - Emissions (85+ cell mappings)
    // v1.0 ref: Lines 282-512 of CBAMExcelFileViewController.cs
    // ========================================================================
    private async Task<SheetResult> ImportSheetB(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var result = new SheetResult();
        var ws = package.Workbook.Worksheets[Sheet_B];
        if (ws == null) { result.Errors.Add("Sheet B_EmInst not found"); return result; }

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Clear existing emissions
            await ExecuteNonQuery(conn, "DELETE FROM emissions WHERE \"installationDataId\" = @id",
                new NpgsqlParameter("id", installationDataId));

            // === Source Streams excluding PFC (rows 17-91, v1.0 ref: lines 309-365) ===
            for (int row = 17; row <= 91; row++)
            {
                var methodCode = ExcelHelper.SafeGetText(ws.Cells[$"D{row}"]);
                if (methodCode == null) continue;

                var emissionTypeId = await LookupId(conn, "emission_types", "code", "SS");
                var emissionMethodId = await LookupId(conn, "emission_methods", "code", methodCode);
                var sourceStreamName = ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]);

                // Unit lookups
                var adUnitId = await LookupId(conn, "ad_units", "code", ExcelHelper.SafeGetText(ws.Cells[$"G{row}"]));
                var ncvUnitId = await LookupId(conn, "ncv_units", "code", ExcelHelper.SafeGetText(ws.Cells[$"I{row}"]));
                var efUnitId = await LookupId(conn, "ef_units", "code", ExcelHelper.SafeGetText(ws.Cells[$"K{row}"]));
                var convFUnitId = await LookupId(conn, "conv_f_units", "code", ExcelHelper.SafeGetText(ws.Cells[$"Q{row}"]));
                var bioCUnitId = await LookupId(conn, "bio_c_units", "code", ExcelHelper.SafeGetText(ws.Cells[$"S{row}"]));

                await ExecuteNonQuery(conn, @"
                    INSERT INTO emissions
                    (id, ""installationDataId"", ""emissionTypeId"", ""emissionMethodId"",
                     ""sourceStreamName"",
                     ""adActivityData"", ""adUnitId"",
                     ""ncvNetCalorificValue"", ""ncvUnitId"",
                     ""efEmissionFactor"", ""efUnitId"",
                     ""convFConversionFactor"", ""convFUnitId"",
                     ""bioCBiomassContent"", ""bioCUnitId"",
                     ""co2eFossil"", ""co2eBio"", ""energyContentTj"", ""energyContentBioTj"",
                     ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @etId, @emId,
                     @ssName,
                     @ad, @adUnit,
                     @ncv, @ncvUnit,
                     @ef, @efUnit,
                     @convF, @convFUnit,
                     @bioC, @bioCUnit,
                     @co2eF, @co2eB, @ecTj, @ecBioTj,
                     NOW())",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("etId", emissionTypeId), Param("emId", emissionMethodId),
                    Param("ssName", sourceStreamName),
                    ParamDecimal("ad", ExcelHelper.SafeParseDecimal(ws.Cells[$"F{row}"])),
                    Param("adUnit", adUnitId),
                    ParamDecimal("ncv", ExcelHelper.SafeParseDecimal(ws.Cells[$"H{row}"])),
                    Param("ncvUnit", ncvUnitId),
                    ParamDecimal("ef", ExcelHelper.SafeParseDecimal(ws.Cells[$"J{row}"])),
                    Param("efUnit", efUnitId),
                    ParamDecimal("convF", ExcelHelper.SafeParseDecimal(ws.Cells[$"P{row}"])),
                    Param("convFUnit", convFUnitId),
                    ParamDecimal("bioC", ExcelHelper.SafeParseDecimal(ws.Cells[$"R{row}"])),
                    Param("bioCUnit", bioCUnitId),
                    ParamDecimal("co2eF", ExcelHelper.SafeParseDecimal(ws.Cells[$"AU{row}"])),
                    ParamDecimal("co2eB", ExcelHelper.SafeParseDecimal(ws.Cells[$"AV{row}"])),
                    ParamDecimal("ecTj", ExcelHelper.SafeParseDecimal(ws.Cells[$"AX{row}"])),
                    ParamDecimal("ecBioTj", ExcelHelper.SafeParseDecimal(ws.Cells[$"AY{row}"])));

                result.RecordsCreated++;
            }

            // === PFC Emissions (rows 98-107, v1.0 ref: lines 373-440) ===
            for (int row = 98; row <= 107; row++)
            {
                var methodName = ExcelHelper.SafeGetText(ws.Cells[$"D{row}"]);
                if (methodName == null) continue;

                var emissionTypeId = await LookupId(conn, "emission_types", "code", "PFC");
                var emissionMethod2Id = await LookupId(conn, "emission_method2s", "name", methodName);
                var technologyType = ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]);
                var adUnitId = await LookupId(conn, "ad_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"G{row}"]));

                await ExecuteNonQuery(conn, @"
                    INSERT INTO emissions
                    (id, ""installationDataId"", ""emissionTypeId"", ""emissionMethod2Id"",
                     ""technologyType"",
                     ""adActivityData"", ""adUnitId"",
                     ""aFrequency"", ""aDuration"", ""aSefCf4"",
                     ""bAeo"", ""bCe"", ""bOvc"",
                     ""fC2f6"",
                     ""tc2f6C2f6Emission"",
                     ""tco2eGwpCf4"", ""tco2eGwpC2f6"",
                     ""tco2eCf4Emission"", ""tco2eC2f6Emission"",
                     ""collectionEfficiency"",
                     ""co2eFossil"",
                     ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @etId, @em2Id,
                     @techType,
                     @ad, @adUnit,
                     @freq, @dur, @sef,
                     @aeo, @ce, @ovc,
                     @fc2f6,
                     @tc2f6,
                     @gwpCf4, @gwpC2f6,
                     @tco2eCf4, @tco2eC2f6,
                     @collEff,
                     @co2eF,
                     NOW())",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("etId", emissionTypeId), Param("em2Id", emissionMethod2Id),
                    Param("techType", technologyType),
                    ParamDecimal("ad", ExcelHelper.SafeParseDecimal(ws.Cells[$"F{row}"])),
                    Param("adUnit", adUnitId),
                    ParamDecimal("freq", ExcelHelper.SafeParseDecimal(ws.Cells[$"AG{row}"])),
                    ParamDecimal("dur", ExcelHelper.SafeParseDecimal(ws.Cells[$"AH{row}"])),
                    ParamDecimal("sef", ExcelHelper.SafeParseDecimal(ws.Cells[$"AI{row}"])),
                    ParamDecimal("aeo", ExcelHelper.SafeParseDecimal(ws.Cells[$"AJ{row}"])),
                    ParamDecimal("ce", ExcelHelper.SafeParseDecimal(ws.Cells[$"AK{row}"])),
                    ParamDecimal("ovc", ExcelHelper.SafeParseDecimal(ws.Cells[$"AL{row}"])),
                    ParamDecimal("fc2f6", ExcelHelper.SafeParseDecimal(ws.Cells[$"AM{row}"])),
                    ParamDecimal("tc2f6", ExcelHelper.SafeParseDecimal(ws.Cells[$"AO{row}"])),
                    ParamDecimal("gwpCf4", ExcelHelper.SafeParseDecimal(ws.Cells[$"AP{row}"])),
                    ParamDecimal("gwpC2f6", ExcelHelper.SafeParseDecimal(ws.Cells[$"AQ{row}"])),
                    ParamDecimal("tco2eCf4", ExcelHelper.SafeParseDecimal(ws.Cells[$"AR{row}"])),
                    ParamDecimal("tco2eC2f6", ExcelHelper.SafeParseDecimal(ws.Cells[$"AS{row}"])),
                    ParamDecimal("collEff", ExcelHelper.SafeParseDecimal(ws.Cells[$"AT{row}"])),
                    ParamDecimal("co2eF", ExcelHelper.SafeParseDecimal(ws.Cells[$"AU{row}"])));

                result.RecordsCreated++;
            }

            // === ES (MBA) Emissions (rows 113-122, v1.0 ref: lines 448-500) ===
            for (int row = 113; row <= 122; row++)
            {
                var methodName = ExcelHelper.SafeGetText(ws.Cells[$"D{row}"]);
                if (methodName == null) continue;

                var emissionTypeId = await LookupId(conn, "emission_types", "code", "ES");
                var emissionMethod3Id = await LookupId(conn, "emission_method3s", "name", methodName);
                var typeOfGhgId = await LookupId(conn, "type_of_ghgs", "name", ExcelHelper.SafeGetText(ws.Cells[$"E{row}"]));

                var bioCUnitId = await LookupId(conn, "bio_c_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"S{row}"]));
                var ghgConcUnitId = await LookupId(conn, "ghg_conc_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"W{row}"]));
                var hoursOpUnitId = await LookupId(conn, "hours_operating_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"Y{row}"]));
                var flueGasUnitId = await LookupId(conn, "flue_gas_flow_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"AA{row}"]));
                var annualGhgUnitId = await LookupId(conn, "annual_amount_of_ghg_units", "name", ExcelHelper.SafeGetText(ws.Cells[$"AE{row}"]));

                await ExecuteNonQuery(conn, @"
                    INSERT INTO emissions
                    (id, ""installationDataId"", ""emissionTypeId"", ""emissionMethod3Id"",
                     ""typeOfGhgId"",
                     ""bioCBiomassContent"", ""bioCUnitId"",
                     ""hourlyGhgConcAverage"", ""hourlyGhgConcUnitId"",
                     ""hoursOperating"", ""hoursOperatingUnitId"",
                     ""flueGasFlowAverage"", ""flueGasFlowAverageUnitId"",
                     ""annualAmountOfGhg"", ""annualAmountOfGhgUnitId"",
                     ""gwpTco2e"",
                     ""co2eFossil"", ""co2eBio"",
                     ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, @etId, @em3Id,
                     @ghgId,
                     @bioC, @bioCUnit,
                     @ghgConc, @ghgConcUnit,
                     @hours, @hoursUnit,
                     @flueGas, @flueGasUnit,
                     @annualGhg, @annualGhgUnit,
                     @gwp,
                     @co2eF, @co2eB,
                     NOW())",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("etId", emissionTypeId), Param("em3Id", emissionMethod3Id),
                    Param("ghgId", typeOfGhgId),
                    ParamDecimal("bioC", ExcelHelper.SafeParseDecimal(ws.Cells[$"R{row}"])),
                    Param("bioCUnit", bioCUnitId),
                    ParamDecimal("ghgConc", ExcelHelper.SafeParseDecimal(ws.Cells[$"V{row}"])),
                    Param("ghgConcUnit", ghgConcUnitId),
                    ParamDecimal("hours", ExcelHelper.SafeParseDecimal(ws.Cells[$"X{row}"])),
                    Param("hoursUnit", hoursOpUnitId),
                    ParamDecimal("flueGas", ExcelHelper.SafeParseDecimal(ws.Cells[$"Z{row}"])),
                    Param("flueGasUnit", flueGasUnitId),
                    ParamDecimal("annualGhg", ExcelHelper.SafeParseDecimal(ws.Cells[$"AD{row}"])),
                    Param("annualGhgUnit", annualGhgUnitId),
                    ParamDecimal("gwp", ExcelHelper.SafeParseDecimal(ws.Cells[$"AP{row}"])),
                    ParamDecimal("co2eF", ExcelHelper.SafeParseDecimal(ws.Cells[$"AU{row}"])),
                    ParamDecimal("co2eB", ExcelHelper.SafeParseDecimal(ws.Cells[$"AV{row}"])));

                result.RecordsCreated++;
            }

            await tx.CommitAsync();
            result.Imported = true;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            result.Errors.Add($"Sheet B error: {ex.Message}");
        }

        return result;
    }

    // ========================================================================
    // SHEET C: C_Emissions&Energy
    // v1.0 ref: Lines 523-682 of CBAMExcelFileViewController.cs
    // ========================================================================
    private async Task<SheetResult> ImportSheetC(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var result = new SheetResult();
        var ws = package.Workbook.Worksheets[Sheet_C];
        if (ws == null) { result.Errors.Add("Sheet C_Emissions&Energy not found"); return result; }

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // === Fuel Balance (3 rows: H15-L17, v1.0 ref: lines 541-589) ===
            var fbUnitId = await LookupId(conn, "fuel_balance_units", "name", "TJ");
            var fbNames = new[] { "from sheet B_EmInst", "manual entries", "Results" };
            var fbRows = new[] { 15, 16, 17 };

            for (int i = 0; i < 3; i++)
            {
                var existingId = await ExecuteScalar<string>(conn,
                    @"SELECT id FROM fuel_balances WHERE ""installationDataId"" = @instId AND name = @name",
                    new NpgsqlParameter("instId", installationDataId), new NpgsqlParameter("name", fbNames[i]));

                int row = fbRows[i];
                if (existingId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        UPDATE fuel_balances SET
                        ""totalFuelInput"" = @tfi, ""directFuelForCbamGoods"" = @dfcg,
                        ""fuelForElectricity"" = @fe, ""directFuelForNonCbamGoods"" = @dfncg, rest = @rest
                        WHERE id = @id",
                        new NpgsqlParameter("id", existingId),
                        ParamDecimal("tfi", ExcelHelper.ForceParseDecimal(ws.Cells[$"H{row}"])),
                        ParamDecimal("dfcg", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"I{row}"])),
                        ParamDecimal("fe", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"J{row}"])),
                        ParamDecimal("dfncg", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"K{row}"])),
                        ParamDecimal("rest", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"L{row}"])));
                    result.RecordsUpdated++;
                }
                else
                {
                    await ExecuteNonQuery(conn, @"
                        INSERT INTO fuel_balances
                        (id, ""installationDataId"", name, ""unitId"",
                         ""totalFuelInput"", ""directFuelForCbamGoods"", ""fuelForElectricity"",
                         ""directFuelForNonCbamGoods"", rest, ""createdAt"")
                        VALUES (gen_random_uuid(), @instId, @name, @unitId,
                         @tfi, @dfcg, @fe, @dfncg, @rest, NOW())",
                        new NpgsqlParameter("instId", installationDataId),
                        new NpgsqlParameter("name", fbNames[i]),
                        Param("unitId", fbUnitId),
                        ParamDecimal("tfi", ExcelHelper.ForceParseDecimal(ws.Cells[$"H{row}"])),
                        ParamDecimal("dfcg", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"I{row}"])),
                        ParamDecimal("fe", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"J{row}"])),
                        ParamDecimal("dfncg", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"K{row}"])),
                        ParamDecimal("rest", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"L{row}"])));
                    result.RecordsCreated++;
                }
            }

            // === GHG Balance by Type (3 rows: H24-N26, v1.0 ref: lines 593-644) ===
            var ghgUnitId = await LookupId(conn, "ghg_balance_units", "name", "tCO2e");
            var ghgNames = new[] { "from sheet B_EmInst", "manual entries", "Results" };
            var ghgRows = new[] { 24, 25, 26 };

            for (int i = 0; i < 3; i++)
            {
                var existingId = await ExecuteScalar<string>(conn,
                    @"SELECT id FROM ghg_balance_by_types WHERE ""installationDataId"" = @instId AND name = @name",
                    new NpgsqlParameter("instId", installationDataId), new NpgsqlParameter("name", ghgNames[i]));

                int row = ghgRows[i];
                if (existingId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        UPDATE ghg_balance_by_types SET
                        ""totalCo2Emissions"" = @co2, ""biomassEmissions"" = @bio,
                        ""totalN2oEmissions"" = @n2o, ""totalPfcEmissions"" = @pfc,
                        ""totalDirectEmissions"" = @direct, ""totalIndirectEmissions"" = @indirect,
                        ""totalEmissions"" = @total
                        WHERE id = @id",
                        new NpgsqlParameter("id", existingId),
                        ParamDecimal("co2", ExcelHelper.ForceParseDecimal(ws.Cells[$"H{row}"])),
                        ParamDecimal("bio", ExcelHelper.ForceParseDecimal(ws.Cells[$"I{row}"])),
                        ParamDecimal("n2o", ExcelHelper.ForceParseDecimal(ws.Cells[$"J{row}"])),
                        ParamDecimal("pfc", ExcelHelper.ForceParseDecimal(ws.Cells[$"K{row}"])),
                        ParamDecimal("direct", ExcelHelper.ForceParseDecimal(ws.Cells[$"L{row}"])),
                        ParamDecimal("indirect", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"M{row}"])),
                        ParamDecimal("total", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"N{row}"])));
                    result.RecordsUpdated++;
                }
                else
                {
                    await ExecuteNonQuery(conn, @"
                        INSERT INTO ghg_balance_by_types
                        (id, ""installationDataId"", name, ""unitId"",
                         ""totalCo2Emissions"", ""biomassEmissions"", ""totalN2oEmissions"",
                         ""totalPfcEmissions"", ""totalDirectEmissions"", ""totalIndirectEmissions"",
                         ""totalEmissions"", ""createdAt"")
                        VALUES (gen_random_uuid(), @instId, @name, @unitId,
                         @co2, @bio, @n2o, @pfc, @direct, @indirect, @total, NOW())",
                        new NpgsqlParameter("instId", installationDataId),
                        new NpgsqlParameter("name", ghgNames[i]),
                        Param("unitId", ghgUnitId),
                        ParamDecimal("co2", ExcelHelper.ForceParseDecimal(ws.Cells[$"H{row}"])),
                        ParamDecimal("bio", ExcelHelper.ForceParseDecimal(ws.Cells[$"I{row}"])),
                        ParamDecimal("n2o", ExcelHelper.ForceParseDecimal(ws.Cells[$"J{row}"])),
                        ParamDecimal("pfc", ExcelHelper.ForceParseDecimal(ws.Cells[$"K{row}"])),
                        ParamDecimal("direct", ExcelHelper.ForceParseDecimal(ws.Cells[$"L{row}"])),
                        ParamDecimal("indirect", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"M{row}"])),
                        ParamDecimal("total", i == 0 ? 0m : ExcelHelper.ForceParseDecimal(ws.Cells[$"N{row}"])));
                    result.RecordsCreated++;
                }
            }

            // === GHG Balance by Monitoring Methodology (row 31, v1.0 ref: lines 648-666) ===
            var mmExistingId = await ExecuteScalar<string>(conn,
                @"SELECT id FROM ghg_balance_by_monitoring_methodology_types WHERE ""installationDataId"" = @instId AND name = 'Emissions'",
                new NpgsqlParameter("instId", installationDataId));

            if (mmExistingId != null)
            {
                await ExecuteNonQuery(conn, @"
                    UPDATE ghg_balance_by_monitoring_methodology_types SET
                    ""calculationBasedExclPfcEmissions"" = @calc, ""totalPfcEmissions"" = @pfc,
                    ""measurementBased"" = @meas, other = @other
                    WHERE id = @id",
                    new NpgsqlParameter("id", mmExistingId),
                    ParamDecimal("calc", ExcelHelper.ForceParseDecimal(ws.Cells["H31"])),
                    ParamDecimal("pfc", ExcelHelper.ForceParseDecimal(ws.Cells["I31"])),
                    ParamDecimal("meas", ExcelHelper.ForceParseDecimal(ws.Cells["J31"])),
                    ParamDecimal("other", ExcelHelper.ForceParseDecimal(ws.Cells["K31"])));
                result.RecordsUpdated++;
            }
            else
            {
                await ExecuteNonQuery(conn, @"
                    INSERT INTO ghg_balance_by_monitoring_methodology_types
                    (id, ""installationDataId"", name, ""unitId"",
                     ""calculationBasedExclPfcEmissions"", ""totalPfcEmissions"",
                     ""measurementBased"", other, ""createdAt"")
                    VALUES (gen_random_uuid(), @instId, 'Emissions', @unitId,
                     @calc, @pfc, @meas, @other, NOW())",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("unitId", ghgUnitId),
                    ParamDecimal("calc", ExcelHelper.ForceParseDecimal(ws.Cells["H31"])),
                    ParamDecimal("pfc", ExcelHelper.ForceParseDecimal(ws.Cells["I31"])),
                    ParamDecimal("meas", ExcelHelper.ForceParseDecimal(ws.Cells["J31"])),
                    ParamDecimal("other", ExcelHelper.ForceParseDecimal(ws.Cells["K31"])));
                result.RecordsCreated++;
            }

            // === Quality Data References (H40-H42, v1.0 ref: lines 669-678) ===
            var qualityName = ExcelHelper.SafeGetText(ws.Cells["H40"]);
            var justName = ExcelHelper.SafeGetText(ws.Cells["H41"]);
            var qaName = ExcelHelper.SafeGetText(ws.Cells["H42"]);

            if (qualityName != null || justName != null || qaName != null)
            {
                var qualityId = qualityName != null ?
                    await ExecuteScalar<string>(conn, @"SELECT id FROM general_info_on_data_quality WHERE ""qualityLevel"" = @name",
                        new NpgsqlParameter("name", qualityName)) : null;
                var justId = justName != null ?
                    await LookupId(conn, "justification_for_default_values", "justification", justName) : null;
                var qaId = qaName != null ?
                    await LookupId(conn, "info_on_quality_assurances", "description", qaName) : null;

                await ExecuteNonQuery(conn, @"
                    UPDATE installation_datas SET
                    ""generalInfoOnDataQualityId"" = @qId,
                    ""justificationForDefaultValueId"" = @jId,
                    ""infoOnQualityAssuranceId"" = @qaId
                    WHERE id = @instId",
                    new NpgsqlParameter("instId", installationDataId),
                    Param("qId", qualityId), Param("jId", justId), Param("qaId", qaId));
            }

            await tx.CommitAsync();
            result.Imported = true;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            result.Errors.Add($"Sheet C error: {ex.Message}");
        }

        return result;
    }

    // ========================================================================
    // SHEET D: D_Processes
    // v1.0 ref: Lines 693-789 of CBAMExcelFileViewController.cs
    // BUG FIX: L54/L65/L66 - v1.0 wrote all 3 to DDirectlyAttributableEmissionsValue
    // v2.0: L54 -> DDirectlyAttributableEmissions
    //       L65 -> DEmissionsFromHeatBalance (NEW FIELD)
    //       L66 -> DEmissionsFromWasteGasesBalance (NEW FIELD)
    // ========================================================================
    private async Task<SheetResult> ImportSheetD(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var result = new SheetResult();
        var ws = package.Workbook.Worksheets[Sheet_D];
        if (ws == null) { result.Errors.Add("Sheet D_Processes not found"); return result; }

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Get all RelevantProductionProcesses for this installationData
            var rppIds = new List<string>();
            await using (var cmd = new NpgsqlCommand(
                @"SELECT id FROM relevant_production_processes WHERE ""installationDataId"" = @instId ORDER BY ""createdAt""",
                conn))
            {
                cmd.Parameters.AddWithValue("instId", installationDataId);
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    rppIds.Add(reader.GetString(0));
            }

            foreach (var rppId in rppIds)
            {
                // Update DTotalProductionLevel
                var dplId = await ExecuteScalar<string>(conn,
                    @"SELECT id FROM d_total_production_levels WHERE ""relevantProductionProcessId"" = @rppId LIMIT 1",
                    new NpgsqlParameter("rppId", rppId));

                if (dplId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        UPDATE d_total_production_levels SET amount = @amt WHERE id = @id",
                        new NpgsqlParameter("id", dplId),
                        ParamDecimal("amt", ExcelHelper.ForceParseDecimal(ws.Cells["L16"])));
                    result.RecordsUpdated++;
                }

                // Update RelevantProductionProcess fields from Sheet D
                // BUG FIX: v1.0 lines 754-769 - L54, L65, L66 all wrote to same field!
                await ExecuteNonQuery(conn, @"
                    UPDATE relevant_production_processes SET
                    ""dProducedForTheMarket"" = @produced,
                    ""dConsumedForNonCbamGoodsWithinTheInstallation"" = @consumed,
                    ""dApplicableElementsMeasurableHeat"" = @heat,
                    ""dApplicableElementsWasteGases"" = @waste,
                    ""dDirectlyAttributableEmissionsValue"" = @directEmissions,
                    ""dEmissionsFromHeatBalance"" = @heatBalance,
                    ""dEmissionsFromWasteGasesBalance"" = @wasteBalance,
                    ""dElectricityExportedFromAmountsExportedValue"" = @elecExported,
                    ""dElectricityExportedFromEmissionFactorOfTheElectricityValue"" = @elecEF
                    WHERE id = @id",
                    new NpgsqlParameter("id", rppId),
                    ParamDecimal("produced", ExcelHelper.ForceParseDecimal(ws.Cells["L27"])),
                    ParamDecimal("consumed", ExcelHelper.ForceParseDecimal(ws.Cells["L41"])),
                    new NpgsqlParameter("heat", (object?)ExcelHelper.SafeParseBool(ws.Cells["K50"]) ?? DBNull.Value),
                    new NpgsqlParameter("waste", (object?)ExcelHelper.SafeParseBool(ws.Cells["L50"]) ?? DBNull.Value),
                    // === BUG FIX: 3 separate fields instead of 1 ===
                    ParamDecimal("directEmissions", ExcelHelper.ForceParseDecimal(ws.Cells["L54"])),     // L54 -> direct
                    ParamDecimal("heatBalance", ExcelHelper.ForceParseDecimal(ws.Cells["L65"])),          // L65 -> heat (NEW)
                    ParamDecimal("wasteBalance", ExcelHelper.ForceParseDecimal(ws.Cells["L66"])),         // L66 -> waste (NEW)
                    ParamDecimal("elecExported", ExcelHelper.ForceParseDecimal(ws.Cells["L71"])),
                    ParamDecimal("elecEF", ExcelHelper.ForceParseDecimal(ws.Cells["L72"])));

                result.RecordsUpdated++;
            }

            await tx.CommitAsync();
            result.Imported = true;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            result.Errors.Add($"Sheet D error: {ex.Message}");
        }

        return result;
    }

    // ========================================================================
    // SHEET E: E_PurchPrec
    // v1.0 ref: Lines 804-948 of CBAMExcelFileViewController.cs
    // ========================================================================
    private async Task<SheetResult> ImportSheetE(ExcelPackage package, NpgsqlConnection conn, string installationDataId)
    {
        var result = new SheetResult();
        var ws = package.Workbook.Worksheets[Sheet_E];
        if (ws == null) { result.Errors.Add("Sheet E_PurchPrec not found"); return result; }

        await using var tx = await conn.BeginTransactionAsync();
        try
        {
            // Get all PurchasedPrecursors for this installationData
            var ppIds = new List<string>();
            await using (var cmd = new NpgsqlCommand(
                @"SELECT id FROM purchased_precursors WHERE ""installationDataId"" = @instId ORDER BY ""createdAt""",
                conn))
            {
                cmd.Parameters.AddWithValue("instId", installationDataId);
                await using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    ppIds.Add(reader.GetString(0));
            }

            foreach (var ppId in ppIds)
            {
                // Update ETotalPurchasedLevel
                var eplId = await ExecuteScalar<string>(conn,
                    @"SELECT id FROM e_total_purchased_levels WHERE ""purchasedPrecursorId"" = @ppId LIMIT 1",
                    new NpgsqlParameter("ppId", ppId));

                if (eplId != null)
                {
                    await ExecuteNonQuery(conn, @"
                        UPDATE e_total_purchased_levels SET amount = @amt WHERE id = @id",
                        new NpgsqlParameter("id", eplId),
                        ParamDecimal("amt", ExcelHelper.ForceParseDecimal(ws.Cells["L17"])));
                    result.RecordsUpdated++;
                }

                // Specific embedded emission source mapping (v1.0 ref: lines 866-874)
                var directEmSource = ExcelHelper.SafeGetText(ws.Cells["M49"]) switch
                {
                    "Default" => "DEFAULT",
                    "Measured" => "MEASURED",
                    "Unknown" => "UNKNOWN",
                    _ => "UNDEFINED"
                };

                // Electricity consumption source (v1.0 ref: lines 889-897)
                var elecConsSource = ExcelHelper.SafeGetText(ws.Cells["M50"]) switch
                {
                    "Default" => "DEFAULT",
                    "Measured" => "MEASURED",
                    "Unknown" => "UNKNOWN",
                    _ => "UNDEFINED"
                };

                // Electricity emission factor source (v1.0 ref: lines 912-928)
                var elecEfSource = ExcelHelper.SafeGetText(ws.Cells["M51"]) switch
                {
                    "D.4(a)" => "D400A",
                    "D.4(b)" => "D400B",
                    "D.4.1" => "D410",
                    "D.4.2" => "D420",
                    "D.3.1" => "D431",
                    "D.3.2" => "D432",
                    "Mix" => "Mix",
                    _ => "Undefined"
                };

                await ExecuteNonQuery(conn, @"
                    UPDATE purchased_precursors SET
                    ""eTotalPurchaseForPossibleConsumptionWi"" = @totalPurch,
                    ""eConsumedForOtherPurposesForNonCbam"" = @consumed,
                    ""eSpecificEmbedEmissions"" = @embedEm,
                    ""eSpecificEmbedDirectEmissionsUnit"" = @deUnit,
                    ""eSpecificEmbedDirectEmissionsValue"" = @deValue,
                    ""eSpecificEmbedDirectEmissionsSource"" = @deSource::""SpecificEmbeddedEmissionSource"",
                    ""eSpecificElectricityConsumptionUnit"" = @ecUnit,
                    ""eSpecificElectricityConsumptionValue"" = @ecValue,
                    ""eSpecificElectricityConsumptionSource"" = @ecSource::""SpecificEmbeddedEmissionSource"",
                    ""eElectricityEmissionFactorUnit"" = @efUnit,
                    ""eElectricityEmissionFactorValue"" = @efValue,
                    ""eElectricityEmissionFactorSource"" = @efSource::""ElectricityEmissionFactor"",
                    ""eSpecificEmbeddedIndirectEmissionsUnit"" = @ieUnit,
                    ""eSpecificEmbeddedIndirectEmissionsValue"" = @ieValue
                    WHERE id = @id",
                    new NpgsqlParameter("id", ppId),
                    ParamDecimal("totalPurch", ExcelHelper.ForceParseDecimal(ws.Cells["L25"])),
                    ParamDecimal("consumed", ExcelHelper.ForceParseDecimal(ws.Cells["L38"])),
                    Param("embedEm", ExcelHelper.SafeGetText(ws.Cells["J42"])),
                    Param("deUnit", ExcelHelper.SafeGetText(ws.Cells["K49"])),
                    ParamDecimal("deValue", ExcelHelper.ForceParseDecimal(ws.Cells["L49"])),
                    new NpgsqlParameter("deSource", directEmSource),
                    Param("ecUnit", ExcelHelper.SafeGetText(ws.Cells["K50"])),
                    ParamDecimal("ecValue", ExcelHelper.ForceParseDecimal(ws.Cells["L50"])),
                    new NpgsqlParameter("ecSource", elecConsSource),
                    Param("efUnit", ExcelHelper.SafeGetText(ws.Cells["K51"])),
                    ParamDecimal("efValue", ExcelHelper.ForceParseDecimal(ws.Cells["L51"])),
                    new NpgsqlParameter("efSource", elecEfSource),
                    Param("ieUnit", ExcelHelper.SafeGetText(ws.Cells["K52"])),
                    ParamDecimal("ieValue", ExcelHelper.ForceParseDecimal(ws.Cells["L52"])));

                result.RecordsUpdated++;
            }

            await tx.CommitAsync();
            result.Imported = true;
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync();
            result.Errors.Add($"Sheet E error: {ex.Message}");
        }

        return result;
    }

    // ========================================================================
    // Helper Methods
    // ========================================================================

    private static async Task<string?> LookupId(NpgsqlConnection conn, string table, string column, string? value)
    {
        if (value == null) return null;
        await using var cmd = new NpgsqlCommand($"SELECT id FROM {table} WHERE \"{column}\" = @val LIMIT 1", conn);
        cmd.Parameters.AddWithValue("val", value);
        var result = await cmd.ExecuteScalarAsync();
        return result?.ToString();
    }

    private static async Task<T?> ExecuteScalar<T>(NpgsqlConnection conn, string sql, params NpgsqlParameter[] parameters)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddRange(parameters);
        var result = await cmd.ExecuteScalarAsync();
        if (result == null || result == DBNull.Value) return default;
        return (T)Convert.ChangeType(result, typeof(T));
    }

    private static async Task ExecuteNonQuery(NpgsqlConnection conn, string sql, params NpgsqlParameter[] parameters)
    {
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddRange(parameters);
        await cmd.ExecuteNonQueryAsync();
    }

    private static NpgsqlParameter Param(string name, string? value)
    {
        return new NpgsqlParameter(name, (object?)value ?? DBNull.Value);
    }

    private static NpgsqlParameter ParamDecimal(string name, decimal? value)
    {
        return new NpgsqlParameter(name, NpgsqlTypes.NpgsqlDbType.Numeric) { Value = (object?)value ?? DBNull.Value };
    }
}
