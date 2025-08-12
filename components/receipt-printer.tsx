"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SalesManager, type Sale } from "@/lib/sales"
import { SettingsManager } from "@/lib/settings"
import { Printer, Eye, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReceiptPrinterProps {
  sale: Sale | null
  isOpen: boolean
  onClose: () => void
  businessInfo?: {
    name: string
    address: string
    phone: string
    rfc: string
  }
}

export function ReceiptPrinter({ sale, isOpen, onClose, businessInfo }: ReceiptPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const settingsManager = SettingsManager.getInstance()
  const currentBusinessSettings = settingsManager.getBusinessSettings()

  const defaultBusinessInfo = {
    name: currentBusinessSettings.name,
    address: currentBusinessSettings.address,
    phone: currentBusinessSettings.phone,
    rfc: currentBusinessSettings.rfc,
  }

  const business = businessInfo || defaultBusinessInfo

  const handlePrint = async () => {
    if (!sale) return

    setIsPrinting(true)

    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank", "width=300,height=600")
      if (!printWindow) {
        throw new Error("No se pudo abrir la ventana de impresión")
      }

      // Generate the receipt HTML
      const receiptHTML = generateReceiptHTML(sale, business)

      printWindow.document.write(receiptHTML)
      printWindow.document.close()

      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }

      toast({
        title: "Ticket enviado a impresión",
        description: `Ticket #${sale.id} enviado a la impresora`,
      })
    } catch (error) {
      toast({
        title: "Error de impresión",
        description: error instanceof Error ? error.message : "Error al imprimir el ticket",
        variant: "destructive",
      })
    } finally {
      setIsPrinting(false)
    }
  }

  const handlePreview = () => {
    if (!sale) return

    // Open preview in new tab
    const previewWindow = window.open("", "_blank", "width=400,height=700")
    if (!previewWindow) {
      toast({
        title: "Error",
        description: "No se pudo abrir la vista previa",
        variant: "destructive",
      })
      return
    }

    const receiptHTML = generateReceiptHTML(sale, business, true)
    previewWindow.document.write(receiptHTML)
    previewWindow.document.close()
  }

  if (!sale) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Ticket</DialogTitle>
          <DialogDescription>
            Venta #{sale.id} - {SalesManager.formatCurrency(sale.total)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Preview */}
          <Card className="max-h-96 overflow-y-auto">
            <CardContent className="p-4">
              <ReceiptPreview sale={sale} businessInfo={business} />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview} className="flex-1 bg-transparent">
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handlePrint} disabled={isPrinting} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              {isPrinting ? "Imprimiendo..." : "Imprimir"}
            </Button>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
            <X className="w-4 h-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ReceiptPreviewProps {
  sale: Sale
  businessInfo: {
    name: string
    address: string
    phone: string
    rfc: string
  }
}

