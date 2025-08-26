export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  idCard: string
  address?: string
  password: string
  createdAt: number
  totalPurchases: number
  totalSpent: number
}

export class CustomerManager {
  private static readonly STORAGE_KEY = "pos_customers"
  private static cache: Customer[] | null = null
  private static cacheTimestamp = 0
  private static readonly CACHE_DURATION = 5000 // 5 segundos

  static getCustomers(): Customer[] {
    try {
      const now = Date.now()
      if (this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
        return this.cache
      }

      const data = localStorage.getItem(this.STORAGE_KEY)
      const customers = data ? JSON.parse(data) : []

      this.cache = customers
      this.cacheTimestamp = now

      return customers
    } catch (error) {
      console.error("Error loading customers:", error)
      return []
    }
  }

  static saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customers))
      this.cache = customers
      this.cacheTimestamp = Date.now()
    } catch (error) {
      console.error("Error saving customers:", error)
    }
  }

  private static searchCache = new Map<string, Customer[]>()

  static searchCustomers(query: string): Customer[] {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return this.getCustomers()

    if (this.searchCache.has(searchTerm)) {
      return this.searchCache.get(searchTerm)!
    }

    const customers = this.getCustomers()

    const exactMatches = customers.filter(
      (customer) =>
        customer.name.toLowerCase() === searchTerm ||
        customer.email.toLowerCase() === searchTerm ||
        customer.phone === query.trim() ||
        customer.idCard === query.trim(),
    )

    let results: Customer[]
    if (exactMatches.length > 0) {
      results = exactMatches
    } else {
      results = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.phone.includes(searchTerm) ||
          customer.idCard.includes(searchTerm),
      )
    }

    if (this.searchCache.size > 50) {
      const firstKey = this.searchCache.keys().next().value
      this.searchCache.delete(firstKey)
    }
    this.searchCache.set(searchTerm, results)

    return results
  }

  static addCustomer(customerData: Omit<Customer, "id" | "createdAt" | "totalPurchases" | "totalSpent">): Customer {
    const customers = this.getCustomers()

    const existingCustomer = customers.find(
      (c) => c.email.toLowerCase() === customerData.email.toLowerCase() || c.idCard === customerData.idCard,
    )

    if (existingCustomer) {
      throw new Error("Ya existe un cliente con este correo o cédula")
    }

    const newCustomer: Customer = {
      ...customerData,
      id: Date.now().toString(),
      createdAt: Date.now(),
      totalPurchases: 0,
      totalSpent: 0,
    }

    customers.push(newCustomer)
    this.saveCustomers(customers)
    this.searchCache.clear()
    return newCustomer
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const customers = this.getCustomers()
    const index = customers.findIndex((c) => c.id === id)

    if (index === -1) {
      throw new Error("Cliente no encontrado")
    }

    if (updates.email || updates.idCard) {
      const duplicate = customers.find(
        (c) =>
          c.id !== id &&
          ((updates.email && c.email.toLowerCase() === updates.email.toLowerCase()) ||
            (updates.idCard && c.idCard === updates.idCard)),
      )

      if (duplicate) {
        throw new Error("Ya existe un cliente con este correo o cédula")
      }
    }

    customers[index] = { ...customers[index], ...updates }
    this.saveCustomers(customers)
    this.searchCache.clear()
    return customers[index]
  }

  static deleteCustomer(id: string): void {
    const customers = this.getCustomers()
    const filteredCustomers = customers.filter((c) => c.id !== id)
    this.saveCustomers(filteredCustomers)
    this.searchCache.clear()
  }

  static getCustomerById(id: string): Customer | null {
    const customers = this.getCustomers()
    return customers.find((c) => c.id === id) || null
  }

  static updateCustomerPurchase(customerId: string, purchaseAmount: number): void {
    const customers = this.getCustomers()
    const customerIndex = customers.findIndex((c) => c.id === customerId)

    if (customerIndex !== -1) {
      customers[customerIndex].totalPurchases += 1
      customers[customerIndex].totalSpent += purchaseAmount
      this.saveCustomers(customers)
    }
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  static formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("es-DO", {
      timeZone: "America/Santo_Domingo",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  static validateCustomerPassword(customerId: string, password: string): boolean {
    const customer = this.getCustomerById(customerId)
    return customer ? customer.password === password : false
  }
}
