using EcosferServices.Services;
using FluentAssertions;

namespace EcosferServices.Tests;

/// <summary>
/// Unit tests for XsdValidatorService.
/// Tests XML structural validation, business rules, and cross-reference checks
/// for CBAM Declaration XML documents.
/// </summary>
public class XsdValidatorServiceTests
{
    private readonly XsdValidatorService _validator = new();

    // ========================================================================
    // Helper: builds a minimal valid CBAM Declaration XML
    // ========================================================================

    private static string BuildValidXml(
        string declarationId = "DECL-001",
        int reportingYear = 2024,
        string status = "Draft",
        string? headerTotalEmissions = null,
        string? goodTotalEmissions = null,
        string? cnCode = "72061000",
        string? goodsCategory = "Iron",
        bool includeGoods = true,
        bool includeDeclarant = true,
        bool includeHeader = true,
        string? certSectionTotalQuantity = null,
        string? headerTotalCerts = null)
    {
        var headerEmissionElement = headerTotalEmissions is not null
            ? $"<TotalEmbeddedEmissions>{headerTotalEmissions}</TotalEmbeddedEmissions>"
            : "";

        var headerCertsElement = headerTotalCerts is not null
            ? $"<TotalCertificatesSurrendered>{headerTotalCerts}</TotalCertificatesSurrendered>"
            : "";

        var header = includeHeader
            ? $"""
               <DeclarationHeader>
                   <DeclarationId>{declarationId}</DeclarationId>
                   <ReportingYear>{reportingYear}</ReportingYear>
                   <Status>{status}</Status>
                   {headerEmissionElement}
                   {headerCertsElement}
               </DeclarationHeader>
               """
            : "";

        var declarant = includeDeclarant
            ? """
              <DeclarantInformation>
                  <Name>Test Company</Name>
                  <TaxNumber>TR1234567890</TaxNumber>
              </DeclarantInformation>
              """
            : "";

        var goodEmissionElement = goodTotalEmissions is not null
            ? $"<TotalEmbeddedEmissions>{goodTotalEmissions}</TotalEmbeddedEmissions>"
            : "";

        var goods = includeGoods
            ? $"""
               <GoodsImported>
                   <Good>
                       <GoodsCategory>{goodsCategory}</GoodsCategory>
                       <CNCode>{cnCode}</CNCode>
                       <EmbeddedEmissions>
                           {goodEmissionElement}
                       </EmbeddedEmissions>
                   </Good>
               </GoodsImported>
               """
            : "";

        var certSection = certSectionTotalQuantity is not null
            ? $"""
               <CertificatesSurrendered totalQuantity="{certSectionTotalQuantity}">
                   <Certificate>
                       <CertificateNo>CERT-001</CertificateNo>
                   </Certificate>
               </CertificatesSurrendered>
               """
            : "";

        return $"""
                <?xml version="1.0" encoding="UTF-8"?>
                <CBAMDeclaration>
                    {header}
                    {declarant}
                    {goods}
                    {certSection}
                </CBAMDeclaration>
                """;
    }

    // ========================================================================
    // ValidateXml - structural validation
    // ========================================================================

    [Fact]
    public void ValidateXml_ValidStructure_ReturnsNoErrors()
    {
        // Arrange
        var xml = BuildValidXml();

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidateXml_MalformedXml_ReturnsParsError()
    {
        // Arrange
        var xml = "<CBAMDeclaration><unclosed>";

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().HaveCount(1);
        errors[0].Should().Contain("XML parsing error");
    }

    [Fact]
    public void ValidateXml_WrongRootElement_ReturnsError()
    {
        // Arrange
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <WrongRoot>
                      <DeclarationHeader>
                          <DeclarationId>1</DeclarationId>
                          <ReportingYear>2024</ReportingYear>
                          <Status>Draft</Status>
                      </DeclarationHeader>
                      <DeclarantInformation><Name>Test</Name></DeclarantInformation>
                      <GoodsImported><Good><CNCode>72061000</CNCode><EmbeddedEmissions/></Good></GoodsImported>
                  </WrongRoot>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Root element must be 'CBAMDeclaration'"));
    }

    [Fact]
    public void ValidateXml_EmptyRootElement_ReturnsMultipleErrors()
    {
        // Arrange - root exists but no required sections
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <CBAMDeclaration/>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Required section missing: DeclarationHeader"));
        errors.Should().Contain(e => e.Contains("Required section missing: DeclarantInformation"));
        errors.Should().Contain(e => e.Contains("Required section missing: GoodsImported"));
    }

    // ========================================================================
    // ValidateXml - required sections
    // ========================================================================

    [Fact]
    public void ValidateXml_MissingDeclarationHeader_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(includeHeader: false);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Required section missing: DeclarationHeader"));
    }

