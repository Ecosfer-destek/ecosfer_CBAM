namespace EcosferServices.Models;

public class ImportResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public string InstallationDataId { get; set; } = "";
    public SheetResult SheetA { get; set; } = new();
    public SheetResult SheetB { get; set; } = new();
    public SheetResult SheetC { get; set; } = new();
    public SheetResult SheetD { get; set; } = new();
    public SheetResult SheetE { get; set; } = new();
}

public class SheetResult
{
    public bool Imported { get; set; }
    public int RecordsCreated { get; set; }
    public int RecordsUpdated { get; set; }
    public List<string> Warnings { get; set; } = [];
    public List<string> Errors { get; set; } = [];
}
