"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { CustomerManager, type Customer } from "@/lib/customers"
import { Search, Plus, User, Mail, Phone, UserPlus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface CustomerSelectorProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
  required?: boolean
  label?: string
}

export function CustomerSelector({
  selectedCustomer,
  onCustomerSelect,
  required = false,
  label = "Cliente",
}: CustomerSelectorProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: "",
    address: "",
  })

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = CustomerManager.searchCustomers(searchQuery)
      setSearchResults(results.slice(0, 10))
    } else {
      setSearchResults(CustomerManager.getCustomers().slice(0, 10))
    }
  }, [searchQuery])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      idCard: "",
      address: "",
    })
  }

  const handleAddCustomer = () => {
    try {
      if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.idCard.trim()) {
        toast({
          title: "Campos requeridos",
          description: "Por favor complete todos los campos obligatorios",
        })
        return
      }

      const newCustomer = CustomerManager.addCustomer(formData)
      onCustomerSelect(newCustomer)
      resetForm()
      setIsAddOpen(false)
      setIsSearchOpen(false)
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha agregado y seleccionado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error al agregar cliente",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer)
    setIsSearchOpen(false)
    setSearchQuery("")
  }

  const handleClearCustomer = () => {
    onCustomerSelect(null)
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {selectedCustomer ? (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedCustomer.name}</span>
                <Badge variant="outline" className="text-xs">
                  {selectedCustomer.idCard}
                </Badge>
              </div>
              <div className="mt-1 space-y-1">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Mail className="w-3 h-3" />
                  <span>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Phone className="w-3 h-3" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)}>
                Cambiar
              </Button>
              {!required && (
                <Button variant="outline" size="sm" onClick={handleClearCustomer}>
                  Quitar
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Cliente
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsAddOpen(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      )}

      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, correo, teléfono o cédula..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => {
                  resetForm()
                  setIsAddOpen(true)
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron clientes</p>
                </div>
              ) : (
                searchResults.map((customer) => (
                  <Card
                    key={customer.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{customer.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {customer.idCard}
                          </Badge>
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{customer.totalPurchases} compras</div>
                        <div className="font-medium text-green-600">
                          {CustomerManager.formatCurrency(customer.totalSpent)}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(809) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="idCard">Cédula/ID *</Label>
              <Input
                id="idCard"
                value={formData.idCard}
                onChange={(e) => setFormData((prev) => ({ ...prev, idCard: e.target.value }))}
                placeholder="123-4567890-1"
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección (Opcional)</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección del cliente"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddCustomer} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Agregar y Seleccionar
              </Button>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
