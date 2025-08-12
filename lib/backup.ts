import { InventoryManager } from "./inventory"
import { SalesManager } from "./sales"
import { SettingsManager } from "./settings"

export interface BackupData {
  version: string
  timestamp: string
  inventory: any
  sales: any
  settings: any
}

export class BackupManager {
  private static instance: BackupManager

  private constructor() {}

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager()
    }
    return BackupManager.instance
  }

  createBackup(): BackupData {
    const inventoryManager = InventoryManager.getInstance()
    const salesManager = SalesManager.getInstance()
    const settingsManager = SettingsManager.getInstance()

    return {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      inventory: {
        products: inventoryManager.getAllProducts(),
        categories: inventoryManager.getCategories(),
      },
      sales: {
        allSales: salesManager.getAllSales(),
        dailySales: salesManager.getAllDailySales(),
      },
      settings: settingsManager.getSettings(),
    }
  }

  exportBackup(): string {
    const backup = this.createBackup()
    return JSON.stringify(backup, null, 2)
  }

  downloadBackup(): void {
    const backup = this.exportBackup()
    const blob = new Blob([backup], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `pos-backup-${new Date().toISOString().split("T")[0]}.json`
    a.click()

    URL.revokeObjectURL(url)
  }

  restoreBackup(backupJson: string): boolean {
    try {
      const backup: BackupData = JSON.parse(backupJson)

      // Validate backup structure
      if (!backup.version || !backup.inventory || !backup.sales || !backup.settings) {
        throw new Error("Invalid backup format")
      }

      // Store in localStorage (this would normally restore to the actual storage)
      if (typeof window !== "undefined") {
        localStorage.setItem("pos-inventory", JSON.stringify(backup.inventory))
        localStorage.setItem("pos-sales", JSON.stringify(backup.sales.allSales))
        localStorage.setItem("pos-daily-sales", JSON.stringify(backup.sales.dailySales))
        localStorage.setItem("pos-settings", JSON.stringify(backup.settings))
      }

      return true
    } catch {
      return false
    }
  }

  autoBackup(): void {
    if (typeof window === "undefined") return

    const settingsManager = SettingsManager.getInstance()
    const settings = settingsManager.getSystemSettings()

    if (settings.autoBackup) {
      const lastBackup = localStorage.getItem("pos-last-backup")
      const today = new Date().toDateString()

      if (lastBackup !== today) {
        const backup = this.exportBackup()
        localStorage.setItem("pos-auto-backup", backup)
        localStorage.setItem("pos-last-backup", today)
      }
    }
  }
}
