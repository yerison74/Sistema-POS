"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InventoryManager, type Product } from "@/lib/inventory"
import { SalesManager } from "@/lib/sales"
import { Plus, Search, Edit, Trash2, AlertTriangle, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categories] = useState<string[]>([])
  const { toast } = useToast()

  const inventoryManager = InventoryManager.getInstance()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = () => {
    const allProducts = inventoryManager.getAllProducts()
    const lowStock = inventoryManager.getLowStockProducts()
    setProducts(allProducts)
    setLowStockProducts(lowStock)
  }

  const filteredProducts = searchQuery ? inventoryManager.searchProducts(searchQuery) : products

  const handleAddProduct = (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      inventoryManager.addProduct(productData)
      loadProducts()
      setIsAddDialogOpen(false)
      toast({
        title: "Producto agregado",
        description: "El producto se ha agregado correctamente al inventario.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto.",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (id: string, updates: Partial<Product>) => {
    try {
      inventoryManager.updateProduct(id, updates)
      loadProducts()
      setEditingProduct(null)
      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = (id: string) => {
    try {
      inventoryManager.deleteProduct(id)
      loadProducts()
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado del inventario.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Stock Crítico:</strong> {lowStockProducts.length} producto(s) con stock bajo:{" "}
            {lowStockProducts.map((p) => p.name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Inventario</h2>
          <p className="text-gray-600">Administra productos, stock y categorías</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              <DialogDescription>Completa la información del producto para agregarlo al inventario.</DialogDescription>
            </DialogHeader>
            <ProductForm onSubmit={handleAddProduct} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, código o descripción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Productos ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell className="font-mono">{SalesManager.formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={product.stock <= product.minStock ? "text-orange-600 font-medium" : ""}>
                          {product.stock}
                        </span>
                        {product.stock <= product.minStock && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.unit === "piece" ? "default" : product.unit === "weight" ? "secondary" : "outline"
                        }
                      >
                        {product.unit === "piece" ? "Pieza" : product.unit === "weight" ? "Peso" : "Granel"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>Modifica la información del producto.</DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSubmit={(data) => handleEditProduct(editingProduct.id, data)}
              onCancel={() => setEditingProduct(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

interface ProductFormProps {
  product?: Product
  onSubmit: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  onCancel: () => void
}

function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    code: product?.code || "",
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    minStock: product?.minStock || 5,
    category: product?.category || "",
    unit: product?.unit || ("piece" as const),
    weight: product?.weight || undefined,
    isActive: product?.isActive ?? true,
  })

  const categories = InventoryManager.getInstance().getCategories()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const formatPriceDisplay = (value: number) => {
    return value > 0 ? SalesManager.formatCurrency(value) : ""
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code">Código</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="name">Nombre del Producto</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Precio</Label>
          <div className="relative">
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) || 0 })}
              required
              className="pr-16"
            />
            {formData.price > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                {formatPriceDisplay(formData.price)}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="unit">Tipo de Venta</Label>
          <Select
            value={formData.unit}
            onValueChange={(value: "piece" | "weight" | "bulk") => setFormData({ ...formData, unit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="piece">Por Pieza</SelectItem>
              <SelectItem value="weight">Por Peso</SelectItem>
              <SelectItem value="bulk">A Granel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Stock Actual</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
        <div>
          <Label htmlFor="minStock">Stock Mínimo</Label>
          <Input
            id="minStock"
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: Number.parseInt(e.target.value) || 0 })}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {product ? "Actualizar" : "Agregar"} Producto
        </Button>
      </div>
    </form>
  )
}
