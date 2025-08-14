"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { CustomerManager, type Customer } from "@/lib/customers"
import { Search, Plus, Edit, Trash2, User, Mail, Phone, CreditCard } from "lucide-react"

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: "",
    address: "",
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    try {
      const allCustomers = CustomerManager.getCustomers()
      setCustomers(allCustomers)
    } catch (error) {
      toast({
        title: "Error al cargar clientes",
        description: "No se pudieron cargar los clientes",
      })
    }
  }

  const filteredCustomers = searchQuery ? CustomerManager.searchCustomers(searchQuery) : customers

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

      CustomerManager.addCustomer(formData)
      loadCustomers()
      resetForm()
      setIsAddDialogOpen(false)
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha agregado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error al agregar cliente",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    }
  }

  const handleEditCustomer = () => {
    try {
      if (
        !editingCustomer ||
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.idCard.trim()
      ) {
        toast({
          title: "Campos requeridos",
          description: "Por favor complete todos los campos obligatorios",
        })
        return
      }

      CustomerManager.updateCustomer(editingCustomer.id, formData)
      loadCustomers()
      resetForm()
      setIsEditDialogOpen(false)
      setEditingCustomer(null)
      toast({
        title: "Cliente actualizado",
        description: "Los datos del cliente se han actualizado exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error al actualizar cliente",
        description: error instanceof Error ? error.message : "Error desconocido",
      })
    }
  }

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`¿Está seguro de eliminar al cliente ${customer.name}?`)) {
      try {
        CustomerManager.deleteCustomer(customer.id)
        loadCustomers()
        toast({
          title: "Cliente eliminado",
          description: "El cliente se ha eliminado exitosamente",
        })
      } catch (error) {
        toast({
          title: "Error al eliminar cliente",
          description: "No se pudo eliminar el cliente",
        })
      }
    }
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      idCard: customer.idCard,
      address: customer.address || "",
    })
    setIsEditDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Cliente
            </Button>
          </DialogTrigger>
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
                  Agregar Cliente
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, correo, teléfono o cédula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clientes Activos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.filter((c) => c.totalPurchases > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nuevos Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    customers.filter((c) => {
                      const customerDate = new Date(c.createdAt)
                      const now = new Date()
                      return (
                        customerDate.getMonth() === now.getMonth() && customerDate.getFullYear() === now.getFullYear()
                      )
                    }).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? "No se encontraron clientes" : "No hay clientes registrados"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Total Gastado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          {customer.address && <p className="text-sm text-gray-500">{customer.address}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.idCard}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{customer.totalPurchases}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {CustomerManager.formatCurrency(customer.totalSpent)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{CustomerManager.formatDate(customer.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(customer)}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre Completo *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del cliente"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Correo Electrónico *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Teléfono *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(809) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="edit-idCard">Cédula/ID *</Label>
              <Input
                id="edit-idCard"
                value={formData.idCard}
                onChange={(e) => setFormData((prev) => ({ ...prev, idCard: e.target.value }))}
                placeholder="123-4567890-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Dirección (Opcional)</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección del cliente"
                rows={2}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleEditCustomer} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Actualizar Cliente
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
