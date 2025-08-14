"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { LogOut, User, Store, Package, BarChart3, Settings, Users } from "lucide-react"
import { InventoryManagement } from "@/components/inventory-management"
import { SalesSystem } from "@/components/sales-system"
import ReportsDashboard from "@/components/reports-dashboard"
import { SettingsPanel } from "@/components/settings-panel"
import CustomerManagement from "@/components/customer-management"

export function POSLayout() {
  const { logout, user } = useAuth()
  const [activeTab, setActiveTab] = useState("sales")

  const tabs = [
    { id: "sales", label: "Ventas", icon: Store },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "customers", label: "Clientes", icon: Users },
    { id: "reports", label: "Reportes", icon: BarChart3 },
    { id: "settings", label: "Configuración", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sistema POS</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user?.name}</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {user?.role === "admin" ? "Admin" : "Cajero"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        <nav className="mt-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      <main className={activeTab === "sales" ? "" : "p-6"}>
        {activeTab === "sales" && <SalesSystem />}

        {activeTab === "inventory" && <InventoryManagement />}

        {activeTab === "customers" && <CustomerManagement />}

        {activeTab === "reports" && <ReportsDashboard />}

        {activeTab === "settings" && <SettingsPanel />}
      </main>
    </div>
  )
}
