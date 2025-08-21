"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { InventoryManager, type Product } from "@/lib/inventory"
import { SalesManager, type SaleItem, type Sale } from "@/lib/sales"
import { BarcodeScanner } from "@/lib/barcode-scanner"
import { SettingsManager } from "@/lib/settings"
import { ReceiptPrinter } from "@/components/receipt-printer"
import { CustomerSelector } from "@/components/customer-selector"
import { CustomerManager, type Customer } from "@/lib/customers"
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Calculator,
  Scan,
  Weight,
  Printer,
  CheckCircle,
  Zap,
  Lock,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export function SalesSystem() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [cart, setCart] = useState<SaleItem[]>([])
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "credit">("cash")
  const [amountPaid, setAmountPaid] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [saleCompleted, setSaleCompleted] = useState(false)
  const [barcodeEnabled, setBarcodeEnabled] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [customerPassword, setCustomerPassword] = useState("")

  const { toast } = useToast()
  const { user } = useAuth()
  const inventoryManager = InventoryManager.getInstance()
  const salesManager = SalesManager.getInstance()
  const barcodeScanner = BarcodeScanner.getInstance()
  const settingsManager = SettingsManager.getInstance()

  useEffect(() => {
    const systemSettings = settingsManager.getSystemSettings()
    setBarcodeEnabled(systemSettings.barcodeEnabled)

    if (systemSettings.barcodeEnabled) {
      barcodeScanner.startListening(handleBarcodeScanned)
    }

    if (systemSettings.keyboardShortcuts) {
      setupKeyboardShortcuts()
    }

    return () => {
      barcodeScanner.stopListening()
    }
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = inventoryManager.searchProducts(searchQuery)
      setSearchResults(results.slice(0, 10))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const setupKeyboardShortcuts = () => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

      switch (event.key.toLowerCase()) {
        case "f1":
          event.preventDefault()
          if (!saleCompleted && cart.length > 0) {
            setIsPaymentDialogOpen(true)
          }
          break
        case "f2":
          event.preventDefault()
          if (saleCompleted) {
            startNewSale()
          }
          break
        case "f3":
          event.preventDefault()
          if (!saleCompleted) {
            clearCart()
          }
          break
        case "escape":
          event.preventDefault()
          setIsPaymentDialogOpen(false)
          setIsReceiptDialogOpen(false)
          break
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }

  const handleBarcodeScanned = (code: string) => {
    if (saleCompleted) return

    const product = inventoryManager.getProductByCode(code)

    if (product) {
      addToCart(product, 1)
      toast({
        title: "Producto escaneado",
        description: `${product.name} agregado al carrito`,
      })
    } else {
      setSearchQuery(code)
      toast({
        title: "Código no encontrado",
        description: `Buscando productos con código: ${code}`,
      })
    }
  }

  const addToCart = (product: Product, quantity = 1, weight?: number) => {
    try {
      const saleItem = salesManager.createSaleItem(product.id, quantity, weight)
      if (!saleItem) {
        toast({
          title: "Error",
          description: "No se pudo agregar el producto al carrito",
        })
        return
      }

      const existingIndex = cart.findIndex((item) => item.productId === product.id)

      if (existingIndex >= 0) {
        const updatedCart = [...cart]
        const existingItem = updatedCart[existingIndex]
        const newQuantity = existingItem.quantity + quantity

        const updatedItem = salesManager.createSaleItem(product.id, newQuantity, weight)
        if (updatedItem) {
          updatedCart[existingIndex] = updatedItem
          setCart(updatedCart)
        }
      } else {
        setCart([...cart, saleItem])
      }

      setSearchQuery("")
      setSearchResults([])

      toast({
        title: "Producto agregado",
        description: `${product.name} agregado al carrito`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar producto",
      })
    }
  }

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const updatedCart = cart.map((item) => {
      if (item.id === itemId) {
        try {
          const updatedItem = salesManager.createSaleItem(item.productId, newQuantity, item.weight)
          return updatedItem || item
        } catch (error) {
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Error al actualizar cantidad",
          })
          return item
        }
      }
      return item
    })

    setCart(updatedCart)
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId))
    toast({
      title: "Producto eliminado",
      description: "Producto eliminado del carrito",
    })
  }

  const clearCart = () => {
    setCart([])
    setSaleCompleted(false)
    setSelectedCustomer(null)
  }

  const { subtotal, tax, total } = salesManager.calculateSaleTotal(cart)

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "El carrito está vacío",
      })
      return
    }

    if (paymentMethod === "cash" && amountPaid < total) {
      toast({
        title: "Error",
        description: "El monto pagado es insuficiente",
      })
      return
    }

    if (paymentMethod === "credit") {
      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Debe seleccionar un cliente para ventas a crédito",
        })
        return
      }
      setIsPasswordDialogOpen(true)
      return
    }

    await processSale()
  }

  const handlePasswordValidation = async () => {
    if (!selectedCustomer) return

    const isValidPassword = CustomerManager.validateCustomerPassword(selectedCustomer.id, customerPassword)

    if (!isValidPassword) {
      toast({
        title: "Contraseña incorrecta",
        description: "La contraseña del cliente no es válida",
      })
      return
    }

    setIsPasswordDialogOpen(false)
    setCustomerPassword("")
    await processSale()
  }

  const processSale = async () => {
    setIsProcessing(true)

    try {
      const customerInfo = selectedCustomer
        ? {
            name: selectedCustomer.name,
            email: selectedCustomer.email,
            idCard: selectedCustomer.idCard,
          }
        : undefined

      const sale = salesManager.processSale(
        cart,
        paymentMethod,
        paymentMethod === "card" || paymentMethod === "credit" ? total : amountPaid,
        user?.name || "unknown",
        user?.name || "Cajero",
        customerInfo,
      )

      if (selectedCustomer) {
        CustomerManager.updateCustomerPurchase(selectedCustomer.id, total)
      }

      setLastSale(sale)
      clearCart()
      setIsPaymentDialogOpen(false)
      setAmountPaid(0)
      setSaleCompleted(true)
      setIsReceiptDialogOpen(true)

      toast({
        title: "Venta procesada",
        description: `Venta #${sale.id} procesada correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error en la venta",
        description: error instanceof Error ? error.message : "Error al procesar la venta",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startNewSale = () => {
    setSaleCompleted(false)
    setLastSale(null)
    setIsReceiptDialogOpen(false)
  }

  return (
    <div className="pos-grid">
      <div className="flex flex-col h-full bg-white">
        <div className="bg-blue-50 border-b border-blue-200 p-2 text-xs text-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Atajos:
              </span>
              <span>F1: Pagar</span>
              <span>F2: Nueva venta</span>
              <span>F3: Limpiar</span>
              {barcodeEnabled && (
                <span className="flex items-center gap-1">
                  <Scan className="w-3 h-3" />
                  Códigos de barras activos
                </span>
              )}
            </div>
          </div>
        </div>

        {saleCompleted && lastSale && (
          <div className="bg-green-50 border-b border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div className="font-medium">Venta Completada</div>
                  <div className="text-sm">
                    Ticket #{lastSale.id} - {SalesManager.formatCurrency(lastSale.total)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setIsReceiptDialogOpen(true)}>
                  <Printer className="w-4 h-4 mr-1" />
                  Reimprimir
                </Button>
                <Button size="sm" onClick={startNewSale}>
                  Nueva Venta (F2)
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-b">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={barcodeEnabled ? "Buscar o escanear código..." : "Buscar producto por nombre o código..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={saleCompleted}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => barcodeScanner.simulateScan("001")}
              disabled={saleCompleted || !barcodeEnabled}
            >
              <Scan className="w-4 h-4" />
            </Button>
          </div>

          {searchResults.length > 0 && !saleCompleted && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((product) => (
                <ProductSearchResult key={product.id} product={product} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Carrito ({cart.length})
              </h3>
              {cart.length > 0 && !saleCompleted && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  Limpiar (F3)
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 && !saleCompleted ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>El carrito está vacío</p>
                <p className="text-sm">
                  {barcodeEnabled ? "Busca productos o escanea códigos" : "Busca productos para agregar"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateCartItemQuantity}
                    onRemove={removeFromCart}
                    disabled={saleCompleted}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border-l flex flex-col">
        <div className="p-4 bg-white border-b">
          <h3 className="font-semibold">Resumen de Venta</h3>
        </div>

        <div className="flex-1 p-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{SalesManager.formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ITBIS (18%):</span>
                  <span className="font-mono">{SalesManager.formatCurrency(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="font-mono">{SalesManager.formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 space-y-2">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={cart.length === 0 || saleCompleted}
              onClick={() => setIsPaymentDialogOpen(true)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Procesar Pago (F1)
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              Total a pagar: <span className="font-bold">{SalesManager.formatCurrency(total)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Método de Pago</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "card" | "credit") => setPaymentMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Tarjeta
                    </div>
                  </SelectItem>
                  <SelectItem value="credit">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Crédito
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
              required={paymentMethod === "credit"}
              label={paymentMethod === "credit" ? "Cliente (Obligatorio)" : "Cliente (Opcional)"}
            />

            {paymentMethod === "cash" && (
              <div>
                <Label htmlFor="amountPaid">Monto Recibido</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  min={total}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number.parseFloat(e.target.value) || 0)}
                  placeholder={total.toFixed(2)}
                />
                {amountPaid >= total && (
                  <p className="text-sm text-green-600 mt-1">
                    Cambio: {SalesManager.formatCurrency(amountPaid - total)}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handlePayment}
                disabled={
                  isProcessing ||
                  (paymentMethod === "cash" && amountPaid < total) ||
                  (paymentMethod === "credit" && !selectedCustomer)
                }
              >
                {isProcessing ? "Procesando..." : "Confirmar Pago"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Validación de Cliente</DialogTitle>
            <DialogDescription>
              Ingrese la contraseña de {selectedCustomer?.name} para confirmar la venta a crédito
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="customerPassword">Contraseña del Cliente</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="customerPassword"
                  type="password"
                  value={customerPassword}
                  onChange={(e) => setCustomerPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customerPassword.trim()) {
                      handlePasswordValidation()
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setIsPasswordDialogOpen(false)
                  setCustomerPassword("")
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handlePasswordValidation}
                disabled={!customerPassword.trim() || isProcessing}
              >
                {isProcessing ? "Validando..." : "Validar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ReceiptPrinter
        sale={lastSale}
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        businessInfo={settingsManager.getBusinessSettings()}
      />
    </div>
  )
}

interface ProductSearchResultProps {
  product: Product
  onAdd: (product: Product, quantity: number, weight?: number) => void
}

function ProductSearchResult({ product, onAdd }: ProductSearchResultProps) {
  const [quantity, setQuantity] = useState(1)
  const [weight, setWeight] = useState<number | undefined>(undefined)

  const handleAdd = () => {
    onAdd(product, quantity, weight)
    setQuantity(1)
    setWeight(undefined)
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{product.name}</span>
            <Badge variant="outline" className="text-xs">
              {product.code}
            </Badge>
            {product.unit !== "piece" && (
              <Badge variant="secondary" className="text-xs">
                {product.unit === "weight" ? <Weight className="w-3 h-3" /> : "Granel"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600">{product.description}</p>
          <p className="text-sm font-mono">{SalesManager.formatCurrency(product.price)}</p>
          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
        </div>

        <div className="flex items-center gap-2">
          {(product.unit === "weight" || product.unit === "bulk") && (
            <div className="flex flex-col gap-1">
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={weight || ""}
                onChange={(e) => setWeight(Number.parseFloat(e.target.value) || undefined)}
                placeholder="Peso/Kg"
                className="w-20 h-8 text-xs"
              />
            </div>
          )}

          {product.unit === "piece" && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                className="w-16 h-8 text-center text-xs"
              />
              <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)} className="h-8 w-8 p-0">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          <Button size="sm" onClick={handleAdd} className="h-8">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

interface CartItemProps {
  item: SaleItem
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  disabled?: boolean
}

function CartItem({ item, onUpdateQuantity, onRemove, disabled = false }: CartItemProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.product.name}</span>
            <Badge variant="outline" className="text-xs">
              {item.product.code}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{SalesManager.formatCurrency(item.unitPrice)}</span>
            {item.weight && <span>× {item.weight}kg</span>}
            {!item.weight && <span>× {item.quantity}</span>}
            <span>=</span>
            <span className="font-medium">{SalesManager.formatCurrency(item.subtotal)}</span>
          </div>
        </div>

        {!disabled && (
          <div className="flex items-center gap-2">
            {item.product.unit === "piece" && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="h-6 w-6 p-0"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(item.id)}
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
