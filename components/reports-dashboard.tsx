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
import { CustomerManager, type Customer } from "@/lib/customers"
import { printReceipt } from "@/components/receipt-printer"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Banknote,
  Download,
  RefreshCw,
  Printer,
  Users,
} from "lucide-react"
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
  credit: number
}

interface WeeklyStats {
  week: string
  total: number
  count: number
  average: number
}

interface CustomerConsumption {
  customer: Customer
  totalAmount: number
  creditAmount: number
  salesCount: number
  creditSalesCount: number
  sales: Sale[]
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
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [customRangeSales, setCustomRangeSales] = useState<Sale[]>([])
  const [customerConsumption, setCustomerConsumption] = useState<CustomerConsumption[]>([])

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
  // const customerManager = CustomerManager.getInstance()

  const loadReports = () => {
    setIsLoading(true)
    try {
      const salesManager = SalesManager.getInstance()
      const allSales = salesManager.getAllSales()

      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      if (!startDate) {
        setStartDate(firstDayOfMonth.toISOString().split("T")[0])
      }
      if (!endDate) {
        setEndDate(lastDayOfMonth.toISOString().split("T")[0])
      }

      // Load daily sales
      const daily = salesManager.getDailySales(selectedDate)
      setDailySales(daily)

      // Load monthly sales
      const monthlyFilter = allSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp)
        const saleMonth = saleDate.toISOString().slice(0, 7)
        return saleMonth === selectedMonth
      })
      setMonthlySales(monthlyFilter)

      const currentStartDate = startDate || firstDayOfMonth.toISOString().split("T")[0]
      const currentEndDate = endDate || lastDayOfMonth.toISOString().split("T")[0]

      const customFilter = allSales.filter((sale) => {
        const saleDate = new Date(sale.timestamp).toISOString().split("T")[0]
        return saleDate >= currentStartDate && saleDate <= currentEndDate
      })
      setCustomRangeSales(customFilter)

      // Calculate customer consumption for the date range
      const consumption = calculateCustomerConsumption(customFilter)
      setCustomerConsumption(consumption)

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
      const weeklyCredit = weeklySalesFilter
        .filter((s) => s.paymentMethod === "credit")
        .reduce((sum, sale) => sum + sale.total, 0)

      setWeeklySales({
        week: `${weekStart.toLocaleDateString("es-DO")} - ${weekEnd.toLocaleDateString("es-DO")}`,
        sales: weeklySalesFilter,
        total: weeklyTotal,
        count: weeklySalesFilter.length,
        cash: weeklyCash,
        card: weeklyCard,
        credit: weeklyCredit,
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

  useEffect(() => {
    loadReports()
  }, [selectedDate, selectedMonth, selectedWeek, startDate, endDate])

  const calculateCustomerConsumption = (sales: Sale[]): CustomerConsumption[] => {
    const customers = CustomerManager.getCustomers()
    const consumptionMap = new Map<string, CustomerConsumption>()

    customers.forEach((customer) => {
      consumptionMap.set(customer.id, {
        customer,
        totalAmount: 0,
        creditAmount: 0,
        salesCount: 0,
        creditSalesCount: 0,
        sales: [],
      })
    })

    sales.forEach((sale) => {
      if (sale.customerInfo?.id) {
        let existing = consumptionMap.get(sale.customerInfo.id)

        // If customer doesn't exist (was deleted), create entry from saved customer info
        if (!existing) {
          const deletedCustomer: Customer = {
            id: sale.customerInfo.id,
            name: sale.customerInfo.name,
            email: sale.customerInfo.email,
            phone: "", // Not available in customerInfo
            idCard: sale.customerInfo.idCard,
            password: "", // Not available in customerInfo
            createdAt: 0, // Not available in customerInfo
            totalPurchases: 0,
            lastPurchase: sale.timestamp,
          }

          existing = {
            customer: deletedCustomer,
            totalAmount: 0,
            creditAmount: 0,
            salesCount: 0,
            creditSalesCount: 0,
            sales: [],
          }
          consumptionMap.set(sale.customerInfo.id, existing)
        }

        existing.totalAmount += sale.total
        existing.salesCount += 1
        existing.sales.push(sale)

        if (sale.paymentMethod === "credit") {
          existing.creditAmount += sale.total
          existing.creditSalesCount += 1
        }
      }
    })

    return Array.from(consumptionMap.values())
      .filter((consumption) => consumption.salesCount > 0)
      .sort((a, b) => b.creditAmount - a.creditAmount)
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

  const exportCustomerReport = () => {
    if (customerConsumption.length === 0) return

    const csvContent = [
      `Reporte de Consumo por Cliente - ${startDate} a ${endDate}`,
      "",
      "Resumen por Cliente",
      "Cliente,Email,Teléfono,Total Consumido,Deuda a Crédito,Ventas Totales,Ventas a Crédito",
      ...customerConsumption.map((consumption) =>
        [
          consumption.customer.name,
          consumption.customer.email,
          consumption.customer.phone,
          SalesManager.formatCurrency(consumption.totalAmount).replace(",", ""),
          SalesManager.formatCurrency(consumption.creditAmount).replace(",", ""),
          consumption.salesCount,
          consumption.creditSalesCount,
        ].join(","),
      ),
      "",
      "Detalle de Ventas por Cliente",
      "Cliente,ID Venta,Fecha,Hora,Total,Método de Pago",
      ...customerConsumption.flatMap((consumption) =>
        consumption.sales.map((sale) =>
          [
            consumption.customer.name,
            sale.id,
            SalesManager.formatDateTime(sale.timestamp).split(" ")[0],
            SalesManager.formatTime(sale.timestamp),
            SalesManager.formatCurrency(sale.total).replace(",", ""),
            getPaymentMethodName(sale.paymentMethod),
          ].join(","),
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-clientes-${startDate}-${endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte de clientes exportado",
      description: "El reporte de consumo por cliente se ha descargado correctamente",
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

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "credit":
        return "Crédito"
      default:
        return "Desconocido"
    }
  }

  // Added CSV export functions for weekly and monthly reports
  const exportWeeklyReport = () => {
    const csvContent = [
      `Reporte Semanal - Semana del ${selectedWeek}`,
      "",
      "Resumen de la Semana",
      `Total de Ventas: ${weeklySales?.count || 0}`,
      `Ingresos Totales: ${SalesManager.formatCurrency(weeklySales?.total || 0)}`,
      `Efectivo: ${SalesManager.formatCurrency(weeklySales?.cash || 0)}`,
      `Tarjeta: ${SalesManager.formatCurrency(weeklySales?.card || 0)}`,
      `Crédito: ${SalesManager.formatCurrency(weeklySales?.credit || 0)}`,
      "",
      "Detalle de Ventas",
      "ID Venta,Fecha,Hora,Total,Método de Pago,Cliente",
      ...(weeklySales?.sales || []).map((sale) =>
        [
          sale.id,
          SalesManager.formatDateTime(sale.timestamp).split(" ")[0],
          SalesManager.formatTime(sale.timestamp),
          SalesManager.formatCurrency(sale.total).replace(",", ""),
          getPaymentMethodName(sale.paymentMethod),
          sale.customerInfo?.name || "Sin cliente",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-semanal-${selectedWeek}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte semanal exportado",
      description: "El reporte semanal se ha descargado correctamente",
    })
  }

  const exportMonthlyReport = () => {
    const csvContent = [
      `Reporte Mensual - ${selectedMonth}`,
      "",
      "Resumen del Mes",
      `Total de Ventas: ${monthlySales.length}`,
      `Ingresos Totales: ${SalesManager.formatCurrency(monthlySales.reduce((sum, sale) => sum + sale.total, 0))}`,
      `Efectivo: ${SalesManager.formatCurrency(monthlySales.filter((s) => s.paymentMethod === "cash").reduce((sum, sale) => sum + sale.total, 0))}`,
      `Tarjeta: ${SalesManager.formatCurrency(monthlySales.filter((s) => s.paymentMethod === "card").reduce((sum, sale) => sum + sale.total, 0))}`,
      `Crédito: ${SalesManager.formatCurrency(monthlySales.filter((s) => s.paymentMethod === "credit").reduce((sum, sale) => sum + sale.total, 0))}`,
      "",
      "Detalle de Ventas",
      "ID Venta,Fecha,Hora,Total,Método de Pago,Cliente",
      ...monthlySales.map((sale) =>
        [
          sale.id,
          SalesManager.formatDateTime(sale.timestamp).split(" ")[0],
          SalesManager.formatTime(sale.timestamp),
          SalesManager.formatCurrency(sale.total).replace(",", ""),
          getPaymentMethodName(sale.paymentMethod),
          sale.customerInfo?.name || "Sin cliente",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-mensual-${selectedMonth}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Reporte mensual exportado",
      description: "El reporte mensual se ha descargado correctamente",
    })
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

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Diario</TabsTrigger>
          <TabsTrigger value="weekly">Semanal</TabsTrigger>
          <TabsTrigger value="monthly">Mensual</TabsTrigger>
          <TabsTrigger value="custom">Por Cliente</TabsTrigger>
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
                                  {getPaymentMethodName(sale.paymentMethod)}
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
          <div className="flex items-center justify-between">
            <Label htmlFor="week">Semana (inicio)</Label>
            <Input
              id="week"
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="w-40"
            />
            {/* Added export button for weekly reports */}
            <Button onClick={exportWeeklyReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
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

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Crédito</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{SalesManager.formatCurrency(weeklySales.credit)}</div>
                    <p className="text-xs text-muted-foreground">
                      {weeklySales.total > 0 ? ((weeklySales.credit / weeklySales.total) * 100).toFixed(1) : 0}% del
                      total
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
                                {SalesManager.formatTime(sale.timestamp)} - {getPaymentMethodName(sale.paymentMethod)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`font-bold ${sale.paymentMethod === "credit" ? "text-red-600" : ""}`}>
                                {SalesManager.formatCurrency(sale.total)}
                              </div>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="month">Mes</Label>
            <Input
              id="month"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-40"
            />
            {/* Added export button for monthly reports */}
            <Button onClick={exportMonthlyReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
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

        <TabsContent value="custom" className="space-y-6">
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={exportCustomerReport} disabled={customerConsumption.length === 0} className="mt-6">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Cargando reportes de clientes...</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customerConsumption.length}</div>
                    <p className="text-xs text-muted-foreground">con compras en el período</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{customRangeSales.length}</div>
                    <p className="text-xs text-muted-foreground">transacciones</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {SalesManager.formatCurrency(customRangeSales.reduce((sum, sale) => sum + sale.total, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">en el período</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Deuda Total</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {SalesManager.formatCurrency(customerConsumption.reduce((sum, c) => sum + c.creditAmount, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">ventas a crédito</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Consumo por Cliente ({startDate} - {endDate})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerConsumption.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No hay ventas con clientes registrados en este período</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead>Total Consumido</TableHead>
                            <TableHead>Deuda a Crédito</TableHead>
                            <TableHead>Ventas</TableHead>
                            <TableHead>Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerConsumption.map((consumption) => (
                            <TableRow key={consumption.customer.id}>
                              <TableCell className="font-medium">
                                {consumption.customer.name}
                                {!CustomerManager.getCustomers().find((c) => c.id === consumption.customer.id) && (
                                  <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    Cliente eliminado
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{consumption.customer.email}</TableCell>
                              <TableCell>{consumption.customer.phone || "N/A"}</TableCell>
                              <TableCell>{SalesManager.formatCurrency(consumption.totalAmount)}</TableCell>
                              <TableCell className={consumption.creditAmount > 0 ? "text-red-600 font-semibold" : ""}>
                                {SalesManager.formatCurrency(consumption.creditAmount)}
                              </TableCell>
                              <TableCell>
                                {consumption.salesCount} total
                                {consumption.creditSalesCount > 0 && (
                                  <span className="text-red-600 ml-2">({consumption.creditSalesCount} a crédito)</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReprintReceipt(consumption.sales[0])}
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

              {customerConsumption.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Ventas por Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {customerConsumption.map((consumption) => (
                        <div key={consumption.customer.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{consumption.customer.name}</h4>
                              <p className="text-sm text-muted-foreground">{consumption.customer.email}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                Deuda: {SalesManager.formatCurrency(consumption.creditAmount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total: {SalesManager.formatCurrency(consumption.totalAmount)}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {consumption.sales.map((sale) => (
                              <div key={sale.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <div className="font-medium">Venta #{sale.id.slice(-6)}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {SalesManager.formatDateTime(sale.timestamp)} -{" "}
                                    {getPaymentMethodName(sale.paymentMethod)}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`font-bold ${sale.paymentMethod === "credit" ? "text-red-600" : ""}`}>
                                    {SalesManager.formatCurrency(sale.total)}
                                  </div>
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
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
