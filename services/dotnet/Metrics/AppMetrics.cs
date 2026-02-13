using Prometheus;

namespace EcosferServices.Metrics;

public static class AppMetrics
{
    // Excel Import metrics
    public static readonly Counter ExcelImportTotal = Prometheus.Metrics
        .CreateCounter("excel_import_total", "Total Excel import attempts", new CounterConfiguration
        {
            LabelNames = new[] { "status" }
        });

    public static readonly Counter ExcelImportFailures = Prometheus.Metrics
        .CreateCounter("excel_import_failures_total", "Total Excel import failures");

    public static readonly Histogram ExcelImportDuration = Prometheus.Metrics
        .CreateHistogram("excel_import_duration_seconds", "Excel import duration in seconds",
            new HistogramConfiguration
            {
                Buckets = Histogram.LinearBuckets(1, 2, 10) // 1s, 3s, 5s, ..., 19s
            });

    public static readonly Counter ExcelSheetsProcessed = Prometheus.Metrics
        .CreateCounter("excel_sheets_processed_total", "Total sheets processed", new CounterConfiguration
        {
            LabelNames = new[] { "sheet", "status" }
        });

    // XML Generation metrics
    public static readonly Counter XmlGenerationTotal = Prometheus.Metrics
        .CreateCounter("xml_generation_total", "Total XML generation attempts", new CounterConfiguration
        {
            LabelNames = new[] { "status" }
        });

    public static readonly Histogram XmlGenerationDuration = Prometheus.Metrics
        .CreateHistogram("xml_generation_duration_seconds", "XML generation duration");

    // PDF Report metrics
    public static readonly Counter PdfReportTotal = Prometheus.Metrics
        .CreateCounter("pdf_report_total", "Total PDF report generations", new CounterConfiguration
        {
            LabelNames = new[] { "report_type", "status" }
        });

    public static readonly Histogram PdfReportDuration = Prometheus.Metrics
        .CreateHistogram("pdf_report_duration_seconds", "PDF report generation duration",
            new HistogramConfiguration
            {
                LabelNames = new[] { "report_type" }
            });

    // Active connections gauge
    public static readonly Gauge ActiveRequests = Prometheus.Metrics
        .CreateGauge("dotnet_active_requests", "Number of active requests");

    public static readonly Gauge DbConnectionsActive = Prometheus.Metrics
        .CreateGauge("dotnet_db_connections_active", "Active database connections");

    public static readonly Gauge DbConnectionsMax = Prometheus.Metrics
        .CreateGauge("dotnet_db_connections_max", "Maximum database connections");
}
