using OfficeOpenXml;

namespace EcosferServices.Tests.Helpers;

/// <summary>
/// Helper class to create real EPPlus ExcelRange objects for testing.
/// EPPlus ExcelRange is sealed/complex and cannot be easily mocked,
/// so we build actual ExcelPackage instances and extract cell ranges.
/// </summary>
public static class ExcelTestHelper
{
    static ExcelTestHelper()
    {
        // EPPlus 7+ requires a license context for non-commercial use
        ExcelPackage.License.SetNonCommercialOrganization("EcosferServices.Tests");
    }

    /// <summary>
    /// Creates an ExcelRange cell with the given value set in cell A1.
    /// The returned ExcelRange points to that cell.
    /// Caller is responsible for disposing the ExcelPackage if needed,
    /// but for short-lived test scenarios GC handles it fine.
    /// </summary>
    public static ExcelRange CreateCell(object? value)
    {
        var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("TestSheet");
        var cell = worksheet.Cells["A1"];

        if (value is not null)
        {
            cell.Value = value;
        }

        return cell;
    }

    /// <summary>
    /// Creates an ExcelRange cell with no value (null).
    /// </summary>
    public static ExcelRange CreateNullCell()
    {
        var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("TestSheet");
        // Cell exists but has no value assigned - Value will be null
        return worksheet.Cells["A1"];
    }

    /// <summary>
    /// Creates an ExcelRange cell with an empty string value.
    /// </summary>
    public static ExcelRange CreateEmptyCell()
    {
        return CreateCell(string.Empty);
    }

    /// <summary>
    /// Creates an ExcelRange cell with whitespace-only text.
    /// </summary>
    public static ExcelRange CreateWhitespaceCell()
    {
        return CreateCell("   ");
    }
}
