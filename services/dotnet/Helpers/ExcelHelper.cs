using OfficeOpenXml;

namespace EcosferServices.Helpers;

public static class ExcelHelper
{
    /// <summary>
    /// Safely parse a cell value to decimal, returning null for empty/invalid values.
    /// Replaces v1.0's decimal.Parse() calls that could throw on empty cells.
    /// </summary>
    public static decimal? SafeParseDecimal(ExcelRange cell)
    {
        if (cell?.Value == null) return null;
        var text = cell.Value.ToString()?.Trim();
        if (string.IsNullOrEmpty(text)) return null;
        return decimal.TryParse(text, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var result) ? result : null;
    }

    /// <summary>
    /// Force-parse a cell value to decimal, returning 0 for empty/invalid values.
    /// Used for cells where v1.0 uses NumericValue (always expects a number).
    /// </summary>
    public static decimal ForceParseDecimal(ExcelRange cell)
    {
        return SafeParseDecimal(cell) ?? 0m;
    }

    /// <summary>
    /// Safely get text value from a cell, returning null for empty cells.
    /// Replaces v1.0's Value.TextValue and IsEmpty checks.
    /// </summary>
    public static string? SafeGetText(ExcelRange cell)
    {
        if (cell?.Value == null) return null;
        var text = cell.Value.ToString()?.Trim();
        return string.IsNullOrEmpty(text) ? null : text;
    }

    /// <summary>
    /// Check if a cell is empty (null, empty string, or whitespace).
    /// Replaces v1.0's Value.IsEmpty check.
    /// </summary>
    public static bool IsEmpty(ExcelRange cell)
    {
        return SafeGetText(cell) == null;
    }

    /// <summary>
    /// Safely parse a boolean from a cell ("True"/"False" text).
    /// </summary>
    public static bool? SafeParseBool(ExcelRange cell)
    {
        var text = SafeGetText(cell);
        if (text == null) return null;
        return text.Equals("True", StringComparison.OrdinalIgnoreCase) ? true :
               text.Equals("False", StringComparison.OrdinalIgnoreCase) ? false : null;
    }
}
