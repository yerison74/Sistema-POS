declare global {
  interface Window {
    emailjs: any
  }
}

export interface EmailConfig {
  serviceId: string
  templateId: string
  publicKey: string
  fromName: string
  fromEmail: string
}

export class EmailService {
  private static readonly CONFIG_KEY = "pos_email_config"

  static saveConfig(config: EmailConfig): boolean {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config))
      return true
    } catch (error) {
      console.error("[v0] Error al guardar configuración de email:", error)
      return false
    }
  }

  static getConfig(): EmailConfig | null {
    try {
      const config = localStorage.getItem(this.CONFIG_KEY)
      return config ? JSON.parse(config) : null
    } catch (error) {
      console.error("[v0] Error al cargar configuración de email:", error)
      return null
    }
  }

  private static async loadEmailJS(): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && window.emailjs) {
        return true
      }

      return new Promise((resolve) => {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"
        script.onload = () => {
          console.log("[v0] EmailJS cargado exitosamente")
          resolve(true)
        }
        script.onerror = () => {
          console.error("[v0] Error al cargar EmailJS")
          resolve(false)
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error("[v0] Error al cargar EmailJS:", error)
      return false
    }
  }

  private static safeValue(value: any, defaultValue = 0): number {
    return typeof value === "number" && !isNaN(value) ? value : defaultValue
  }

  private static safeString(value: any, defaultValue = ""): string {
    return typeof value === "string" ? value : String(value || defaultValue)
  }

  private static formatCurrency(amount: any): string {
    const safeAmount = this.safeValue(amount, 0)
    return `RD$${safeAmount.toFixed(2)}`
  }

  static async sendInvoiceEmail(sale: any, customerEmail: string, customerName: string): Promise<boolean> {
    try {
      console.log("[v0] Iniciando envío de factura por email")
      console.log("[v0] Datos de venta:", JSON.stringify(sale, null, 2))

      if (!sale || typeof sale !== "object") {
        throw new Error("Datos de venta inválidos")
      }

      const config = this.getConfig()
      if (!config || !config.serviceId || !config.templateId || !config.publicKey) {
        throw new Error("Configuración de email incompleta")
      }

      const emailJSLoaded = await this.loadEmailJS()
      if (!emailJSLoaded) {
        throw new Error("No se pudo cargar EmailJS")
      }

      // Inicializar EmailJS
      window.emailjs.init(config.publicKey)

      const templateParams = {
        to_email: customerEmail,
        to_name: customerName,
        from_name: config.fromName,
        from_email: config.fromEmail,

        // Información del negocio
        business_name: "Mi Negocio POS",
        business_address: "Dirección del Negocio",
        business_phone: "Teléfono del Negocio",

        invoice_id: this.safeString(sale.id, "N/A"),
        invoice_date: sale.timestamp
          ? new Date(sale.timestamp).toLocaleDateString("es-DO")
          : new Date().toLocaleDateString("es-DO"),
        invoice_time: sale.timestamp
          ? new Date(sale.timestamp).toLocaleTimeString("es-DO", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),

        // Información del cliente
        customer_name: customerName,
        customer_email: customerEmail,
        customer_id: sale.customerInfo?.idCard || "N/A",

        cashier_name: (() => {
          const cashierValue = sale.cashierName || "Cajero"
          console.log("[v0] Valores de cajero disponibles:")
          console.log("[v0] sale.cashierName:", sale.cashierName)
          console.log("[v0] cashier_name final:", cashierValue)
          return this.safeString(cashierValue, "Cajero")
        })(),

        products_list: Array.isArray(sale.items)
          ? sale.items
              .map((item: any, index: number) => {
                console.log(`[v0] Item ${index}:`, JSON.stringify(item, null, 2))

                const itemName = this.safeString(item?.name || item?.productName, "Producto")
                const itemQuantity = this.safeValue(item?.quantity || item?.qty, 1)
                const itemPrice = this.safeValue(item?.price || item?.unitPrice || item?.cost, 0)
                const itemSubtotal = itemQuantity * itemPrice

                console.log(
                  `[v0] Item procesado - Nombre: ${itemName}, Cantidad: ${itemQuantity}, Precio: ${itemPrice}, Subtotal: ${itemSubtotal}`,
                )

                return `${index + 1}. ${itemName} - Cantidad: ${itemQuantity} - Precio: ${this.formatCurrency(itemPrice)} - Subtotal: ${this.formatCurrency(itemSubtotal)}`
              })
              .join("\n")
          : "No hay productos",

        subtotal: this.formatCurrency(sale.subtotal),
        tax: this.formatCurrency(sale.tax),
        total: this.formatCurrency(sale.total),

        // Método de pago
        payment_method:
          sale.paymentMethod === "cash" ? "Efectivo" : sale.paymentMethod === "card" ? "Tarjeta" : "Crédito",

        // Mensaje personalizado
        message: `Gracias por su compra. Esta es su factura correspondiente a la venta #${this.safeString(sale.id, "N/A")}.`,
      }

      console.log("[v0] Enviando email con EmailJS...")
      console.log("[v0] Template params:", JSON.stringify(templateParams, null, 2))

      const response = await window.emailjs.send(config.serviceId, config.templateId, templateParams)

      console.log("[v0] Email enviado exitosamente:", response)
      return true
    } catch (error) {
      console.error("[v0] Error al enviar email:", error)
      throw error
    }
  }

  static async sendTestEmail(): Promise<boolean> {
    try {
      console.log("[v0] Enviando email de prueba")

      const config = this.getConfig()
      if (!config) {
        throw new Error("No hay configuración de email disponible")
      }

      // Crear datos de prueba
      const testSale = {
        id: "TEST-001",
        timestamp: Date.now(),
        items: [
          { name: "Producto de Prueba", quantity: 2, price: 50.0 },
          { name: "Otro Producto", quantity: 1, price: 25.0 },
        ],
        subtotal: 125.0,
        tax: 22.5,
        total: 147.5,
        paymentMethod: "cash",
        customerInfo: {
          idCard: "12345678901",
        },
        cashierName: "Cajero de Prueba",
      }

      return await this.sendInvoiceEmail(
        testSale,
        config.fromEmail, // Enviar prueba al email del negocio
        "Cliente de Prueba",
      )
    } catch (error) {
      console.error("[v0] Error al enviar email de prueba:", error)
      throw error
    }
  }
}
