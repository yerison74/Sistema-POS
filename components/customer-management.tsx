"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
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
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  CreditCard,
  Lock,
  Upload,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    idCard: "",
    address: "",
    password: "",
  })

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = useCallback(() => {
    try {
      const allCustomers = CustomerManager.getCustomers()
      setCustomers(allCustomers)
      setCurrentPage(1)
    } catch (error) {
      toast({
        title: "Error al cargar clientes",
        description: "No se pudieron cargar los clientes",
      })
    }
  }, [])

  const filteredCustomers = useMemo(() => {
    if (debouncedSearchQuery.trim()) {
      return CustomerManager.searchCustomers(debouncedSearchQuery)
    }
    return customers
  }, [debouncedSearchQuery, customers])

  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    console.log(
      "[v0] Paginación - Página:",
      currentPage,
      "Inicio:",
      startIndex,
      "Fin:",
      endIndex,
      "Total filtrados:",
      filteredCustomers.length,
    )
    return filteredCustomers.slice(startIndex, endIndex)
  }, [filteredCustomers, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredCustomers.length / itemsPerPage)
  }, [filteredCustomers.length, itemsPerPage])

  const customerStats = useMemo(() => {
    const activeCustomers = customers.filter((c) => c.totalPurchases > 0).length
    const newThisMonth = customers.filter((c) => {
      const customerDate = new Date(c.createdAt)
      const now = new Date()
      return customerDate.getMonth() === now.getMonth() && customerDate.getFullYear() === now.getFullYear()
    }).length

    return {
      total: customers.length,
      active: activeCustomers,
      newThisMonth,
    }
  }, [customers])

  const goToPage = useCallback(
    (page: number) => {
      const newPage = Math.max(1, Math.min(page, totalPages))
      console.log("[v0] Navegando a página:", newPage)
      setCurrentPage(newPage)
    },
    [totalPages],
  )

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => {
      const newPage = Math.max(1, prev - 1)
      console.log("[v0] Página anterior:", newPage)
      return newPage
    })
  }, [])

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => {
      const newPage = Math.min(totalPages, prev + 1)
      console.log("[v0] Página siguiente:", newPage)
      return newPage
    })
  }, [totalPages])

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      idCard: "",
      address: "",
      password: "",
    })
  }, [])

  const handleAddCustomer = () => {
    try {
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim() ||
        !formData.idCard.trim() ||
        !formData.password.trim()
      ) {
        toast({
          title: "Campos requeridos",
          description: "Por favor complete todos los campos obligatorios incluyendo la contraseña",
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
        !formData.idCard.trim() ||
        !formData.password.trim()
      ) {
        toast({
          title: "Campos requeridos",
          description: "Por favor complete todos los campos obligatorios incluyendo la contraseña",
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
      password: customer.password,
    })
    setIsEditDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setCsvFile(file)
      previewCsvFile(file)
    } else {
      toast({
        title: "Archivo inválido",
        description: "Por favor seleccione un archivo CSV válido",
      })
    }
  }

  const previewCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 1) {
          toast({
            title: "Archivo vacío",
            description: "El archivo CSV no contiene datos",
          })
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

        if (headers.length === 0) {
          toast({
            title: "Formato inválido",
            description: "No se pudieron leer los encabezados del CSV",
          })
          return
        }

        const relevantColumns = ["EmployeeNumber", "FirstName", "LastName", "Email", "Phone", "Address", "Password"]

        const preview = lines
          .slice(1, 6)
          .map((line) => {
            const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
            const row: any = {}
            headers.forEach((header, index) => {
              if (relevantColumns.includes(header)) {
                row[header] = values[index] || ""
              }
            })
            return row
          })
          .filter((row) => Object.keys(row).length > 0)

        if (preview.length === 0) {
          toast({
            title: "Sin datos relevantes",
            description: "El archivo CSV no contiene las columnas requeridas (EmployeeNumber, FirstName, LastName)",
          })
          return
        }

        setCsvPreview(preview)
      } catch (error) {
        console.error("Error al procesar CSV:", error)
        toast({
          title: "Error al procesar archivo",
          description: "No se pudo leer el archivo CSV correctamente",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleImportCsv = async () => {
    if (!csvFile) {
      toast({
        title: "No hay archivo",
        description: "Por favor seleccione un archivo CSV",
      })
      return
    }

    setIsProcessing(true)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        lines.slice(1).forEach((line, index) => {
          try {
            const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ""
            })

            const firstName = row.FirstName || ""
            const lastName = row.LastName || ""
            const fullName = `${firstName} ${lastName}`.trim()
            const employeeNumber = row.EmployeeNumber || ""

            if (!fullName || !employeeNumber) {
              errors.push(`Fila ${index + 2}: Faltan FirstName, LastName o EmployeeNumber`)
              errorCount++
              return
            }

            const customerData = {
              name: fullName,
              email: row.Email || `${employeeNumber}@empresa.com`,
              phone: row.Phone || row.PhoneNumber || "000-000-0000",
              idCard: employeeNumber,
              address: row.Address || "",
              password: row.Password || employeeNumber,
            }

            CustomerManager.addCustomer(customerData)
            successCount++
          } catch (error) {
            errorCount++
            errors.push(`Fila ${index + 2}: ${error instanceof Error ? error.message : "Error desconocido"}`)
          }
        })

        if (successCount > 0) {
          toast({
            title: "Importación completada",
            description: `${successCount} clientes importados exitosamente${errorCount > 0 ? `, ${errorCount} errores` : ""}`,
          })
          loadCustomers()
        }

        if (errors.length > 0) {
          console.log("Errores de importación:", errors)
          toast({
            title: "Errores en la importación",
            description: `${errorCount} filas no se pudieron procesar. Revise la consola para más detalles.`,
          })
        }

        setCsvFile(null)
        setCsvPreview([])
        setIsImportDialogOpen(false)
      }

      reader.readAsText(csvFile)
    } catch (error) {
      toast({
        title: "Error al procesar archivo",
        description: "No se pudo procesar el archivo CSV",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra la información de tus clientes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200">
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Clientes desde CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Formato requerido del CSV:</h4>
                      <ul className="text-sm text-blue-700 mt-2 space-y-1">
                        <li>
                          • <strong>EmployeeNumber</strong>: Se usará como ID del cliente
                        </li>
                        <li>
                          • <strong>FirstName</strong> y <strong>LastName</strong>: Se combinarán como nombre completo
                        </li>
                        <li>
                          • <strong>Email</strong>: Correo electrónico (opcional, se generará automáticamente)
                        </li>
                        <li>
                          • <strong>Phone</strong>: Teléfono (opcional)
                        </li>
                        <li>
                          • <strong>Address</strong>: Dirección (opcional)
                        </li>
                        <li>
                          • <strong>Password</strong>: Contraseña (opcional, se usará EmployeeNumber por defecto)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
                  <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="mt-1" />
                </div>

                {csvPreview.length > 0 && (
                  <div>
                    <Label>Vista previa (primeras 5 filas - solo columnas relevantes):</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-60">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {csvPreview[0] &&
                                Object.keys(csvPreview[0]).map((header) => (
                                  <th key={header} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                                    {header}
                                  </th>
                                ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((row, index) => (
                              <tr key={index} className="border-b">
                                {row &&
                                  Object.values(row).map((value: any, cellIndex) => (
                                    <td key={cellIndex} className="px-3 py-2 text-gray-600">
                                      {String(value || "")}
                                    </td>
                                  ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleImportCsv}
                    disabled={!csvFile || isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? "Procesando..." : "Importar Clientes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false)
                      setCsvFile(null)
                      setCsvPreview([])
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Contraseña del cliente"
                      className="pl-10"
                    />
                  </div>
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
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{customerStats.total}</p>
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
                <p className="text-2xl font-bold text-gray-900">{customerStats.active}</p>
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
                <p className="text-2xl font-bold text-gray-900">{customerStats.newThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista de Clientes ({filteredCustomers.length})
            {totalPages > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                - Página {currentPage} de {totalPages}
              </span>
            )}
          </CardTitle>
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
            <>
              <div className="overflow-x-auto" key={`page-${currentPage}`}>
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
                    {paginatedCustomers.map((customer) => (
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
                          <span className="text-sm text-gray-500">
                            {CustomerManager.formatDate(customer.createdAt)}
                          </span>
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} de {filteredCustomers.length}{" "}
                    clientes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNumber)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNumber}
                          </Button>
                        )
                      })}
                    </div>

                    <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
              <Label htmlFor="edit-password">Contraseña *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Contraseña del cliente"
                  className="pl-10"
                />
              </div>
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
