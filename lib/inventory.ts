export interface Product {
  id: string
  code: string
  name: string
  description: string
  price: number
  stock: number
  minStock: number
  category: string
  unit: "piece" | "weight" | "bulk"
  weight?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InventoryStore {
  products: Product[]
  categories: string[]
}

const STORAGE_KEY = "pos-inventory"

export class InventoryManager {
  private static instance: InventoryManager
  private data: InventoryStore

  private constructor() {
    this.data = this.loadFromStorage()
  }

  static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager()
    }
    return InventoryManager.instance
  }

  private loadFromStorage(): InventoryStore {
    if (typeof window === "undefined") {
      return { products: [], categories: [] }
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }

    // Initialize with sample data
    const initialData: InventoryStore = {
      products: [
        {
          id: "1",
          code: "001",
          name: "Coca Cola 600ml",
          description: "Refresco de cola 600ml",
          price: 25.0,
          stock: 50,
          minStock: 10,
          category: "Bebidas",
          unit: "piece",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          code: "002",
          name: "Pan Blanco",
          description: "Pan blanco por kilogramo",
          price: 35.0,
          stock: 15,
          minStock: 5,
          category: "Panadería",
          unit: "weight",
          weight: 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          code: "003",
          name: "Arroz",
          description: "Arroz a granel por kilogramo",
          price: 18.5,
          stock: 100,
          minStock: 20,
          category: "Granos",
          unit: "bulk",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      categories: ["Bebidas", "Panadería", "Granos", "Lácteos", "Carnes", "Verduras", "Otros"],
    }

    this.saveToStorage(initialData)
    return initialData
  }

  private saveToStorage(data: InventoryStore): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  getAllProducts(): Product[] {
    return this.data.products.filter((p) => p.isActive)
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id)
  }

  getProductByCode(code: string): Product | undefined {
    return this.data.products.find((p) => p.code === code && p.isActive)
  }

  searchProducts(query: string): Product[] {
    const lowercaseQuery = query.toLowerCase()
    return this.data.products.filter(
      (p) =>
        p.isActive &&
        (p.name.toLowerCase().includes(lowercaseQuery) ||
          p.description.toLowerCase().includes(lowercaseQuery) ||
          p.code.toLowerCase().includes(lowercaseQuery)),
    )
  }

  getLowStockProducts(): Product[] {
    return this.data.products.filter((p) => p.isActive && p.stock <= p.minStock)
  }

  addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.data.products.push(newProduct)
    this.saveToStorage(this.data)
    return newProduct
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const index = this.data.products.findIndex((p) => p.id === id)
    if (index === -1) return null

    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.saveToStorage(this.data)
    return this.data.products[index]
  }

  deleteProduct(id: string): boolean {
    const index = this.data.products.findIndex((p) => p.id === id)
    if (index === -1) return false

    this.data.products[index].isActive = false
    this.data.products[index].updatedAt = new Date().toISOString()
    this.saveToStorage(this.data)
    return true
  }

  updateStock(id: string, quantity: number): boolean {
    const product = this.getProductById(id)
    if (!product) return false

    product.stock += quantity
    product.updatedAt = new Date().toISOString()
    this.saveToStorage(this.data)
    return true
  }

  getCategories(): string[] {
    return this.data.categories
  }

  addCategory(category: string): void {
    if (!this.data.categories.includes(category)) {
      this.data.categories.push(category)
      this.saveToStorage(this.data)
    }
  }
}
