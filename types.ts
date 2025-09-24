
export interface AdData {
  date: string;
  product: string;
  adCost: number;
  revenue: number;
  orders: number;
  operatingCost: number;
  profit: number;
  profitMargin: number;
  adCostPerOrder: number;
  profitPerOrder: number;
}

export interface ProductSummaryData {
    product: string;
    adCost: number;
    revenue: number;
    profit: number;
    orders: number;
    operatingCost: number;
    adCostPerOrder: number;
    profitPerOrder: number;
}