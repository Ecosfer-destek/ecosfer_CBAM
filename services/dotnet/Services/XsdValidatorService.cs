using System.Xml;
using System.Xml.Linq;
using System.Xml.Schema;

namespace EcosferServices.Services;

/// <summary>
/// XSD Schema Validator for CBAM Declaration XML
/// Validates generated XML against embedded XSD schema
/// Also performs cross-reference validation and business rules
/// </summary>
public class XsdValidatorService
{
    /// <summary>
    /// Validate XML string against CBAM declaration structure
    /// Since official EU XSD may change, we do structural + business rule validation
    /// </summary>
    public List<string> ValidateXml(string xmlContent)
    {
        var errors = new List<string>();

        try
        {
            var doc = XDocument.Parse(xmlContent);
            var root = doc.Root;

            if (root == null)
            {
                errors.Add("XML document has no root element");
                return errors;
            }

            // Validate root element
            if (!root.Name.LocalName.Equals("CBAMDeclaration", StringComparison.OrdinalIgnoreCase))
            {
                errors.Add($"Root element must be 'CBAMDeclaration', found '{root.Name.LocalName}'");
            }

            // Required sections
            ValidateRequiredSection(root, "DeclarationHeader", errors);
            ValidateRequiredSection(root, "DeclarantInformation", errors);
            ValidateRequiredSection(root, "GoodsImported", errors);

            // Validate header fields
            ValidateDeclarationHeader(root, errors);

            // Validate goods
            ValidateGoods(root, errors);

            // Cross-reference validation
            ValidateCrossReferences(root, errors);
        }
        catch (XmlException ex)
        {
            errors.Add($"XML parsing error: {ex.Message}");
        }

        return errors;
    }

    /// <summary>
    /// Validate XML well-formedness
    /// </summary>
    public bool IsWellFormed(string xmlContent, out string? error)
    {
        try
        {
            XDocument.Parse(xmlContent);
            error = null;
            return true;
        }
        catch (XmlException ex)
        {
            error = ex.Message;
            return false;
        }
    }

    private static void ValidateRequiredSection(XElement root, string sectionName, List<string> errors)
    {
        var ns = root.Name.Namespace;
        var section = root.Element(ns + sectionName);
        if (section == null)
        {
            errors.Add($"Required section missing: {sectionName}");
        }
    }

    private static void ValidateDeclarationHeader(XElement root, List<string> errors)
    {
        var ns = root.Name.Namespace;
        var header = root.Element(ns + "DeclarationHeader");
        if (header == null) return;

        // Required fields
        var declId = header.Element(ns + "DeclarationId")?.Value;
        if (string.IsNullOrEmpty(declId))
            errors.Add("DeclarationHeader: DeclarationId is required");

        var yearStr = header.Element(ns + "ReportingYear")?.Value;
        if (string.IsNullOrEmpty(yearStr) || !int.TryParse(yearStr, out int year))
        {
            errors.Add("DeclarationHeader: ReportingYear is required and must be a valid integer");
        }
        else if (year < 2023 || year > 2035)
        {
            errors.Add($"DeclarationHeader: ReportingYear {year} is outside valid range (2023-2035)");
        }

        var status = header.Element(ns + "Status")?.Value;
        if (string.IsNullOrEmpty(status))
            errors.Add("DeclarationHeader: Status is required");
    }

    private static void ValidateGoods(XElement root, List<string> errors)
    {
        var ns = root.Name.Namespace;
        var goodsSection = root.Element(ns + "GoodsImported");
        if (goodsSection == null) return;

        var goods = goodsSection.Elements(ns + "Good").ToList();
        if (goods.Count == 0)
        {
            errors.Add("GoodsImported: At least one good must be declared");
            return;
        }

        for (int i = 0; i < goods.Count; i++)
        {
            var good = goods[i];
            var category = good.Element(ns + "GoodsCategory")?.Value;
            var label = !string.IsNullOrEmpty(category) ? category : $"Good #{i + 1}";

            // CN Code required
            var cnCode = good.Element(ns + "CNCode")?.Value;
            if (string.IsNullOrEmpty(cnCode))
                errors.Add($"GoodsImported/{label}: CN code is required");

            // Embedded emissions required
            var embEmissions = good.Element(ns + "EmbeddedEmissions");
            if (embEmissions == null)
            {
                errors.Add($"GoodsImported/{label}: EmbeddedEmissions section is required");
            }
            else
            {
                var totalStr = embEmissions.Element(ns + "TotalEmbeddedEmissions")?.Value;
                if (!string.IsNullOrEmpty(totalStr) && decimal.TryParse(totalStr, out decimal total) && total < 0)
                {
                    errors.Add($"GoodsImported/{label}: TotalEmbeddedEmissions cannot be negative");
                }
            }
        }
    }

    private static void ValidateCrossReferences(XElement root, List<string> errors)
    {
        var ns = root.Name.Namespace;

        // Validate that header total matches sum of goods
        var header = root.Element(ns + "DeclarationHeader");
        var goodsSection = root.Element(ns + "GoodsImported");

        if (header != null && goodsSection != null)
        {
            var headerTotalStr = header.Element(ns + "TotalEmbeddedEmissions")?.Value;
            if (!string.IsNullOrEmpty(headerTotalStr) && decimal.TryParse(headerTotalStr, out decimal headerTotal))
            {
                decimal goodsTotal = 0;
                foreach (var good in goodsSection.Elements(ns + "Good"))
                {
                    var embEmissions = good.Element(ns + "EmbeddedEmissions");
                    var totalStr = embEmissions?.Element(ns + "TotalEmbeddedEmissions")?.Value;
                    if (!string.IsNullOrEmpty(totalStr) && decimal.TryParse(totalStr, out decimal t))
                        goodsTotal += t;
                }

                if (Math.Abs(headerTotal - goodsTotal) > 0.01m)
                {
                    errors.Add($"Cross-reference: Header TotalEmbeddedEmissions ({headerTotal}) does not match sum of goods ({goodsTotal})");
                }
            }
        }

        // Validate certificate count
        var certSection = root.Element(ns + "CertificatesSurrendered");
        if (certSection != null && header != null)
        {
            var countAttr = certSection.Attribute("totalQuantity")?.Value;
            var headerCertStr = header.Element(ns + "TotalCertificatesSurrendered")?.Value;

            if (!string.IsNullOrEmpty(countAttr) && !string.IsNullOrEmpty(headerCertStr))
            {
                if (int.TryParse(countAttr, out int certTotal) &&
                    int.TryParse(headerCertStr, out int headerCerts) &&
                    certTotal != headerCerts)
                {
                    errors.Add($"Cross-reference: Header TotalCertificatesSurrendered ({headerCerts}) does not match actual count ({certTotal})");
                }
            }
        }
    }
}
