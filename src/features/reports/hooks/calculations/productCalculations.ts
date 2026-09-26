export interface ProductCalcParams {
  productRevenueStats: any[];
  productList: any[];
}

export const calculateProductStats = (orders: any[], params: ProductCalcParams): any[] => {
  if (params.productRevenueStats.length > 0) {
    return params.productRevenueStats.map((p: any) => ({
      id: p.itemCode,
      name: p.itemName,
      soldQty: p.quantity,
      revenue: p.revenue
    }));
  }

  return params.productList.map((p: any) => {
    const allItems = orders.flatMap((o: any) => o.details || o.items || []);
    const soldItems = allItems.filter((item: any) => item.item_type === 'PRODUCT' && item.item_id === p.id);
    const soldQty = soldItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    const revenue = soldItems.reduce((sum: number, item: any) => {
      if (item.total_price != null) return sum + item.total_price;
      return sum + ((item.quantity || 0) * (item.price || item.pre_tax_price || item.unit_price || p.price || 0));
    }, 0);
    return { ...p, soldQty, revenue };
  })
    .filter(p => p.soldQty > 0 || p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
};
