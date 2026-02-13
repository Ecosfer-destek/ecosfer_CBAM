using EcosferServices.Models;
using FluentAssertions;

namespace EcosferServices.Tests;

/// <summary>
/// Unit tests for ImportResult and SheetResult POCO models.
/// Verifies default values and property behavior.
/// </summary>
public class ImportResultTests
{
    // ========================================================================
    // ImportResult defaults
    // ========================================================================

    [Fact]
    public void ImportResult_DefaultValues_AreCorrect()
    {
        // Act
        var result = new ImportResult();

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().BeNull();
        result.InstallationDataId.Should().BeEmpty();
    }

    [Fact]
    public void ImportResult_SheetResults_AreInitializedByDefault()
    {
        // Act
        var result = new ImportResult();

        // Assert
        result.SheetA.Should().NotBeNull();
        result.SheetB.Should().NotBeNull();
        result.SheetC.Should().NotBeNull();
        result.SheetD.Should().NotBeNull();
        result.SheetE.Should().NotBeNull();
    }

    [Fact]
    public void ImportResult_CanSetSuccess()
    {
        // Arrange & Act
        var result = new ImportResult { Success = true };

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public void ImportResult_CanSetError()
    {
        // Arrange & Act
        var result = new ImportResult { Error = "Something went wrong" };

        // Assert
        result.Error.Should().Be("Something went wrong");
    }

    [Fact]
    public void ImportResult_CanSetInstallationDataId()
    {
        // Arrange & Act
        var result = new ImportResult { InstallationDataId = "inst-123" };

        // Assert
        result.InstallationDataId.Should().Be("inst-123");
    }

    // ========================================================================
    // SheetResult defaults
    // ========================================================================

    [Fact]
    public void SheetResult_DefaultValues_AreCorrect()
    {
        // Act
        var sheet = new SheetResult();

        // Assert
        sheet.Imported.Should().BeFalse();
        sheet.RecordsCreated.Should().Be(0);
        sheet.RecordsUpdated.Should().Be(0);
    }

    [Fact]
    public void SheetResult_Warnings_DefaultsToEmptyList()
    {
        // Act
        var sheet = new SheetResult();

        // Assert
        sheet.Warnings.Should().NotBeNull();
        sheet.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void SheetResult_Errors_DefaultsToEmptyList()
    {
        // Act
        var sheet = new SheetResult();

        // Assert
        sheet.Errors.Should().NotBeNull();
        sheet.Errors.Should().BeEmpty();
    }

    [Fact]
    public void SheetResult_CanAddWarnings()
    {
        // Arrange
        var sheet = new SheetResult();

        // Act
        sheet.Warnings.Add("Missing optional field");
        sheet.Warnings.Add("Value out of expected range");

        // Assert
        sheet.Warnings.Should().HaveCount(2);
        sheet.Warnings.Should().Contain("Missing optional field");
        sheet.Warnings.Should().Contain("Value out of expected range");
    }

    [Fact]
    public void SheetResult_CanAddErrors()
    {
        // Arrange
        var sheet = new SheetResult();

        // Act
        sheet.Errors.Add("Required field missing");

        // Assert
        sheet.Errors.Should().HaveCount(1);
        sheet.Errors.Should().Contain("Required field missing");
    }

    [Fact]
    public void SheetResult_CanSetRecordCounts()
    {
        // Arrange & Act
        var sheet = new SheetResult
        {
            Imported = true,
            RecordsCreated = 10,
            RecordsUpdated = 5
        };

        // Assert
        sheet.Imported.Should().BeTrue();
        sheet.RecordsCreated.Should().Be(10);
        sheet.RecordsUpdated.Should().Be(5);
    }

    // ========================================================================
    // XmlGenerationResult defaults
    // ========================================================================

    [Fact]
    public void XmlGenerationResult_DefaultValues_AreCorrect()
    {
        // Act
        var result = new XmlGenerationResult();

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().BeNull();
        result.XmlContent.Should().BeNull();
        result.Sha256Hash.Should().BeNull();
        result.ValidationErrors.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
        result.DeclarationId.Should().BeEmpty();
        result.GeneratedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ========================================================================
    // PdfGenerationResult defaults
    // ========================================================================

    [Fact]
    public void PdfGenerationResult_DefaultValues_AreCorrect()
    {
        // Act
        var result = new PdfGenerationResult();

        // Assert
        result.Success.Should().BeFalse();
        result.Error.Should().BeNull();
        result.PdfContent.Should().BeNull();
        result.FileName.Should().BeEmpty();
        result.GeneratedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ========================================================================
    // PdfReportRequest defaults
    // ========================================================================

    [Fact]
    public void PdfReportRequest_DefaultValues_AreCorrect()
    {
        // Act
        var request = new PdfReportRequest();

        // Assert
        request.InstallationDataId.Should().BeEmpty();
        request.TenantId.Should().BeEmpty();
        request.Language.Should().Be("tr");
    }

    [Fact]
    public void PdfReportRequest_LanguageDefaultIsTurkish()
    {
        // Act
        var request = new PdfReportRequest();

        // Assert - Default language should be Turkish (tr) as per the CBAM panel's primary audience
        request.Language.Should().Be("tr");
    }
}
