import React, { useState, useEffect } from 'react';
import { salesService } from '../../../api/salesService';
import { Product, StockMovementLog } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';

export const useInventory = (initialTab: string) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockMovementLog[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      const res = await salesService.fetchProducts();
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
      }
    };
    loadProducts();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [selectedProductForIn, setSelectedProductForIn] = useState<Product | null>(null);

  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('DRINK');
  const [newUnit, setNewUnit] = useState('Chai');
  const [newCostPrice, setNewCostPrice] = useState<number>(5000);
  const [newPrice, setNewPrice] = useState<number>(15000);
  const [newTaxPercent, setNewTaxPercent] = useState<number>(10);
  const [newStock, setNewStock] = useState<number>(100);
  const [newMinAlert, setNewMinAlert] = useState<number>(20);
  const [newSupplier, setNewSupplier] = useState('');

  const [movementType, setMovementType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [movementQty, setMovementQty] = useState<number>(50);
  const [movementUnitPrice, setMovementUnitPrice] = useState<number>(0);
  const [movementNote, setMovementNote] = useState('');

  const categories = ['ALL', 'DRINK', 'SOUVENIR', 'FOOD', 'OTHER'];
  const categoryLabels: Record<string, string> = {
    ALL: 'Tất cả',
    DRINK: 'Nước uống',
    SOUVENIR: 'Quà lưu niệm',
    FOOD: 'Thực phẩm',
    OTHER: 'Khác',
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    if (editingProduct) {
      const updatedItem = {
        ...editingProduct,
        code: newCode.toUpperCase().startsWith('PROD-') ? newCode.toUpperCase() : ('PROD-' + newCode.trim()).toUpperCase(),
        name: newName,
        category: newCategory,
        unit: newUnit,
        cost_price: newCostPrice,
        price: newPrice,
        tax_percent: newTaxPercent,
        stock_quantity: newStock,
        min_stock_alert: newMinAlert,
        supplier: newSupplier || 'Nhà cung cấp',
      };
      await salesService.updateProduct(editingProduct.id, updatedItem);
      
      const res = await salesService.fetchProducts();
      if (res.data && res.data.length > 0) setProducts(res.data);
      else setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? updatedItem : p));
    } else {
      const item: Product = {
        id: `prd-${Date.now()}`,
        code: ('PROD-' + newCode.trim()).toUpperCase(),
        name: newName,
        category: newCategory,
        unit: newUnit,
        cost_price: newCostPrice,
        price: newPrice,
        tax_percent: newTaxPercent,
        stock_quantity: newStock,
        min_stock_alert: newMinAlert,
        supplier: newSupplier || 'Nhà cung cấp',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin',
      };
      const res = await salesService.createProduct(item);
      if (res.code === 201 && res.data) setProducts((prev) => [res.data, ...prev]);
      else setProducts((prev) => [item, ...prev]);
    }

    setNewCode(''); setNewName(''); setNewTaxPercent(10);
    setEditingProduct(null); setShowAddProductModal(false);
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForIn || movementQty <= 0) return;

    const prd = selectedProductForIn;
    const isImport = movementType === 'IMPORT';
    const updatedStock = isImport ? prd.stock_quantity + movementQty : Math.max(0, prd.stock_quantity - movementQty);

    await salesService.updateProduct(prd.id, { ...prd, stock_quantity: updatedStock });
    setProducts((prev) => prev.map((p) => p.id === prd.id ? { ...p, stock_quantity: updatedStock, updated_at: new Date().toISOString() } : p));

    const newLog: StockMovementLog = {
      id: `slog-${Date.now()}`,
      product_id: prd.id, product_code: prd.code, product_name: prd.name,
      type: movementType, quantity: movementQty,
      unit_price: movementUnitPrice || (isImport ? prd.cost_price || 0 : prd.price),
      total_value: (movementUnitPrice || (isImport ? prd.cost_price || 0 : prd.price)) * movementQty,
      performed_by: 'admin', note: movementNote || (isImport ? 'Nhập kho bổ sung' : 'Xuất kho / Điều chuyển'),
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 'admin', updated_by: 'admin',
    };

    const updatedLogs = [newLog, ...stockLogs];
    setStockLogs(updatedLogs);
    dbStore.stockLogs = updatedLogs;
    dbStore.saveToStorage();

    setShowStockInModal(false); setSelectedProductForIn(null); setMovementNote('');
  };

  const handleDeleteProducts = async (ids: string[]) => {
    for (const id of ids) { await salesService.deleteProduct(String(id)); }
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.min_stock_alert || 20)).length;
  const totalStockItems = products.reduce((sum, p) => sum + p.stock_quantity, 0);

  return {
    activeTab, setActiveTab,
    products, stockLogs,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    showAddProductModal, setShowAddProductModal,
    editingProduct, setEditingProduct,
    showStockInModal, setShowStockInModal,
    selectedProductForIn, setSelectedProductForIn,
    
    newCode, setNewCode, newName, setNewName, newCategory, setNewCategory, newUnit, setNewUnit,
    newCostPrice, setNewCostPrice, newPrice, setNewPrice, newTaxPercent, setNewTaxPercent,
    newStock, setNewStock, newMinAlert, setNewMinAlert, newSupplier, setNewSupplier,
    
    movementType, setMovementType, movementQty, setMovementQty, movementUnitPrice, setMovementUnitPrice, movementNote, setMovementNote,
    
    categories, categoryLabels,
    filteredProducts, lowStockCount, totalStockItems,
    
    handleAddProduct, handleStockMovement, handleDeleteProducts
  };
};
