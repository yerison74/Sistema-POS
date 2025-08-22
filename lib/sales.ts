import { InventoryManager, type Product } from "./inventory"

export interface SaleItem {
  id: string
  productId: string
  product: Product
  quantity: number
  weight?: number
  unitPrice: number
  subtotal: number
}

export interface CustomerInfo {
  id: string // Agregando campo id para identificar al cliente
  name: string
  email: string
  idCard: string
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: "cash" | "card" | "credit" // Agregando método de pago crédito
  amountPaid: number
  change: number
  cashierId: string
  cashierName: string
  timestamp: number
  customerInfo?: CustomerInfo // Información opcional del cliente para crédito
}

export interface DailySales {
  date: string
  sales: Sale[]
  totalSales: number
  totalAmount: number
  cashSales: number
  cardSales: number
  creditSales: number // Agregando ventas a crédito
}

const SALES_STORAGE_KEY = "pos-sales"
const DAILY_SALES_KEY = "pos-daily-sales"

export class SalesManager {
  private static instance: SalesManager
  private inventoryManager: InventoryManager

  private constructor() {
    this.inventoryManager = InventoryManager.getInstance()
  }

  static getInstance(): SalesManager {
    if (!SalesManager.instance) {
      SalesManager.instance = new SalesManager()
    }
    return SalesManager.instance
  }

  createSaleItem(productId: string, quantity: number, weight?: number): SaleItem | null {
    const product = this.inventoryManager.getProductById(productId)
    if (!product) return null

    // Check stock availability
    if (product.stock < quantity) {
      throw new Error(`Stock insuficiente. Disponible: ${product.stock}`)
    }

    const effectiveQuantity = product.unit === "weight" || product.unit === "bulk" ? weight || quantity : quantity
    const unitPrice = product.price
    const subtotal = unitPrice * effectiveQuantity

    return {
      id: `${productId}-${Date.now()}`,
      productId,
      product,
      quantity,
      weight,
      unitPrice,
      subtotal,
    }
  }

  calculateSaleTotal(items: SaleItem[]): { subtotal: number; tax: number; total: number } {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
    const tax = subtotal * 0.18 // 18% ITBIS
    const total = subtotal + tax

    return { subtotal, tax, total }
  }

  processSale(
    items: SaleItem[],
    paymentMethod: "cash" | "card" | "credit",
    amountPaid: number,
    cashierId: string,
    cashierName: string,
    customerInfo?: CustomerInfo,
  ): Sale {
    if (items.length === 0) {
      throw new Error("No hay productos en el carrito")
    }

    const { subtotal, tax, total } = this.calculateSaleTotal(items)

    if (paymentMethod === "cash" && amountPaid < total) {
      throw new Error("El monto pagado es insuficiente")
    }

    if (paymentMethod === "credit" && !customerInfo) {
      throw new Error("La información del cliente es requerida para ventas a crédito")
    }

    const change = paymentMethod === "cash" ? amountPaid - total : 0

    // Update inventory
    for (const item of items) {
      this.inventoryManager.updateStock(item.productId, -item.quantity)
    }

    const sale: Sale = {
      id: Date.now().toString(),
      items,
      subtotal,
      tax,
      total,
      paymentMethod,
      amountPaid,
      change,
      cashierId,
      cashierName,
      timestamp: Date.now(),
      customerInfo, // Agregando información del cliente
    }

    this.saveSale(sale)
    return sale
  }

  private saveSale(sale: Sale): void {
    if (typeof window === "undefined") return

    // Save individual sale
    const sales = this.getAllSales()
    sales.push(sale)
    localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales))

    // Update daily sales
    const today = new Date()
      .toLocaleDateString("es-DO", {
        timeZone: "America/Santo_Domingo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split("/")
      .reverse()
      .join("-")

    const dailySales = this.getDailySales(today)

    dailySales.sales.push(sale)
    dailySales.totalSales = dailySales.sales.length
    dailySales.totalAmount = dailySales.sales.reduce((sum, s) => sum + s.total, 0)
    dailySales.cashSales = dailySales.sales
      .filter((s) => s.paymentMethod === "cash")
      .reduce((sum, s) => sum + s.total, 0)
    dailySales.cardSales = dailySales.sales
      .filter((s) => s.paymentMethod === "card")
      .reduce((sum, s) => sum + s.total, 0)
    dailySales.creditSales = dailySales.sales
      .filter((s) => s.paymentMethod === "credit")
      .reduce((sum, s) => sum + s.total, 0)

    const allDailySales = this.getAllDailySales()
    const existingIndex = allDailySales.findIndex((ds) => ds.date === today)

    if (existingIndex >= 0) {
      allDailySales[existingIndex] = dailySales
    } else {
      allDailySales.push(dailySales)
    }

    localStorage.setItem(DAILY_SALES_KEY, JSON.stringify(allDailySales))
  }

  getAllSales(): Sale[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(SALES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  getDailySales(date: string): DailySales {
    const allDailySales = this.getAllDailySales()
    const existing = allDailySales.find((ds) => ds.date === date)

    if (existing) return existing

    return {
      date,
      sales: [],
      totalSales: 0,
      totalAmount: 0,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0, // Inicializando ventas a crédito
    }
  }

  getAllDailySales(): DailySales[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(DAILY_SALES_KEY)
    return stored ? JSON.parse(stored) : []
  }

  getTodaysSales(): DailySales {
    const today = new Date()
      .toLocaleDateString("es-DO", {
        timeZone: "America/Santo_Domingo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split("/")
      .reverse()
      .join("-")
    return this.getDailySales(today)
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  static formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString("es-DO", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  static formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString("es-DO", {
      timeZone: "America/Santo_Domingo",
      hour: "2-digit",
      minute: "2-digit",
    })
  }
}