function ReceiptPreview({ sale, businessInfo }: ReceiptPreviewProps) {
  const settingsManager = SettingsManager.getInstance()
  const systemSettings = settingsManager.getSystemSettings()

  return (
    <div className="receipt-font text-xs leading-tight space-y-1">
      {/* Business Header */}
      <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
        <div className="font-bold text-sm">{businessInfo.name}</div>
        <div>{businessInfo.address}</div>
        <div>{businessInfo.phone}</div>
        <div>{businessInfo.rfc}</div>
      </div>

      {/* Sale Info */}
      <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
        <div className="flex justify-between">
          <span>Ticket:</span>
          <span>#{sale.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{new Date(sale.timestamp).toLocaleDateString("es-DO", { timeZone: "America/Santo_Domingo" })}</span>
        </div>
        <div className="flex justify-between">
          <span>Hora:</span>
          <span>{SalesManager.formatTime(sale.timestamp)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cajero:</span>
          <span>{sale.cashierName}</span>
        </div>
      </div>

      {/* Items */}
      <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
        {sale.items.map((item, index) => (
          <div key={index} className="mb-1">
            <div className="flex justify-between">
              <span className="flex-1 truncate">{item.product.name}</span>
              <span>{SalesManager.formatCurrency(item.subtotal)}</span>
            </div>
            <div className="text-gray-600 text-xs">
              <span>
                {item.weight ? `${item.weight}kg` : `${item.quantity} pz`} ×{" "}
                {SalesManager.formatCurrency(item.unitPrice)}
              </span>
              {item.product.code && <span className="ml-2">({item.product.code})</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{SalesManager.formatCurrency(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>ITBIS (18%):</span>
          <span>{SalesManager.formatCurrency(sale.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-400 pt-1">
          <span>TOTAL:</span>
          <span>{SalesManager.formatCurrency(sale.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="border-t border-dashed border-gray-400 pt-2 mt-2">
        <div className="flex justify-between">
          <span>Método de pago:</span>
          <span>{sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}</span>
        </div>
        {sale.paymentMethod === "cash" && (
          <>
            <div className="flex justify-between">
              <span>Recibido:</span>
              <span>{SalesManager.formatCurrency(sale.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cambio:</span>
              <span>{SalesManager.formatCurrency(sale.change)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center border-t border-dashed border-gray-400 pt-2 mt-2 text-xs">
        {systemSettings.receiptFooter ? (
          <div className="whitespace-pre-line">{systemSettings.receiptFooter}</div>
        ) : (
          <>
            <div>¡Gracias por su compra!</div>
            <div>Conserve su ticket</div>
          </>
        )}
      </div>
    </div>
  )
}

function generateReceiptHTML(
  sale: Sale,
  businessInfo: {
    name: string
    address: string
    phone: string
    rfc: string
  },
  isPreview = false,
): string {
  const settingsManager = SettingsManager.getInstance()
  const systemSettings = settingsManager.getSystemSettings()

  const styles = `
    <style>
      @media print {
        body { margin: 0; padding: 0; }
        .no-print { display: none; }
      }
      
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.2;
        max-width: ${isPreview ? "400px" : "300px"};
        margin: 0 auto;
        padding: ${isPreview ? "20px" : "10px"};
        background: ${isPreview ? "#f9f9f9" : "white"};
      }
      
      .receipt {
        background: white;
        padding: ${isPreview ? "20px" : "0"};
        ${isPreview ? "border: 1px solid #ddd; border-radius: 8px;" : ""}
      }
      
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .border-dashed { 
        border-bottom: 1px dashed #666; 
        padding-bottom: 8px; 
        margin-bottom: 8px; 
      }
      .flex { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 2px;
      }
      .item-line {
        margin-bottom: 4px;
      }
      .item-details {
        color: #666;
        font-size: 10px;
        margin-left: 4px;
      }
      .whitespace-pre-line {
        white-space: pre-line;
      }
      
      ${
        isPreview
          ? `
        .no-print {
          text-align: center;
          margin-top: 20px;
          padding: 10px;
          background: #e3f2fd;
          border-radius: 4px;
        }
      `
          : ""
      }
    </style>
  `

  const footerContent = systemSettings.receiptFooter
    ? `<div class="whitespace-pre-line">${systemSettings.receiptFooter}</div>`
    : `<div>¡Gracias por su compra!</div><div>Conserve su ticket</div>`

  const receiptContent = `
    <div class="receipt">
      <!-- Business Header -->
      <div class="center border-dashed">
        <div class="bold" style="font-size: 14px;">${businessInfo.name}</div>
        <div>${businessInfo.address}</div>
        <div>${businessInfo.phone}</div>
        <div>${businessInfo.rfc}</div>
      </div>

      <!-- Sale Info -->
      <div class="border-dashed">
        <div class="flex">
          <span>Ticket:</span>
          <span>#${sale.id}</span>
        </div>
        <div class="flex">
          <span>Fecha:</span>
          <span>${new Date(sale.timestamp).toLocaleDateString("es-DO", { timeZone: "America/Santo_Domingo" })}</span>
        </div>
        <div class="flex">
          <span>Hora:</span>
          <span>${SalesManager.formatTime(sale.timestamp)}</span>
        </div>
        <div class="flex">
          <span>Cajero:</span>
          <span>${sale.cashierName}</span>
        </div>
      </div>

      <!-- Items -->
      <div class="border-dashed">
        ${sale.items
          .map(
            (item) => `
          <div class="item-line">
            <div class="flex">
              <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${item.product.name}</span>
              <span>${SalesManager.formatCurrency(item.subtotal)}</span>
            </div>
            <div class="item-details">
              ${item.weight ? `${item.weight}kg` : `${item.quantity} pz`} × ${SalesManager.formatCurrency(item.unitPrice)}
              ${item.product.code ? ` (${item.product.code})` : ""}
            </div>
          </div>
        `,
          )
          .join("")}
      </div>

      <!-- Totals -->
      <div>
        <div class="flex">
          <span>Subtotal:</span>
          <span>${SalesManager.formatCurrency(sale.subtotal)}</span>
        </div>
        <div class="flex">
          <span>ITBIS (18%):</span>
          <span>${SalesManager.formatCurrency(sale.tax)}</span>
        </div>
        <div class="flex bold" style="border-top: 1px dashed #666; padding-top: 4px; font-size: 14px;">
          <span>TOTAL:</span>
          <span>${SalesManager.formatCurrency(sale.total)}</span>
        </div>
      </div>

      <!-- Payment Info -->
      <div style="border-top: 1px dashed #666; padding-top: 8px; margin-top: 8px;">
        <div class="flex">
          <span>Método de pago:</span>
          <span>${sale.paymentMethod === "cash" ? "Efectivo" : "Tarjeta"}</span>
        </div>
        ${
          sale.paymentMethod === "cash"
            ? `
        <div class="flex">
          <span>Recibido:</span>
          <span>${SalesManager.formatCurrency(sale.amountPaid)}</span>
        </div>
        <div class="flex">
          <span>Cambio:</span>
          <span>${SalesManager.formatCurrency(sale.change)}</span>
        </div>
        `
            : ""
        }
      </div>

      <!-- Footer -->
      <div class="center" style="border-top: 1px dashed #666; padding-top: 8px; margin-top: 8px; font-size: 11px;">
        ${footerContent}
      </div>
    </div>

    ${
      isPreview
        ? `
    <div class="no-print">
      <p><strong>Vista Previa del Ticket</strong></p>
      <p>Esta es una vista previa. Use Ctrl+P para imprimir.</p>
    </div>
    `
        : ""
    }
  `

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket #${sale.id}</title>
      ${styles}
    </head>
    <body>
      ${receiptContent}
    </body>
    </html>
  `
}

// Utility function to print a sale receipt
export function printReceipt(sale: Sale, businessInfo?: any) {
  const settingsManager = SettingsManager.getInstance()
  const currentBusinessSettings = settingsManager.getBusinessSettings()

  const defaultBusinessInfo = {
    name: currentBusinessSettings.name,
    address: currentBusinessSettings.address,
    phone: currentBusinessSettings.phone,
    rfc: currentBusinessSettings.rfc,
  }

  const business = businessInfo || defaultBusinessInfo
  const receiptHTML = generateReceiptHTML(sale, business)

  const printWindow = window.open("", "_blank", "width=300,height=600")
  if (printWindow) {
    printWindow.document.write(receiptHTML)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }
}
