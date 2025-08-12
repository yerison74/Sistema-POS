"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SalesManager, type Sale, type DailySales } from "@/lib/sales"
import { InventoryManager, type Product } from "@/lib/inventory"
import { printReceipt } from "@/components/receipt-printer"
import { TrendingUp, DollarSign, ShoppingCart, CreditCard, Banknote, Download, RefreshCw, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SettingsManager } from "@/lib/settings"

interface ProductSalesStats {
  product: Product
  totalQuantity: number
  totalRevenue: number
  salesCount: number
}

interface MonthlyStats {
  month: string
  total: number
  count: number
  average: number
}

interface WeeklySales {
  week: string
  sales: Sale[]
  total: number
  count: number
  cash: number
  card: number
}

interface WeeklyStats {
  week: string
  total: number
  count: number
  average: number
}

export default function ReportsDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  // Added weekly date selector with default to current week start
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    return startOfWeek.toISOString().split("T")[0]
  })
  const [dailySales, setDailySales] = useState<DailySales | null>(null)
  const [monthlySales, setMonthlySales] = useState<Sale[]>([])
  const [topProducts, setTopProducts] = useState<ProductSalesStats[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([])
  // Added weekly sales state variables
  const [weeklySales, setWeeklySales] = useState<WeeklySales | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()
  const salesManager = SalesManager.getInstance()
  const inventoryManager = InventoryManager.getInstance()
  const settingsManager = SettingsManager.getInstance()

  useEffect(() => {
    loadReports()
  }, [selectedDate, selectedMonth, selectedWeek])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      // Load daily sales
      const daily = salesManager.getDailySales(selectedDate)
      setDailySales(daily)

      // Load monthly sales
      const allSales = salesManager.getAllSales()
      const monthlyFilter = allSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        const saleMonth = saleDate.toISOString().slice(0, 7)
        return saleMonth === selectedMonth
      })
      setMonthlySales(monthlyFilter)

      // Calculate top products
      const productStats = calculateTopProducts(monthlyFilter)
      setTopProducts(productStats)

      // Calculate monthly statistics
      const monthStats = calculateMonthlyStats(allSales)
      setMonthlyStats(monthStats)

      // Added weekly sales calculation
      // Load weekly sales data
      const weekStart = new Date(selectedWeek)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      const weeklySalesFilter = allSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        return saleDate >= weekStart && saleDate <= weekEnd
      })

      const weeklyTotal = weeklySalesFilter.reduce((sum, sale) => sum + sale.total, 0)
      const weeklyCash = weeklySalesFilter
        .filter((s) => s.paymentMethod === "cash")
        .reduce((sum, sale) => sum + sale.total, 0)
      const weeklyCard = weeklySalesFilter
        .filter((s) => s.paymentMethod === "card")
        .reduce((sum, sale) => sum + sale.total, 0)

      setWeeklySales({
        week: `${weekStart.toLocaleDateString("es-DO")} - ${weekEnd.toLocaleDateString("es-DO")}`,
        sales: weeklySalesFilter,
        total: weeklyTotal,
        count: weeklySalesFilter.length,
        cash: weeklyCash,
        card: weeklyCard,
      })

      // Calculate weekly stats for the last 8 weeks
      const weeklyStatsData = calculateWeeklyStats(allSales)
      setWeeklyStats(weeklyStatsData)
    } catch (error) {
      console.error("Error loading reports:", error)
      toast({
        title: "Error al cargar los reportes",
        description: "Hubo un problema al cargar la información.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTopProducts = (sales: Sale[]): ProductSalesStats[] => {
    const productMap = new Map<string, ProductSalesStats>()

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productMap.get(item.productId)
        if (existing) {
          existing.totalQuantity += item.quantity
          existing.totalRevenue += item.subtotal
          existing.salesCount += 1
        } else {
          productMap.set(item.productId, {
            product: item.product,
            totalQuantity: item.quantity,
            totalRevenue: item.subtotal,
            salesCount: 1,
          })
        }
      }
    }

    return Array.from(productMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
  }

  const calculateMonthlyStats = (sales: Sale[]) => {
    const stats: { [key: string]: { total: number; count: number } } = {}

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp)
      const monthKey = saleDate.toISOString().slice(0, 7)

      if (!stats[monthKey]) {
        stats[monthKey] = { total: 0, count: 0 }
      }
      stats[monthKey].total += sale.total
      stats[monthKey].count += 1
    })

    return Object.entries(stats)
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
        average: data.total / data.count,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6)
  }

  // Added weekly stats calculation function
  const calculateWeeklyStats = (sales: Sale[]) => {
    const stats: { [key: string]: { total: number; count: number } } = {}

    sales.forEach((sale) => {
      const saleDate = new Date(sale.timestamp)
      const weekStart = new Date(saleDate)
      weekStart.setDate(saleDate.getDate() - saleDate.getDay())
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!stats[weekKey]) {
        stats[weekKey] = { total: 0, count: 0 }
      }
      stats[weekKey].total += sale.total
      stats[weekKey].count += 1
    })

    return Object.entries(stats)
      .map(([week, data]) => {
        const weekStart = new Date(week)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return {
          week: `${weekStart.toLocaleDateString("es-DO")} - ${weekEnd.toLocaleDateString("es-DO")}`,
          total: data.total,
          count: data.count,
          average: data.total / data.count,
        }
      })
      .sort((a, b) => new Date(b.week.split(" - ")[0]).getTime() - new Date(a.week.split(" - ")[0]).getTime())
      .slice(0, 8)
  }

  const exportDailyReport = () => {
    if (!dailySales) return

    const csvContent = [
      "Reporte Diario - " + selectedDate,
      "",
      "Resumen",
      `Total de Ventas,${dailySales.totalSales}`,
      `Ingresos Totales,${SalesManager.formatCurrency(dailySales.totalAmount)}`,
      `Ventas en Efectivo,${SalesManager.formatCurrency(dailySales.cashSales)}`,
      `Ventas con Tarjeta,${SalesManager.formatCurrency(dailySales.cardSales)}`,
      "",
      "Detalle de Ventas",
      "ID,Hora,Total,Método de Pago,Cajero",
      ...dailySales.sales.map((sale) =>
        [
          sale.id,
          SalesManager.formatTime(sale.timestamp),
          SalesManager.formatCurrency(sale.total),
          sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta",
          sale.cashierName,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-diario-${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte exportado",
      description: "El reporte diario se ha descargado correctamente",
    })
  }

  const handleReprintReceipt = (sale: Sale) => {
    try {
      const businessSettings = settingsManager.getBusinessSettings()
      const businessInfo = {
        name: businessSettings.name,
        address: businessSettings.address,
        phone: businessSettings.phone,
        rfc: businessSettings.rfc,
      }
      printReceipt(sale, businessInfo)
      toast({
        title: "Ticket reenviado",
        description: `Ticket #${sale.id} enviado a impresión`,
      })
    } catch (error) {
      toast({
        title: "Error de impresión",
        description: "No se pudo imprimir el ticket",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reportes de Ventas</h2>
        <Button onClick={loadReports} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Added weekly tab to the tabs list */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={exportDailyReport} disabled={!dailySales || dailySales.totalSales === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {dailySales && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dailySales.totalSales}</div>
                    <p className="text-xs text-muted-foreground">transacciones</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(dailySales.totalAmount)}</div>
                    <p className="text-xs text-muted-foreground">recaudación del día</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(dailySales.cashSales)}</div>
                    <p className="text-xs text-muted-foreground">
                      {dailySales.totalAmount > 0
                        ? `${((dailySales.cashSales / dailySales.totalAmount) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tarjeta</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(dailySales.cardSales)}</div>
                    <p className="text-xs text-muted-foreground">
                      {dailySales.totalAmount > 0
                        ? `${((dailySales.cardSales / dailySales.totalAmount) * 100).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Detalle de Ventas - {selectedDate}</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailySales.sales.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay ventas registradas para esta fecha</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Hora</TableHead>
                            <TableHead>Productos</TableHead>
                            <TableHead>Subtotal</TableHead>
                            <TableHead>ITBIS</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Pago</TableHead>
                            <TableHead>Cajero</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dailySales.sales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-mono text-sm">#{sale.id}</TableCell>
                              <TableCell>{SalesManager.formatTime(sale.timestamp)}</TableCell>
                              <TableCell>{sale.items.length} item(s)</TableCell>
                              <TableCell className="font-mono">{SalesManager.formatCurrency(sale.subtotal)}</TableCell>
                              <TableCell className="font-mono">{SalesManager.formatCurrency(sale.tax)}</TableCell>
                              <TableCell className="font-mono font-medium">
                                {SalesManager.formatCurrency(sale.total)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={sale.paymentMethod === "cash" ? "default" : "secondary"}>
                                  {sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                                </Badge>
                              </TableCell>
                              <TableCell>{sale.cashierName}</TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReprintReceipt(sale)}
                                  className="h-8"
                                >
                                  <Printer className="w-3 h-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Added complete weekly reports tab */}
        <TabsContent value="weekly" className="space-y-6">
          <div>
            <Label htmlFor="week">Semana (inicio)</Label>
            <Input
              id="week"
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-40"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Cargando reportes semanales...</div>
          ) : weeklySales ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas de la Semana</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{weeklySales.count}</div>
                    <p className="text-xs text-muted-foreground">{weeklySales.week}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Semanales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(weeklySales.total)}</div>
                    <p className="text-xs text-muted-foreground">
                      Promedio: {SalesManager.formatCurrency(weeklySales.total / 7)} por día
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Efectivo</CardTitle>
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(weeklySales.cash)}</div>
                    <p className="text-xs text-muted-foreground">
                      {weeklySales.total > 0 ? ((weeklySales.cash / weeklySales.total) * 100).toFixed(1) : 0}% del total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tarjeta</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(weeklySales.card)}</div>
                    <p className="text-xs text-muted-foreground">
                      {weeklySales.total > 0 ? ((weeklySales.card / weeklySales.total) * 100).toFixed(1) : 0}% del total
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {weeklyStats.map((stat, index) => (
                        <div key={stat.week} className="flex items-center justify-between">
                          <div className="text-sm font-medium">{stat.week}</div>
                          <div className="text-right">
                            <div className="font-bold">{SalesManager.formatCurrency(stat.total)}</div>
                            <div className="text-xs text-muted-foreground">{stat.count} ventas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ventas de la Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {weeklySales.sales.length > 0 ? (
                        weeklySales.sales.map((sale) => (
                          <div key={sale.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">Venta #{sale.id.slice(-6)}</div>
                              <div className="text-sm text-muted-foreground">
                                {SalesManager.formatTime(sale.timestamp)} -{" "}
                                {sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{SalesManager.formatCurrency(sale.total)}</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReprintReceipt(sale)}
                                className="text-xs"
                              >
                                Reimprimir
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">No hay ventas en esta semana</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No hay datos disponibles para esta semana</div>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          <div>
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlySales.length}</div>
                <p className="text-xs text-muted-foreground">transacciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {SalesManager.formatCurrency(monthlySales.reduce((sum, sale) => sum + sale.total, 0))}
                </div>
                <p className="text-xs text-muted-foreground">recaudación mensual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {monthlySales.length > 0
                    ? SalesManager.formatCurrency(
                        monthlySales.reduce((sum, sale) => sum + sale.total, 0) / monthlySales.length,
                      )
                    : SalesManager.formatCurrency(0)}
                </div>
                <p className="text-xs text-muted-foreground">ticket promedio</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Más Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.length > 0 ? (
                    topProducts.map((product, index) => (
                      <div key={product.product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.totalQuantity} unidades vendidas
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{SalesManager.formatCurrency(product.totalRevenue)}</div>
                          <div className="text-sm text-muted-foreground">{product.salesCount} ventas</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No hay datos de productos</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyStats.map((stat) => (
                    <div key={stat.month} className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {new Date(stat.month + "-01").toLocaleDateString("es-DO", {
                          year: "numeric",
                          month: "long",
                        })}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{SalesManager.formatCurrency(stat.total)}</div>
                        <div className="text-xs text-muted-foreground">{stat.count} ventas</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
