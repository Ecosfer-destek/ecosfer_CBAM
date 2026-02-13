using EcosferServices.Helpers;
using EcosferServices.Tests.Helpers;
using FluentAssertions;

namespace EcosferServices.Tests;

/// <summary>
/// Unit tests for ExcelHelper static methods.
/// Uses real EPPlus ExcelRange objects via ExcelTestHelper since
/// ExcelRange is sealed and cannot be mocked.
/// </summary>
public class ExcelHelperTests
{
    // ========================================================================
    // SafeParseDecimal
    // ========================================================================

    [Fact]
    public void SafeParseDecimal_NullCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateNullCell();

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseDecimal_EmptyCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateEmptyCell();

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseDecimal_ValidDecimalString_ReturnsDecimal()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("123.45");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(123.45m);
    }

    [Fact]
    public void SafeParseDecimal_ValidNumericValue_ReturnsDecimal()
    {
        // Arrange - EPPlus can store actual numeric values
        var cell = ExcelTestHelper.CreateCell(99.99);

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(99.99m);
    }

    [Fact]
    public void SafeParseDecimal_InvalidText_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("abc");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseDecimal_WhitespaceOnly_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateWhitespaceCell();

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseDecimal_NegativeValue_ReturnsNegativeDecimal()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("-42.7");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(-42.7m);
    }

    [Fact]
    public void SafeParseDecimal_LargeNumber_ReturnsDecimal()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("1234567890.123456");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(1234567890.123456m);
    }

    [Fact]
    public void SafeParseDecimal_Zero_ReturnsZero()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("0");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void SafeParseDecimal_ValueWithSurroundingWhitespace_ReturnsTrimmedResult()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("  456.78  ");

        // Act
        var result = ExcelHelper.SafeParseDecimal(cell);

        // Assert
        result.Should().Be(456.78m);
    }

    // ========================================================================
    // ForceParseDecimal
    // ========================================================================

    [Fact]
    public void ForceParseDecimal_NullCell_ReturnsZero()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateNullCell();

        // Act
        var result = ExcelHelper.ForceParseDecimal(cell);

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void ForceParseDecimal_ValidDecimal_ReturnsValue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("789.01");

        // Act
        var result = ExcelHelper.ForceParseDecimal(cell);

        // Assert
        result.Should().Be(789.01m);
    }

    [Fact]
    public void ForceParseDecimal_InvalidText_ReturnsZero()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("not-a-number");

        // Act
        var result = ExcelHelper.ForceParseDecimal(cell);

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void ForceParseDecimal_EmptyCell_ReturnsZero()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateEmptyCell();

        // Act
        var result = ExcelHelper.ForceParseDecimal(cell);

        // Assert
        result.Should().Be(0m);
    }

    [Fact]
    public void ForceParseDecimal_NegativeValue_ReturnsNegative()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("-100.5");

        // Act
        var result = ExcelHelper.ForceParseDecimal(cell);

        // Assert
        result.Should().Be(-100.5m);
    }

    // ========================================================================
    // SafeGetText
    // ========================================================================

    [Fact]
    public void SafeGetText_NullCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateNullCell();

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeGetText_EmptyText_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateEmptyCell();

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeGetText_ValidText_ReturnsText()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("Hello World");

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().Be("Hello World");
    }

    [Fact]
    public void SafeGetText_WhitespaceOnly_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateWhitespaceCell();

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeGetText_TextWithSurroundingWhitespace_ReturnsTrimmedText()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("  trimmed  ");

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().Be("trimmed");
    }

    [Fact]
    public void SafeGetText_NumericValue_ReturnsStringRepresentation()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell(42);

        // Act
        var result = ExcelHelper.SafeGetText(cell);

        // Assert
        result.Should().Be("42");
    }

    // ========================================================================
    // IsEmpty
    // ========================================================================

    [Fact]
    public void IsEmpty_NullCell_ReturnsTrue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateNullCell();

        // Act
        var result = ExcelHelper.IsEmpty(cell);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEmpty_EmptyCell_ReturnsTrue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateEmptyCell();

        // Act
        var result = ExcelHelper.IsEmpty(cell);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEmpty_WhitespaceCell_ReturnsTrue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateWhitespaceCell();

        // Act
        var result = ExcelHelper.IsEmpty(cell);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsEmpty_CellWithValue_ReturnsFalse()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("some value");

        // Act
        var result = ExcelHelper.IsEmpty(cell);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsEmpty_CellWithNumericValue_ReturnsFalse()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell(0);

        // Act
        var result = ExcelHelper.IsEmpty(cell);

        // Assert
        result.Should().BeFalse();
    }

    // ========================================================================
    // SafeParseBool
    // ========================================================================

    [Fact]
    public void SafeParseBool_TrueString_ReturnsTrue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("True");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void SafeParseBool_FalseString_ReturnsFalse()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("False");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void SafeParseBool_NullCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateNullCell();

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseBool_InvalidText_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("abc");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseBool_CaseInsensitiveTrue_ReturnsTrue()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("TRUE");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void SafeParseBool_CaseInsensitiveFalse_ReturnsFalse()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateCell("false");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void SafeParseBool_EmptyCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateEmptyCell();

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseBool_WhitespaceCell_ReturnsNull()
    {
        // Arrange
        var cell = ExcelTestHelper.CreateWhitespaceCell();

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void SafeParseBool_NumericOne_ReturnsNull()
    {
        // "1" is not "True" or "False", so should return null
        // Arrange
        var cell = ExcelTestHelper.CreateCell("1");

        // Act
        var result = ExcelHelper.SafeParseBool(cell);

        // Assert
        result.Should().BeNull();
    }
}
