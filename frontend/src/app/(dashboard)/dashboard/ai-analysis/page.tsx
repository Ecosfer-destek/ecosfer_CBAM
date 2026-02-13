"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { getInstallations } from "@/actions/installation";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyData = any;

export default function AiAnalysisPage() {
  const [installations, setInstallations] = useState<AnyData[]>([]);
  const [selectedInstId, setSelectedInstId] = useState("");
  const [activeTab, setActiveTab] = useState("forecast");

  // Forecast state
  const [forecastData, setForecastData] = useState<AnyData>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastPeriods, setForecastPeriods] = useState("6");

  // Anomaly state
  const [anomalyData, setAnomalyData] = useState<AnyData>(null);
  const [anomalyLoading, setAnomalyLoading] = useState(false);

  // Narrative state
  const [narrativeData, setNarrativeData] = useState<AnyData>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeLang, setNarrativeLang] = useState("tr");
  const [narrativeType, setNarrativeType] = useState("summary");

  useEffect(() => {
    getInstallations().then(setInstallations);
  }, []);

  async function handleForecast() {
    if (!selectedInstId) {
      toast.error("Tesis seçiniz");
      return;
    }
    setForecastLoading(true);
    try {
      const res = await fetch("/api/ai/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installation_id: selectedInstId,
          periods: parseInt(forecastPeriods),
        }),
      });
      const data = await res.json();
      setForecastData(data);
      if (data.status === "success") {
        toast.success("Tahmin oluşturuldu");
      } else {
        toast.info(data.message);
      }
    } catch {
      toast.error("Tahmin servisi ile bağlantı kurulamadı");
    }
    setForecastLoading(false);
  }

  async function handleAnomalies() {
    if (!selectedInstId) {
      toast.error("Tesis seçiniz");
      return;
    }
    setAnomalyLoading(true);
    try {
      const res = await fetch("/api/ai/anomalies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installation_id: selectedInstId,
          threshold: 0.05,
        }),
      });
      const data = await res.json();
      setAnomalyData(data);
      if (data.status === "success") {
        toast.success(`${data.anomalies?.length || 0} anomali tespit edildi`);
      } else {
        toast.info(data.message);
      }
    } catch {
      toast.error("Anomali servisi ile bağlantı kurulamadı");
    }
    setAnomalyLoading(false);
  }

  async function handleNarrative() {
    if (!selectedInstId) {
      toast.error("Tesis seçiniz");
      return;
    }
    setNarrativeLoading(true);
    try {
      const res = await fetch("/api/ai/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installation_id: selectedInstId,
          report_type: narrativeType,
          language: narrativeLang,
        }),
      });
      const data = await res.json();
      setNarrativeData(data);
      if (data.status === "success") {
        toast.success("Rapor oluşturuldu");
      } else {
        toast.info(data.message);
      }
    } catch {
      toast.error("Rapor servisi ile bağlantı kurulamadı");
    }
    setNarrativeLoading(false);
  }

  // Prepare chart data
  function getChartData() {
    if (!forecastData) return [];
    const historical = (forecastData.historical || []).map(
      (h: { year: number; emissions: number }) => ({
        year: h.year,
        actual: h.emissions,
      })
    );
    const forecast = (forecastData.forecast || []).map(
      (f: {
        year: number;
        predicted: number;
        lower_bound: number;
        upper_bound: number;
      }) => ({
        year: f.year,
        predicted: f.predicted,
        lower: f.lower_bound,
        upper: f.upper_bound,
      })
    );
    // Bridge: last historical point also appears in forecast
    if (historical.length > 0 && forecast.length > 0) {
      const last = historical[historical.length - 1];
      forecast[0] = { ...forecast[0], actual: last.actual };
    }
    return [...historical, ...forecast];
  }

  const SEVERITY_BADGES: Record<
    string,
    "destructive" | "default" | "secondary" | "outline"
  > = {
    critical: "destructive",
    warning: "default",
    info: "secondary",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Analiz</h1>
        <p className="text-muted-foreground">
          Yapay zeka destekli emisyon analizi ve tahminler
        </p>
      </div>

      {/* Installation Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Tesis Seçin</Label>
              <Select
                value={selectedInstId}
                onValueChange={setSelectedInstId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Analiz için tesis seçin" />
                </SelectTrigger>
                <SelectContent>
                  {installations.map((inst: AnyData) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="forecast" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Tahmin
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Anomali
          </TabsTrigger>
          <TabsTrigger value="narrative" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Rapor
          </TabsTrigger>
        </TabsList>

        {/* ==================== FORECAST TAB ==================== */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Emisyon Tahmini
              </CardTitle>
              <CardDescription>
                Geçmiş verilere dayalı emisyon trendi tahmini (XGBoost /
                Linear Regression)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Tahmin Dönemi (yıl)</Label>
                  <Select
                    value={forecastPeriods}
                    onValueChange={setForecastPeriods}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Yıl</SelectItem>
                      <SelectItem value="6">6 Yıl</SelectItem>
                      <SelectItem value="12">12 Yıl</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleForecast}
                  disabled={forecastLoading || !selectedInstId}
                >
                  {forecastLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Tahmin Oluştur
                </Button>
              </div>

              {forecastData?.status === "success" && (
                <div className="space-y-4">
                  {/* Trend Info */}
                  {forecastData.trend && (
                    <div className="flex gap-4">
                      <Badge
                        variant={
                          forecastData.trend.direction === "increasing"
                            ? "destructive"
                            : forecastData.trend.direction === "decreasing"
                              ? "default"
                              : "secondary"
                        }
                        className="text-sm"
                      >
                        Trend:{" "}
                        {forecastData.trend.direction === "increasing"
                          ? "Artış"
                          : forecastData.trend.direction === "decreasing"
                            ? "Azalış"
                            : "Sabit"}{" "}
                        (%{forecastData.trend.change_pct})
                      </Badge>
                      {forecastData.model && (
                        <Badge variant="outline" className="text-sm">
                          Model: {forecastData.model}
                        </Badge>
                      )}
                      {forecastData.r2_score != null && (
                        <Badge variant="outline" className="text-sm">
                          R2: {forecastData.r2_score.toFixed(3)}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Chart */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `${Number(value).toFixed(4)} tCO2e`,
                          ]}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="upper"
                          stroke="none"
                          fill="#e0e7ff"
                          name="Üst Sınır"
                        />
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="none"
                          fill="#ffffff"
                          name="Alt Sınır"
                        />
                        <Line
                          type="monotone"
                          dataKey="actual"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Gerçek"
                        />
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          stroke="#dc2626"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          name="Tahmin"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {forecastData && forecastData.status !== "success" && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{forecastData.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ANOMALY TAB ==================== */}
        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomali Tespiti
              </CardTitle>
              <CardDescription>
                IsolationForest ile veri anomalileri ve kalite kontrolu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Button
                  onClick={handleAnomalies}
                  disabled={anomalyLoading || !selectedInstId}
                >
                  {anomalyLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Anomali Tara
                </Button>

                {anomalyData?.summary && (
                  <div className="flex gap-2">
                    <Badge variant="destructive">
                      Kritik: {anomalyData.summary.critical}
                    </Badge>
                    <Badge variant="default">
                      Uyari: {anomalyData.summary.warning}
                    </Badge>
                    <Badge variant="secondary">
                      Bilgi: {anomalyData.summary.info}
                    </Badge>
                    <Badge variant="outline">
                      Veri Kalitesi: %
                      {anomalyData.summary.data_quality_score}
                    </Badge>
                  </div>
                )}
              </div>

              {anomalyData?.anomalies?.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ciddiyet</TableHead>
                      <TableHead>Tip</TableHead>
                      <TableHead>Yil</TableHead>
                      <TableHead>Kaynak</TableHead>
                      <TableHead className="max-w-xs">
                        Açıklama
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalyData.anomalies.map(
                      (a: AnyData, i: number) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge
                              variant={
                                SEVERITY_BADGES[a.severity] || "secondary"
                              }
                            >
                              {a.severity === "critical"
                                ? "Kritik"
                                : a.severity === "warning"
                                  ? "Uyarı"
                                  : "Bilgi"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {a.type === "emission_outlier"
                              ? "Emisyon Aykırı Değeri"
                              : a.type === "balance_mismatch"
                                ? "Denge Uyumsuzluğu"
                                : a.type === "negative_value"
                                  ? "Negatif Değer"
                                  : a.type === "sudden_change"
                                    ? "Ani Değişim"
                                    : a.type}
                          </TableCell>
                          <TableCell>{a.year || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {a.source}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs truncate">
                            {a.description}
                          </TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              )}

              {anomalyData &&
                anomalyData.anomalies?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Anomali tespit edilmedi. Veriler tutarlı görünüyor.</p>
                  </div>
                )}

              {anomalyData && anomalyData.status !== "success" && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{anomalyData.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== NARRATIVE TAB ==================== */}
        <TabsContent value="narrative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Akıllı Raporlama
              </CardTitle>
              <CardDescription>
                LangChain + Claude/GPT-4 ile doğal dil analiz raporu üretimi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Rapor Tipi</Label>
                  <Select
                    value={narrativeType}
                    onValueChange={setNarrativeType}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Özet</SelectItem>
                      <SelectItem value="detailed">Detaylı</SelectItem>
                      <SelectItem value="executive">Yönetici</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dil</Label>
                  <Select
                    value={narrativeLang}
                    onValueChange={setNarrativeLang}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Türkçe</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleNarrative}
                  disabled={narrativeLoading || !selectedInstId}
                >
                  {narrativeLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  Rapor Oluştur
                </Button>
              </div>

              {narrativeData?.status === "success" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Model: {narrativeData.model || "N/A"}
                    </Badge>
                    <Badge variant="outline">
                      Dil:{" "}
                      {narrativeData.language === "tr"
                        ? "Türkçe"
                        : narrativeData.language === "en"
                          ? "English"
                          : "Deutsch"}
                    </Badge>
                  </div>
                  <div className="bg-muted/50 border rounded-lg p-4 prose prose-sm max-w-none dark:prose-invert">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: narrativeData.narrative
                          .replace(/\n/g, "<br />")
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            "<strong>$1</strong>"
                          )
                          .replace(
                            /^# (.*?)(<br \/>)/gm,
                            "<h2>$1</h2>"
                          )
                          .replace(
                            /^## (.*?)(<br \/>)/gm,
                            "<h3>$1</h3>"
                          )
                          .replace(
                            /^- (.*?)(<br \/>)/gm,
                            "<li>$1</li>"
                          ),
                      }}
                    />
                  </div>
                </div>
              )}

              {narrativeData && narrativeData.status !== "success" && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>{narrativeData.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
