export type SalesPeriod = "daily" | "monthly" | "yearly"

export type SalesSummary = {
  period: string
  totalAmount: number
  saleCount: number
  treatmentCount: number
  discountTotal: number
  netAmount: number
}

export type MenuSalesBreakdown = {
  menuItemId: string
  menuItemName: string
  count: number
  totalAmount: number
}

export type SalesReport = {
  summary: SalesSummary
  byMenu: MenuSalesBreakdown[]
  dailyTotals?: { date: string; amount: number }[]
  monthlyTotals?: { month: string; amount: number }[]
}