    [Fact]
    public void ValidateXml_MissingDeclarantInformation_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(includeDeclarant: false);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Required section missing: DeclarantInformation"));
    }

    [Fact]
    public void ValidateXml_MissingGoodsImported_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(includeGoods: false);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Required section missing: GoodsImported"));
    }

    // ========================================================================
    // ValidateXml - DeclarationHeader field validation
    // ========================================================================

    [Fact]
    public void ValidateXml_EmptyDeclarationId_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(declarationId: "");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("DeclarationId is required"));
    }

    [Fact]
    public void ValidateXml_InvalidReportingYear_ReturnsError()
    {
        // Arrange - Year outside valid range (2023-2035)
        var xml = BuildValidXml(reportingYear: 2020);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("outside valid range"));
    }

    [Fact]
    public void ValidateXml_YearTooHigh_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(reportingYear: 2040);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("outside valid range"));
    }

    [Fact]
    public void ValidateXml_BoundaryYear2023_ReturnsNoYearError()
    {
        // Arrange - 2023 is the minimum valid year
        var xml = BuildValidXml(reportingYear: 2023);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("ReportingYear"));
    }

    [Fact]
    public void ValidateXml_BoundaryYear2035_ReturnsNoYearError()
    {
        // Arrange - 2035 is the maximum valid year
        var xml = BuildValidXml(reportingYear: 2035);

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("ReportingYear"));
    }

    [Fact]
    public void ValidateXml_EmptyStatus_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(status: "");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Status is required"));
    }

    // ========================================================================
    // ValidateXml - Goods validation
    // ========================================================================

    [Fact]
    public void ValidateXml_EmptyGoodsSection_ReturnsError()
    {
        // Arrange - GoodsImported section exists but has no Good elements
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <CBAMDeclaration>
                      <DeclarationHeader>
                          <DeclarationId>DECL-001</DeclarationId>
                          <ReportingYear>2024</ReportingYear>
                          <Status>Draft</Status>
                      </DeclarationHeader>
                      <DeclarantInformation><Name>Test</Name></DeclarantInformation>
                      <GoodsImported/>
                  </CBAMDeclaration>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("At least one good must be declared"));
    }

    [Fact]
    public void ValidateXml_GoodWithoutCnCode_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(cnCode: "");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("CN code is required"));
    }

    [Fact]
    public void ValidateXml_NegativeEmbeddedEmissions_ReturnsError()
    {
        // Arrange
        var xml = BuildValidXml(goodTotalEmissions: "-100.5");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("TotalEmbeddedEmissions cannot be negative"));
    }

    [Fact]
    public void ValidateXml_ZeroEmbeddedEmissions_ReturnsNoError()
    {
        // Arrange - zero is valid
        var xml = BuildValidXml(goodTotalEmissions: "0");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("cannot be negative"));
    }

    [Fact]
    public void ValidateXml_PositiveEmbeddedEmissions_ReturnsNoError()
    {
        // Arrange
        var xml = BuildValidXml(goodTotalEmissions: "500.75");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("cannot be negative"));
    }

    // ========================================================================
    // ValidateXml - Cross-reference validation
    // ========================================================================

    [Fact]
    public void ValidateXml_MatchingHeaderAndGoodsTotals_ReturnsNoError()
    {
        // Arrange - header total matches sum of goods
        var xml = BuildValidXml(
            headerTotalEmissions: "100.50",
            goodTotalEmissions: "100.50");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("Cross-reference"));
    }

    [Fact]
    public void ValidateXml_MismatchedHeaderAndGoodsTotals_ReturnsError()
    {
        // Arrange - header total does NOT match sum of goods
        var xml = BuildValidXml(
            headerTotalEmissions: "200.00",
            goodTotalEmissions: "100.50");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Cross-reference") && e.Contains("does not match"));
    }

    [Fact]
    public void ValidateXml_MismatchedCertificateCount_ReturnsError()
    {
        // Arrange - header cert count does not match actual
        var xml = BuildValidXml(
            certSectionTotalQuantity: "5",
            headerTotalCerts: "10");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e =>
            e.Contains("Cross-reference") &&
            e.Contains("TotalCertificatesSurrendered"));
    }

    [Fact]
    public void ValidateXml_MatchingCertificateCount_ReturnsNoError()
    {
        // Arrange - header cert count matches actual
        var xml = BuildValidXml(
            certSectionTotalQuantity: "5",
            headerTotalCerts: "5");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e =>
            e.Contains("Cross-reference") &&
            e.Contains("TotalCertificatesSurrendered"));
    }

    // ========================================================================
    // ValidateXml - within tolerance
    // ========================================================================

    [Fact]
    public void ValidateXml_TotalWithinTolerance_ReturnsNoError()
    {
        // Arrange - difference is exactly 0.01 which is within tolerance (Math.Abs <= 0.01)
        var xml = BuildValidXml(
            headerTotalEmissions: "100.01",
            goodTotalEmissions: "100.00");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().NotContain(e => e.Contains("Cross-reference") && e.Contains("does not match"));
    }

    [Fact]
    public void ValidateXml_TotalJustOutsideTolerance_ReturnsError()
    {
        // Arrange - difference is 0.02 which is outside tolerance (> 0.01)
        var xml = BuildValidXml(
            headerTotalEmissions: "100.02",
            goodTotalEmissions: "100.00");

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("Cross-reference") && e.Contains("does not match"));
    }

    // ========================================================================
    // IsWellFormed
    // ========================================================================

    [Fact]
    public void IsWellFormed_ValidXml_ReturnsTrue()
    {
        // Arrange
        var xml = BuildValidXml();

        // Act
        var result = _validator.IsWellFormed(xml, out var error);

        // Assert
        result.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public void IsWellFormed_MalformedXml_ReturnsFalse()
    {
        // Arrange
        var xml = "<broken><tag>";

        // Act
        var result = _validator.IsWellFormed(xml, out var error);

        // Assert
        result.Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void IsWellFormed_EmptyString_ReturnsFalse()
    {
        // Arrange
        var xml = "";

        // Act
        var result = _validator.IsWellFormed(xml, out var error);

        // Assert
        result.Should().BeFalse();
        error.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void IsWellFormed_MinimalXml_ReturnsTrue()
    {
        // Arrange
        var xml = "<root/>";

        // Act
        var result = _validator.IsWellFormed(xml, out var error);

        // Assert
        result.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public void IsWellFormed_XmlWithNamespaces_ReturnsTrue()
    {
        // Arrange
        var xml = """<root xmlns="http://example.com/cbam"><child/></root>""";

        // Act
        var result = _validator.IsWellFormed(xml, out var error);

        // Assert
        result.Should().BeTrue();
        error.Should().BeNull();
    }

    // ========================================================================
    // ValidateXml - multiple goods
    // ========================================================================

    [Fact]
    public void ValidateXml_MultipleGoodsWithMatchingTotal_ReturnsNoError()
    {
        // Arrange - two goods summing to header total
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <CBAMDeclaration>
                      <DeclarationHeader>
                          <DeclarationId>DECL-001</DeclarationId>
                          <ReportingYear>2024</ReportingYear>
                          <Status>Draft</Status>
                          <TotalEmbeddedEmissions>300.00</TotalEmbeddedEmissions>
                      </DeclarationHeader>
                      <DeclarantInformation><Name>Test</Name></DeclarantInformation>
                      <GoodsImported>
                          <Good>
                              <GoodsCategory>Iron</GoodsCategory>
                              <CNCode>72061000</CNCode>
                              <EmbeddedEmissions>
                                  <TotalEmbeddedEmissions>100.00</TotalEmbeddedEmissions>
                              </EmbeddedEmissions>
                          </Good>
                          <Good>
                              <GoodsCategory>Steel</GoodsCategory>
                              <CNCode>72071100</CNCode>
                              <EmbeddedEmissions>
                                  <TotalEmbeddedEmissions>200.00</TotalEmbeddedEmissions>
                              </EmbeddedEmissions>
                          </Good>
                      </GoodsImported>
                  </CBAMDeclaration>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().BeEmpty();
    }

    [Fact]
    public void ValidateXml_MultipleGoodsWithMismatchedTotal_ReturnsError()
    {
        // Arrange - header says 500 but goods sum to 300
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <CBAMDeclaration>
                      <DeclarationHeader>
                          <DeclarationId>DECL-001</DeclarationId>
                          <ReportingYear>2024</ReportingYear>
                          <Status>Draft</Status>
                          <TotalEmbeddedEmissions>500.00</TotalEmbeddedEmissions>
                      </DeclarationHeader>
                      <DeclarantInformation><Name>Test</Name></DeclarantInformation>
                      <GoodsImported>
                          <Good>
                              <GoodsCategory>Iron</GoodsCategory>
                              <CNCode>72061000</CNCode>
                              <EmbeddedEmissions>
                                  <TotalEmbeddedEmissions>100.00</TotalEmbeddedEmissions>
                              </EmbeddedEmissions>
                          </Good>
                          <Good>
                              <GoodsCategory>Steel</GoodsCategory>
                              <CNCode>72071100</CNCode>
                              <EmbeddedEmissions>
                                  <TotalEmbeddedEmissions>200.00</TotalEmbeddedEmissions>
                              </EmbeddedEmissions>
                          </Good>
                      </GoodsImported>
                  </CBAMDeclaration>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("does not match"));
    }

    // ========================================================================
    // ValidateXml - Good without EmbeddedEmissions section
    // ========================================================================

    [Fact]
    public void ValidateXml_GoodWithoutEmbeddedEmissionsSection_ReturnsError()
    {
        // Arrange
        var xml = """
                  <?xml version="1.0" encoding="UTF-8"?>
                  <CBAMDeclaration>
                      <DeclarationHeader>
                          <DeclarationId>DECL-001</DeclarationId>
                          <ReportingYear>2024</ReportingYear>
                          <Status>Draft</Status>
                      </DeclarationHeader>
                      <DeclarantInformation><Name>Test</Name></DeclarantInformation>
                      <GoodsImported>
                          <Good>
                              <GoodsCategory>Iron</GoodsCategory>
                              <CNCode>72061000</CNCode>
                          </Good>
                      </GoodsImported>
                  </CBAMDeclaration>
                  """;

        // Act
        var errors = _validator.ValidateXml(xml);

        // Assert
        errors.Should().Contain(e => e.Contains("EmbeddedEmissions section is required"));
    }
}
