using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace EcosferServices.Tests;

/// <summary>
/// Integration tests for Program.cs minimal API endpoints.
/// Uses WebApplicationFactory to spin up an in-memory test server.
/// Focuses on endpoint registration, routing, and basic validation
/// without requiring real database connections.
/// </summary>
public class ProgramEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProgramEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // The services that need connection strings will fail at construction,
                // but health and preview endpoints do not use them.
            });
        }).CreateClient();
    }

    // ========================================================================
    // Health endpoint
    // ========================================================================

    [Fact]
    public async Task HealthEndpoint_ReturnsHealthyStatus()
    {
        // Act
        var response = await _client.GetAsync("/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        var root = json.RootElement;

        root.GetProperty("status").GetString().Should().Be("healthy");
        root.GetProperty("service").GetString().Should().Be("ecosfer-dotnet");
        root.TryGetProperty("timestamp", out _).Should().BeTrue();
    }

    // ========================================================================
    // Excel Import endpoint validation
    // ========================================================================

    [Fact]
    public async Task ExcelImport_WithoutFile_ReturnsBadRequest()
    {
        // Arrange - Send multipart without a file
        var form = new MultipartFormDataContent
        {
            { new StringContent("inst-123"), "installationDataId" },
            { new StringContent("tenant-1"), "tenantId" }
        };

        // Act
        var response = await _client.PostAsync("/api/v1/excel/import", form);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ExcelExport_ReturnsOk()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/excel/export/test-install-id");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        var root = json.RootElement;

        root.GetProperty("installationDataId").GetString().Should().Be("test-install-id");
        root.GetProperty("message").GetString().Should().Contain("Excel export endpoint ready");
    }

    // ========================================================================
    // PDF Preview endpoint
    // ========================================================================

    [Theory]
    [InlineData("installation-summary", "Tesis")]
    [InlineData("declaration", "CBAM")]
    [InlineData("emission-detail", "Emisyon")]
    [InlineData("supplier-survey", "Tedarik")]
    [InlineData("custom", "Rapor")]
    public async Task PdfPreview_ValidReportType_ReturnsDescription(string reportType, string expectedDescriptionPart)
    {
        // Act
        var response = await _client.GetAsync($"/api/v1/reports/pdf/preview/{reportType}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        var root = json.RootElement;

        root.GetProperty("reportType").GetString().Should().Be(reportType);
        root.GetProperty("description").GetString().Should().Contain(expectedDescriptionPart);
        root.GetProperty("availableLanguages").GetArrayLength().Should().Be(3);
    }

    [Fact]
    public async Task PdfPreview_InvalidReportType_ReturnsBadRequest()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/reports/pdf/preview/nonexistent-type");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        json.RootElement.GetProperty("error").GetString().Should().Contain("Invalid report type");
    }

    [Fact]
    public async Task PdfPreview_ReturnsAllLanguages()
    {
        // Act
        var response = await _client.GetAsync("/api/v1/reports/pdf/preview/declaration");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(content);
        var languages = json.RootElement.GetProperty("availableLanguages");

        var langList = new List<string>();
        foreach (var lang in languages.EnumerateArray())
        {
            langList.Add(lang.GetString()!);
        }

        langList.Should().Contain("tr");
        langList.Should().Contain("en");
        langList.Should().Contain("de");
    }

    // ========================================================================
    // XML Generate endpoint validation
    // ========================================================================

    [Fact]
    public async Task XmlGenerate_WithoutTenantHeader_ReturnsBadRequest()
    {
        // Arrange - POST without X-Tenant-Id header
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/xml/generate/decl-123");
        request.Content = new StringContent("", System.Text.Encoding.UTF8, "application/json");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task XmlDownload_WithoutTenantHeader_ReturnsBadRequest()
    {
        // Arrange - GET without X-Tenant-Id header
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/xml/download/decl-123");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
