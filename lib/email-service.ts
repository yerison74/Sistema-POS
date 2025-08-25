declare global {
  interface Window {
    jsPDF: any
  }
}

export interface EmailConfig {
  web3formsKey: string
  fromName: string
  fromEmail: string
}

export class EmailService {
  private static readonly STORAGE_KEY = "pos_email_config"

  static saveConfig(config: EmailConfig): boolean {
    try {
      console.log("[v0] Guardando configuración de email:", config)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config))
      return true
    } catch (error) {
      console.error("[v0] Error al guardar configuración de email:", error)
      return false
    }
  }

  static getConfig(): EmailConfig | null {
    try {
      const config = localStorage.getItem(this.STORAGE_KEY)
      if (!config) {
        console.log("[v0] No hay configuración de email guardada")
        return null
      }
      const parsedConfig = JSON.parse(config)
      console.log("[v0] Configuración de email cargada:", parsedConfig)
      return parsedConfig
    } catch (error) {
      console.error("[v0] Error al cargar configuración de email:", error)
      return null
    }
  }

  static generateInvoiceText(sale: any, customerName: string, customerEmail: string): string {
    const safeValue = (value: any): number => {
      const num = Number.parseFloat(value)
      return isNaN(num) ? 0 : num
    }

    const formatCurrency = (amount: any): string => {
      const safeAmount = safeValue(amount)
      return `RD$${safeAmount.toFixed(2)}`
    }

    const formatDate = (timestamp: number): string => {
      return new Date(timestamp).toLocaleString("es-DO", {
        timeZone: "America/Santo_Domingo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const invoiceText = `
═══════════════════════════════════════
           FACTURA DE VENTA
═══════════════════════════════════════

INFORMACIÓN DEL NEGOCIO:
Cafetería Javier
Av. Principal #123, Santo Domingo, RD
Tel: (809) 123-4567
RNC: 123456789

INFORMACIÓN DEL CLIENTE:
Nombre: ${customerName}
Email: ${customerEmail}

DETALLES DE LA VENTA:
Factura #: ${sale.id}
Fecha: ${formatDate(sale.timestamp)}
Método de Pago: Crédito

PRODUCTOS:
───────────────────────────────────────
${sale.items
  .map(
    (item: any) =>
      `${item.product.name}
   Cantidad: ${item.quantity} x ${formatCurrency(item.unitPrice)}
   Subtotal: ${formatCurrency(item.subtotal)}`,
  )
  .join("\n\n")}
───────────────────────────────────────

RESUMEN:
Subtotal: ${formatCurrency(sale.subtotal)}
ITBIS (18%): ${formatCurrency(sale.tax)}
TOTAL: ${formatCurrency(sale.total)}

═══════════════════════════════════════
        ¡Gracias por su compra!
     Conserve esta factura como
         comprobante de pago
═══════════════════════════════════════

NOTA: Esta es una venta a crédito.
Por favor, realice el pago según los
términos acordados.
`

    return invoiceText.trim()
  }

  private static async loadJsPDF(): Promise<any> {
    if (typeof window !== "undefined" && !window.jsPDF) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
      document.head.appendChild(script)

      return new Promise((resolve) => {
        script.onload = () => {
          resolve(window.jsPDF)
        }
      })
    }
    return window.jsPDF
  }

  private static async generateInvoicePDF(
    sale: any,
    customerName: string,
    customerEmail: string,
  ): Promise<string | null> {
    try {
      const jsPDF = await this.loadJsPDF()
      if (!jsPDF) return null

      const doc = new jsPDF()

      const safeValue = (value: any): number => {
        const num = Number.parseFloat(value)
        return isNaN(num) ? 0 : num
      }

      const formatCurrency = (amount: any): string => {
        const safeAmount = safeValue(amount)
        return `RD$${safeAmount.toFixed(2)}`
      }

      const formatDate = (timestamp: number): string => {
        return new Date(timestamp).toLocaleString("es-DO", {
          timeZone: "America/Santo_Domingo",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      }

      // Configurar fuente y tamaño
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")

      // Título
      doc.text("FACTURA DE VENTA", 105, 20, { align: "center" })

      // Información del negocio
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("Cafetería Javier", 20, 40)
      doc.setFont(undefined, "normal")
      doc.text("Av. Principal #123, Santo Domingo, RD", 20, 50)
      doc.text("Tel: (809) 123-4567", 20, 60)
      doc.text("RNC: 123456789", 20, 70)

      // Información del cliente
      doc.setFont(undefined, "bold")
      doc.text("INFORMACIÓN DEL CLIENTE:", 20, 90)
      doc.setFont(undefined, "normal")
      doc.text(`Nombre: ${customerName}`, 20, 100)
      doc.text(`Email: ${customerEmail}`, 20, 110)

      // Detalles de la venta
      doc.setFont(undefined, "bold")
      doc.text("DETALLES DE LA VENTA:", 20, 130)
      doc.setFont(undefined, "normal")
      doc.text(`Factura #: ${sale.id}`, 20, 140)
      doc.text(`Fecha: ${formatDate(sale.timestamp)}`, 20, 150)
      doc.text("Método de Pago: Crédito", 20, 160)

      // Productos
      doc.setFont(undefined, "bold")
      doc.text("PRODUCTOS:", 20, 180)
      doc.setFont(undefined, "normal")

      let yPosition = 190
      sale.items.forEach((item: any) => {
        doc.text(`${item.product.name}`, 20, yPosition)
        doc.text(`Cantidad: ${item.quantity} x ${formatCurrency(item.unitPrice)}`, 30, yPosition + 10)
        doc.text(`Subtotal: ${formatCurrency(item.subtotal)}`, 30, yPosition + 20)
        yPosition += 35
      })

      // Resumen
      yPosition += 10
      doc.setFont(undefined, "bold")
      doc.text("RESUMEN:", 20, yPosition)
      doc.setFont(undefined, "normal")
      doc.text(`Subtotal: ${formatCurrency(sale.subtotal)}`, 20, yPosition + 15)
      doc.text(`ITBIS (18%): ${formatCurrency(sale.tax)}`, 20, yPosition + 25)
      doc.setFont(undefined, "bold")
      doc.text(`TOTAL: ${formatCurrency(sale.total)}`, 20, yPosition + 35)

      // Nota final
      doc.setFont(undefined, "normal")
      doc.setFontSize(10)
      doc.text("¡Gracias por su compra!", 105, yPosition + 55, { align: "center" })
      doc.text("Conserve esta factura como comprobante de pago", 105, yPosition + 65, { align: "center" })
      doc.text("NOTA: Esta es una venta a crédito.", 105, yPosition + 80, { align: "center" })
      doc.text("Por favor, realice el pago según los términos acordados.", 105, yPosition + 90, { align: "center" })

      // Convertir a base64
      const pdfBase64 = doc.output("datauristring").split(",")[1]
      return pdfBase64
    } catch (error) {
      console.error("[v0] Error generando PDF:", error)
      return null
    }
  }

  static async sendInvoiceEmail(sale: any, customerEmail: string, customerName: string): Promise<boolean> {
    try {
      console.log("[v0] Iniciando envío de factura por email")

      const config = this.getConfig()
      if (!config || !config.web3formsKey) {
        console.error("[v0] No hay configuración de email disponible")
        return false
      }

      console.log("[v0] Configuración de email cargada:", config)

      if (!sale || !sale.id) {
        console.error("[v0] Sale object is invalid or missing id")
        return false
      }

      console.log("[v0] Generando texto de factura para:", {
        saleId: sale.id,
        customerName,
        customerEmail,
      })

      const invoiceText = this.generateInvoiceText(sale, customerName, customerEmail)

      console.log("[v0] Generando PDF de la factura...")
      const pdfBase64 = await this.generateInvoicePDF(sale, customerName, customerEmail)

      const formData = new FormData()
      formData.append("access_key", config.web3formsKey)
      formData.append("subject", `Factura #${sale.id} - ${config.fromName}`)
      formData.append("from_name", config.fromName)
      formData.append("from_email", config.fromEmail)
      formData.append("to_email", customerEmail)
      formData.append("message", invoiceText)

      if (pdfBase64) {
        console.log("[v0] Adjuntando PDF a la factura")
        const pdfBlob = new Blob([Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))], {
          type: "application/pdf",
        })
        formData.append("attachment", pdfBlob, `factura-${sale.id}.pdf`)
      } else {
        console.log("[v0] No se pudo generar el PDF, enviando solo texto")
      }

      console.log("[v0] Enviando email a:", customerEmail)

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        console.log("[v0] Email enviado exitosamente")
        return true
      } else {
        console.error("[v0] Error al enviar email:", response.statusText)
        return false
      }
    } catch (error) {
      console.error("[v0] Error al enviar email:", error)
      return false
    }
  }

  static async sendTestEmail(testEmail: string, testName: string): Promise<boolean> {
    try {
      console.log("[v0] Enviando email de prueba a:", testEmail)

      const config = this.getConfig()
      if (!config || !config.web3formsKey) {
        console.error("[v0] No hay configuración de email disponible")
        return false
      }

      const testSale = {
        id: "TEST-" + Date.now(),
        timestamp: Date.now(),
        items: [
          {
            product: { name: "Producto de Prueba" },
            quantity: 1,
            unitPrice: 100,
            subtotal: 100,
          },
        ],
        subtotal: 100,
        tax: 18,
        total: 118,
        paymentMethod: "credit",
      }

      return await this.sendInvoiceEmail(testSale, testEmail, testName)
    } catch (error) {
      console.error("[v0] Error al enviar email de prueba:", error)
      return false
    }
  }
}
