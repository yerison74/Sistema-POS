export interface BusinessSettings {
  name: string
  address: string
  phone: string
  rfc: string
  email?: string
  website?: string
  logo?: string
}

export interface SystemSettings {
  currency: string
  taxRate: number
  receiptFooter: string
  autoBackup: boolean
  soundEnabled: boolean
  keyboardShortcuts: boolean
  barcodeEnabled: boolean
  lowStockThreshold: number
}

export interface POSSettings {
  business: BusinessSettings
  system: SystemSettings
}

const SETTINGS_KEY = "pos-settings"

export class SettingsManager {
  private static instance: SettingsManager
  private settings: POSSettings

  private constructor() {
    this.settings = this.loadSettings()
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager()
    }
    return SettingsManager.instance
  }

  private loadSettings(): POSSettings {
    if (typeof window === "undefined") {
      return this.getDefaultSettings()
    }

    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      try {
        return { ...this.getDefaultSettings(), ...JSON.parse(stored) }
      } catch {
        return this.getDefaultSettings()
      }
    }

    return this.getDefaultSettings()
  }

  private getDefaultSettings(): POSSettings {
    return {
      business: {
        name: "Mi Negocio POS",
        address: "Calle Principal #123, Santo Domingo, República Dominicana",
        phone: "(809) 123-4567",
        rfc: "RNC123456789",
        email: "contacto@minegocio.com",
        website: "www.minegocio.com",
      },
      system: {
        currency: "DOP",
        taxRate: 0.18, // ITBIS en República Dominicana es 18%
        receiptFooter: "¡Gracias por su compra!\nConserve su ticket",
        autoBackup: true,
        soundEnabled: true,
        keyboardShortcuts: true,
        barcodeEnabled: true,
        lowStockThreshold: 10,
      },
    }
  }

  getSettings(): POSSettings {
    return { ...this.settings }
  }

  getBusinessSettings(): BusinessSettings {
    return { ...this.settings.business }
  }

  getSystemSettings(): SystemSettings {
    return { ...this.settings.system }
  }

  updateBusinessSettings(updates: Partial<BusinessSettings>): void {
    this.settings.business = { ...this.settings.business, ...updates }
    this.saveSettings()
  }

  updateSystemSettings(updates: Partial<SystemSettings>): void {
    this.settings.system = { ...this.settings.system, ...updates }
    this.saveSettings()
  }

  private saveSettings(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings))
    }
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2)
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson)
      this.settings = { ...this.getDefaultSettings(), ...imported }
      this.saveSettings()
      return true
    } catch {
      return false
    }
  }

  resetToDefaults(): void {
    this.settings = this.getDefaultSettings()
    this.saveSettings()
  }
}
