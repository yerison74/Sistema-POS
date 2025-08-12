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
import { SettingsManager, type BusinessSettings, type SystemSettings } from "@/lib/settings"
import { BackupManager } from "@/lib/backup"
import { BarcodeScanner } from "@/lib/barcode-scanner"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsPanel() {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({} as BusinessSettings)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({} as SystemSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [isTestingBarcode, setIsTestingBarcode] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<string>("")

  const { toast } = useToast()
  const settingsManager = SettingsManager.getInstance()
  const backupManager = BackupManager.getInstance()
  const barcodeScanner = BarcodeScanner.getInstance()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    setBusinessSettings(settingsManager.getBusinessSettings())
    setSystemSettings(settingsManager.getSystemSettings())
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
