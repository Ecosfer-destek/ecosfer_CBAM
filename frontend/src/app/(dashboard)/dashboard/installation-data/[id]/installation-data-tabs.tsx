"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatDecimal(val: any): string {
  if (val === null || val === undefined) return "-";
  return Number(val).toLocaleString("tr-TR", { maximumFractionDigits: 6 });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function InstallationDataTabs({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/installation-data">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Listeye Dön
        </Link>
      </Button>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info">A: Tesis Bilgisi</TabsTrigger>
          <TabsTrigger value="emissions">B: Emisyonlar</TabsTrigger>
          <TabsTrigger value="energy">C: Enerji&Denge</TabsTrigger>
          <TabsTrigger value="processes">D: Prosesler</TabsTrigger>
          <TabsTrigger value="precursors">E: Prekürsörler</TabsTrigger>
        </TabsList>

        {/* Tab A: Installation Info */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tesis ve Dönem Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tesis</p>
                <p className="font-medium">{data.installation?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Şirket</p>
                <p className="font-medium">
                  {data.installation?.company?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Başlangıç</p>
                <p className="font-medium">
                  {data.startDate
                    ? new Date(data.startDate).toLocaleDateString("tr-TR")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bitiş</p>
                <p className="font-medium">
                  {data.endDate
                    ? new Date(data.endDate).toLocaleDateString("tr-TR")
                    : "-"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mal Kategorileri ve Rotalar</CardTitle>
                <CardDescription>
                  InstallationGoodsCategoryAndRoute ({data.installationGoodsCategoryAndRoutes?.length || 0} kayıt)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ekle
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mal Kategorisi</TableHead>
                    <TableHead>Rota Tipi</TableHead>
                    <TableHead>Rota 1</TableHead>
                    <TableHead>Rota 2</TableHead>
                    <TableHead>Rota 3</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.installationGoodsCategoryAndRoutes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.installationGoodsCategoryAndRoutes?.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.goodsCategory?.name || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.routeType || "-"}</Badge>
                        </TableCell>
                        <TableCell>{row.route1 || "-"}</TableCell>
                        <TableCell>{row.route2 || "-"}</TableCell>
                        <TableCell>{row.route3 || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab B: Emissions */}
        <TabsContent value="emissions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Emisyon Kayıtları</CardTitle>
                <CardDescription>
                  B_EmInst - Emisyon verileri ({data.emissions?.length || 0} kayıt)
                </CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link
                  href={`/dashboard/emissions/new?installationDataId=${data.id}`}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Emisyon
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kaynak Akışı</TableHead>
                    <TableHead>Emisyon Tipi</TableHead>
                    <TableHead>AD</TableHead>
                    <TableHead>NCV</TableHead>
                    <TableHead>EF</TableHead>
                    <TableHead>CO2e Fosil</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.emissions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                        Emisyon kaydi yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.emissions?.map((em: any) => (
                      <TableRow key={em.id}>
                        <TableCell className="font-medium">
                          {em.sourceStreamName || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {em.emissionType?.code || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDecimal(em.adActivityData)}</TableCell>
                        <TableCell>
                          {formatDecimal(em.ncvNetCalorificValue)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(em.efEmissionFactor)}
                        </TableCell>
                        <TableCell>{formatDecimal(em.co2eFossil)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/emissions/${em.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab C: Energy & Balance */}
        <TabsContent value="energy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Yakit Dengesi (Fuel Balance)</CardTitle>
              <CardDescription>
                {data.fuelBalances?.length || 0} kayit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>Toplam Yakıt Girişi</TableHead>
                    <TableHead>CBAM Malları İçin</TableHead>
                    <TableHead>Elektrik İçin</TableHead>
                    <TableHead>Non-CBAM İçin</TableHead>
                    <TableHead>Kalan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.fuelBalances?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.fuelBalances?.map((fb: any) => (
                      <TableRow key={fb.id}>
                        <TableCell>{fb.name || "-"}</TableCell>
                        <TableCell>{formatDecimal(fb.totalFuelInput)}</TableCell>
                        <TableCell>
                          {formatDecimal(fb.directFuelForCbamGoods)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(fb.fuelForElectricity)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(fb.directFuelForNonCbamGoods)}
                        </TableCell>
                        <TableCell>{formatDecimal(fb.rest)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GHG Dengesi (Tipe Göre)</CardTitle>
              <CardDescription>
                {data.ghgBalanceByTypes?.length || 0} kayit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İsim</TableHead>
                    <TableHead>CO2</TableHead>
                    <TableHead>Biyokitle</TableHead>
                    <TableHead>N2O</TableHead>
                    <TableHead>PFC</TableHead>
                    <TableHead>Doğrudan</TableHead>
                    <TableHead>Dolaylı</TableHead>
                    <TableHead>Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ghgBalanceByTypes?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.ghgBalanceByTypes?.map((gb: any) => (
                      <TableRow key={gb.id}>
                        <TableCell>{gb.name || "-"}</TableCell>
                        <TableCell>
                          {formatDecimal(gb.totalCo2Emissions)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(gb.biomassEmissions)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(gb.totalN2oEmissions)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(gb.totalPfcEmissions)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(gb.totalDirectEmissions)}
                        </TableCell>
                        <TableCell>
                          {formatDecimal(gb.totalIndirectEmissions)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDecimal(gb.totalEmissions)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab D: Processes */}
        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>İlgili Üretim Süreçleri</CardTitle>
                <CardDescription>
                  RelevantProductionProcess ({data.relevantProductionProcesses?.length || 0} kayıt)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ekle
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mal Kategorisi</TableHead>
                    <TableHead>Üretim Süreci 1</TableHead>
                    <TableHead>Üretim Süreci 2</TableHead>
                    <TableHead>Üretim Süreci 3</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.relevantProductionProcesses?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.relevantProductionProcesses?.map((rpp: any) => (
                      <TableRow key={rpp.id}>
                        <TableCell>
                          {rpp.goodsCategory?.name || "-"}
                        </TableCell>
                        <TableCell>{rpp.productionProcess1 || "-"}</TableCell>
                        <TableCell>{rpp.productionProcess2 || "-"}</TableCell>
                        <TableCell>{rpp.productionProcess3 || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab E: Precursors */}
        <TabsContent value="precursors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Satın Alınan Prekürsörler</CardTitle>
                <CardDescription>
                  PurchasedPrecursor ({data.purchasedPrecursors?.length || 0} kayıt)
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Ekle
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mal Kategorisi</TableHead>
                    <TableHead>Ülke</TableHead>
                    <TableHead>Rota 1</TableHead>
                    <TableHead>Rota 2</TableHead>
                    <TableHead>Rota 3</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.purchasedPrecursors?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                        Kayıt yok
                      </TableCell>
                    </TableRow>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    data.purchasedPrecursors?.map((pp: any) => (
                      <TableRow key={pp.id}>
                        <TableCell>
                          {pp.goodsCategory?.name || "-"}
                        </TableCell>
                        <TableCell>{pp.country?.name || "-"}</TableCell>
                        <TableCell>{pp.route1 || "-"}</TableCell>
                        <TableCell>{pp.route2 || "-"}</TableCell>
                        <TableCell>{pp.route3 || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Need to import Eye for emissions table
import { Eye } from "lucide-react";
