"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SettingsManager, type BusinessSettings, type SystemSettings } from "@/lib/settings"
import { BackupManager } from "@/lib/backup"
import { BarcodeScanner } from "@/lib/barcode-scanner"
import { UserManager, type User } from "@/lib/users"
import { useAuth } from "@/components/auth-provider"
import {
  Building2,
  Settings,
  Download,
  Upload,
  RotateCcw,
  Save,
  Scan,
  Volume2,
  VolumeX,
  Keyboard,
  Shield,
  Database,
  Users,
  Plus,
  Edit,
  Trash2,
  Key,
  UserCheck,
  UserX,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsPanel() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({} as BusinessSettings)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({} as SystemSettings)
  const [users, setUsers] = useState<User[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingBarcode, setIsTestingBarcode] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<string>("")

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "cashier" as "admin" | "cashier",
  })
  const [passwordForm, setPasswordForm] = useState({
    userId: "",
    newPassword: "",
    confirmPassword: "",
  })

  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const settingsManager = SettingsManager.getInstance()
  const backupManager = BackupManager.getInstance()
  const barcodeScanner = BarcodeScanner.getInstance()

  useEffect(() => {
    loadSettings()
    loadUsers()
  }, [])

  const loadSettings = () => {
    setBusinessSettings(settingsManager.getBusinessSettings())
    setSystemSettings(settingsManager.getSystemSettings())
  }

  const loadUsers = () => {
    setUsers(UserManager.getUsers())
  }

  const handleCreateUser = () => {
    setEditingUser(null)
    setUserForm({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "cashier",
    })
    setIsUserDialogOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: "",
      name: user.name,
      email: user.email || "",
      role: user.role,
    })
    setIsUserDialogOpen(true)
  }

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Editar usuario existente
        const updates: any = {
          username: userForm.username,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
        }

        if (userForm.password) {
          updates.password = userForm.password
        }

        UserManager.updateUser(editingUser.id, updates)
        toast({
          title: "Usuario actualizado",
          description: "El usuario se ha actualizado correctamente",
        })
      } else {
        // Crear nuevo usuario
        UserManager.createUser({
          username: userForm.username,
          password: userForm.password,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          isActive: true,
        })
        toast({
          title: "Usuario creado",
          description: "El nuevo usuario se ha creado correctamente",
        })
      }

      loadUsers()
      setIsUserDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el usuario",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      try {
        UserManager.deleteUser(userId)
        loadUsers()
        toast({
          title: "Usuario eliminado",
          description: "El usuario se ha eliminado correctamente",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "No se pudo eliminar el usuario",
        })
      }
    }
  }

  const handleToggleUserStatus = async (userId: string) => {
    try {
      UserManager.toggleUserStatus(userId)
      loadUsers()
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar el estado del usuario",
      })
    }
  }

  const handleChangePassword = (userId: string) => {
    setPasswordForm({
      userId,
      newPassword: "",
      confirmPassword: "",
    })
    setIsPasswordDialogOpen(true)
  }

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
      })
      return
    }

    try {
      UserManager.changePassword(passwordForm.userId, passwordForm.newPassword)
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña se ha actualizado correctamente",
      })
      setIsPasswordDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
      })
    }
  }

  const handleSaveBusinessSettings = async () => {
    setIsSaving(true)
    try {
      settingsManager.updateBusinessSettings(businessSettings)
      toast({
        title: "Configuración guardada",
        description: "La información del negocio se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSystemSettings = async () => {
    setIsSaving(true)
    try {
      settingsManager.updateSystemSettings(systemSettings)
      toast({
        title: "Configuración guardada",
        description: "La configuración del sistema se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportBackup = () => {
    try {
      backupManager.downloadBackup()
      toast({
        title: "Respaldo exportado",
        description: "El archivo de respaldo se ha descargado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el respaldo",
        variant: "destructive",
      })
    }
  }

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const success = backupManager.restoreBackup(content)

        if (success) {
          toast({
            title: "Respaldo restaurado",
            description: "Los datos se han restaurado correctamente. Recarga la página para ver los cambios.",
          })
        } else {
          throw new Error("Invalid backup file")
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "El archivo de respaldo no es válido",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ""
  }

  const handleResetSettings = () => {
    if (confirm("¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?")) {
      settingsManager.resetToDefaults()
      loadSettings()
      toast({
        title: "Configuración restablecida",
        description: "Toda la configuración se ha restablecido a los valores predeterminados",
      })
    }
  }

  const handleTestBarcode = () => {
    if (isTestingBarcode) {
      barcodeScanner.stopListening()
      setIsTestingBarcode(false)
      toast({
        title: "Prueba finalizada",
        description: "La prueba del lector de códigos de barras se ha detenido",
      })
    } else {
      setIsTestingBarcode(true)
      setLastScanResult("")
      barcodeScanner.startListening((code) => {
        setLastScanResult(code)
        toast({
          title: "Código escaneado",
          description: `Código detectado: ${code}`,
        })
      })
      toast({
        title: "Prueba iniciada",
        description: "Escanea un código de barras o escribe un código seguido de Enter",
      })
    }
  }

  const handleSimulateBarcode = () => {
    const testCode = "123456789"
    barcodeScanner.simulateScan(testCode)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h2>
        <p className="text-gray-600">Administra la configuración del negocio y del sistema</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">
            <Building2 className="w-4 h-4 mr-2" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
          {currentUser?.role === "admin" && (
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
          )}
          <TabsTrigger value="barcode">
            <Scan className="w-4 h-4 mr-2" />
            Códigos de Barras
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            Respaldos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Negocio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Nombre del Negocio</Label>
                  <Input
                    id="businessName"
                    value={businessSettings.name || ""}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessPhone">Teléfono</Label>
                  <Input
                    id="businessPhone"
                    value={businessSettings.phone || ""}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessAddress">Dirección</Label>
                <Textarea
                  id="businessAddress"
                  value={businessSettings.address || ""}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessRFC">RFC</Label>
                  <Input
                    id="businessRFC"
                    value={businessSettings.rfc || ""}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, rfc: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessSettings.email || ""}
                    onChange={(e) => setBusinessSettings({ ...businessSettings, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="businessWebsite">Sitio Web</Label>
                <Input
                  id="businessWebsite"
                  value={businessSettings.website || ""}
                  onChange={(e) => setBusinessSettings({ ...businessSettings, website: e.target.value })}
                />
              </div>

              <Button onClick={handleSaveBusinessSettings} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    value={systemSettings.currency || ""}
                    onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tasa de ITBIS (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={systemSettings.taxRate ? (systemSettings.taxRate * 100).toFixed(2) : ""}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        taxRate: Number.parseFloat(e.target.value) / 100 || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lowStockThreshold">Umbral de Stock Bajo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="1"
                  value={systemSettings.lowStockThreshold || ""}
                  onChange={(e) =>
                    setSystemSettings({
                      ...systemSettings,
                      lowStockThreshold: Number.parseInt(e.target.value) || 10,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="receiptFooter">Pie de Ticket</Label>
                <Textarea
                  id="receiptFooter"
                  value={systemSettings.receiptFooter || ""}
                  onChange={(e) => setSystemSettings({ ...systemSettings, receiptFooter: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <Label htmlFor="autoBackup">Respaldo Automático</Label>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={systemSettings.autoBackup || false}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, autoBackup: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {systemSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <Label htmlFor="soundEnabled">Sonidos del Sistema</Label>
                  </div>
                  <Switch
                    id="soundEnabled"
                    checked={systemSettings.soundEnabled || false}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, soundEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Keyboard className="w-4 h-4" />
                    <Label htmlFor="keyboardShortcuts">Atajos de Teclado</Label>
                  </div>
                  <Switch
                    id="keyboardShortcuts"
                    checked={systemSettings.keyboardShortcuts || false}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, keyboardShortcuts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Scan className="w-4 h-4" />
                    <Label htmlFor="barcodeEnabled">Lector de Códigos de Barras</Label>
                  </div>
                  <Switch
                    id="barcodeEnabled"
                    checked={systemSettings.barcodeEnabled || false}
                    onCheckedChange={(checked) => setSystemSettings({ ...systemSettings, barcodeEnabled: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSystemSettings} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {currentUser?.role === "admin" && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Gestión de Usuarios</CardTitle>
                <Button onClick={handleCreateUser}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.name}</h4>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              user.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.role === "admin" ? "Administrador" : "Cajero"}
                          </span>
                          {!user.isActive && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactivo</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                        {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleChangePassword(user.id)}>
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleUserStatus(user.id)}>
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Diálogo para crear/editar usuario */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email (Opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rol</Label>
                    <Select
                      value={userForm.role}
                      onValueChange={(value: "admin" | "cashier") => setUserForm({ ...userForm, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cashier">Cajero</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">
                      {editingUser ? "Nueva Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveUser}>{editingUser ? "Actualizar" : "Crear"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Diálogo para cambiar contraseña */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cambiar Contraseña</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSavePassword}>Cambiar Contraseña</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        )}

        <TabsContent value="barcode" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Códigos de Barras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Scan className="h-4 w-4" />
                <AlertDescription>
                  El sistema puede detectar códigos de barras a través del teclado. Los lectores de códigos de barras
                  USB funcionan como teclados y envían los datos seguidos de Enter.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleTestBarcode}
                    variant={isTestingBarcode ? "destructive" : "default"}
                    className="flex-1"
                  >
                    <Scan className="w-4 h-4 mr-2" />
                    {isTestingBarcode ? "Detener Prueba" : "Probar Lector"}
                  </Button>

                  {isTestingBarcode && (
                    <Button onClick={handleSimulateBarcode} variant="outline">
                      Simular Escaneo
                    </Button>
                  )}
                </div>

                {isTestingBarcode && (
                  <Alert>
                    <AlertDescription>
                      Modo de prueba activo. Escanea un código de barras o escribe un código seguido de Enter.
                    </AlertDescription>
                  </Alert>
                )}

                {lastScanResult && (
                  <Alert>
                    <AlertDescription>
                      <strong>Último código escaneado:</strong> {lastScanResult}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Instrucciones:</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Conecta tu lector de códigos de barras USB</li>
                  <li>El lector debe estar configurado para enviar Enter después del código</li>
                  <li>En el sistema de ventas, el cursor debe estar fuera de campos de texto</li>
                  <li>Los códigos escaneados buscarán automáticamente productos</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Respaldos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Los respaldos incluyen todos los productos, ventas, configuración y datos del sistema. Se recomienda
                  hacer respaldos regulares.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleExportBackup} className="h-20 flex-col">
                  <Download className="w-6 h-6 mb-2" />
                  <span>Exportar Respaldo</span>
                  <span className="text-xs opacity-75">Descargar archivo .json</span>
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                    id="backup-import"
                  />
                  <Button
                    onClick={() => document.getElementById("backup-import")?.click()}
                    variant="outline"
                    className="h-20 flex-col w-full"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span>Importar Respaldo</span>
                    <span className="text-xs opacity-75">Restaurar desde archivo</span>
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4">
                <Button
                  onClick={handleResetSettings}
                  variant="outline"
                  className="w-full border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 bg-transparent"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restablecer Configuración
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Esta acción restablecerá toda la configuración a los valores predeterminados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
