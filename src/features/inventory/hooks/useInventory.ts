import React, { useState, useEffect, useCallback, useRef } from 'react';
import { salesService } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { inventoryService, StockMovementFilterParams } from '../../../api/inventoryService';
import { Product, StockMovementLog, StockMovementType, Company } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';
import { toast } from '../../../shared/utils/toast';
import { exportInventoryHistoryToExcel } from '../utils/inventoryExcelExporter';

export const useInventory = (initialTab: string) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(() => dbStore.companies[0] || null);

  // Phân trang chuẩn Backend (Pageable)
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [stockLogs, setStockLogs] = useState<StockMovementLog[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(false);

  // Xử lý chống nhảy hàng / xô lệch dữ liệu khi người dùng đang xem trang > 1
  const [unseenLogsCount, setUnseenLogsCount] = useState<number>(0);

  // Bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');

  // Bộ lọc thời gian cho Lịch sử kho
  const [datePreset, setDatePresetState] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM'>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const setDatePreset = (preset: 'ALL' | 'TODAY' | '7DAYS' | '30DAYS' | 'CUSTOM') => {
    setDatePresetState(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'ALL') {
      setFromDate('');
      setToDate('');
    } else if (preset === 'TODAY') {
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === '7DAYS') {
      const past = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    } else if (preset === '30DAYS') {
      const past = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      setFromDate(past.toISOString().split('T')[0]);
      setToDate(todayStr);
    }
  };

  // Tải danh sách sản phẩm thật và thông tin công ty
  const loadMasterData = useCallback(async () => {
    try {
      const res = await salesService.fetchProducts();
      if (res.data) {
        setProducts(res.data);
      }
      const compRes = await marketingService.fetchCompanies();
      if (compRes.data && compRes.data.length > 0) {
        setCompany(compRes.data[0]);
      }
    } catch (err) {
      console.warn('[useInventory] loadMasterData error:', err);
    }
  }, []);

  useEffect(() => {
    loadMasterData();
  }, [loadMasterData]);

  // Hàm tải dữ liệu phân trang từ Backend API
  const loadStockLogsFromBackend = useCallback(async (targetPage: number = page) => {
    setIsLoadingMovements(true);
    const filterParams: StockMovementFilterParams = {
      keyword: searchTerm,
      type: selectedMovementType === 'ALL' ? undefined : (selectedMovementType as StockMovementType),
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };

    try {
      const res = await inventoryService.fetchMovements(filterParams, targetPage - 1, pageSize);
      if (res && res.data) {
        setStockLogs(res.data.content || []);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(Math.max(1, res.data.totalPages || 1));
      }
    } catch (err) {
      console.warn('[useInventory] fetchMovements failed:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  }, [page, pageSize, searchTerm, selectedMovementType, fromDate, toDate]);

  // Tự động tải lại lịch sử khi thay đổi trang, kích thước trang hoặc bộ lọc
  useEffect(() => {
    loadStockLogsFromBackend(page);
  }, [page, pageSize, selectedMovementType, fromDate, toDate, loadStockLogsFromBackend]);

  // Debounce tìm kiếm từ khóa
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadStockLogsFromBackend(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lắng nghe sự kiện cập nhật tồn kho từ POS hoặc các quầy khác
  useEffect(() => {
    const handleStockUpdate = () => {
      // Làm mới danh sách sản phẩm
      salesService.fetchProducts().then((res) => {
        if (res.data) setProducts(res.data);
      });

      if (page === 1) {
        // Đang ở trang 1: Cập nhật trực tiếp lên đầu trang
        loadStockLogsFromBackend(1);
        setUnseenLogsCount(0);
      } else {
        // Đang ở trang > 1: Giữ nguyên dòng hiển thị hiện tại để không bị nhảy số hàng và trùng lặp
        // Chỉ thông báo số lượng biến động mới phát sinh
        setUnseenLogsCount((prev) => prev + 1);
      }
    };

    window.addEventListener('hpticket_stock_logs_updated', handleStockUpdate);
    window.addEventListener('hpticket_stock_changed', handleStockUpdate);
    return () => {
      window.removeEventListener('hpticket_stock_logs_updated', handleStockUpdate);
      window.removeEventListener('hpticket_stock_changed', handleStockUpdate);
    };
  }, [page, loadStockLogsFromBackend]);

  // Chuyển về trang 1 và nạp toàn bộ biến động mới nhất
  const handleJumpToLatest = () => {
    setUnseenLogsCount(0);
    setPage(1);
    loadStockLogsFromBackend(1);
  };

  // Modals & Forms State
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
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const [movementType, setMovementType] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [movementQty, setMovementQty] = useState<number>(10);
  const [movementUnitPrice, setMovementUnitPrice] = useState<number>(0);
  const [movementNote, setMovementNote] = useState('');

  const categories = ['ALL', 'DRINK', 'SOUVENIR', 'FOOD', 'OTHER'];
  const categoryLabels: Record<string, string> = {
    ALL: 'Tất cả phân loại',
    DRINK: 'Nước uống',
    SOUVENIR: 'Quà lưu niệm',
    FOOD: 'Thực phẩm',
    OTHER: 'Khác',
  };

  const movementTypeLabels: Record<string, string> = {
    ALL: 'Tất cả thao tác',
    OPENING_BALANCE: 'Tồn đầu kỳ (+)',
    IMPORT: 'Nhập kho (+)',
    EXPORT: 'Xuất kho (-)',
    POS_SALE: 'Bán POS (-)',
    ADJUST: 'Điều chỉnh (±)',
    RETURN: 'Trả hàng (+)',
    DAMAGED: 'Xuất hủy hỏng (-)',
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      toast.error('Vui lòng nhập đầy đủ mã và tên sản phẩm');
      return;
    }

    const payload = {
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory as any,
      unit: newUnit,
      cost_price: Number(newCostPrice) || 0,
      price: Number(newPrice) || 0,
      tax_percent: Number(newTaxPercent) || 0,
      stock_quantity: Number(newStock) || 0,
      min_stock_alert: Number(newMinAlert) || 20,
      supplier: newSupplier.trim(),
      is_active: true,
    };

    if (editingProduct) {
      const oldStock = Number(editingProduct.stock_quantity) || 0;
      const targetStock = Number(newStock) || 0;

      if (oldStock !== targetStock) {
        if (!adjustmentReason.trim()) {
          toast.error('Cảnh báo: Bạn đang thay đổi số lượng tồn kho. Bắt buộc phải nhập Lý do điều chỉnh kho!');
          return;
        }

        // Ghi nhận biến động điều chỉnh kho
        await inventoryService.recordStockMovement({
          productId: editingProduct.id,
          type: 'ADJUST',
          targetQuantity: targetStock,
          unitPrice: payload.price,
          referenceType: 'INVENTORY_ADJUSTMENT',
          referenceCode: `ADJUST-${Date.now()}`,
          reason: adjustmentReason.trim(),
          note: `Điều chỉnh tồn kho từ ${oldStock} sang ${targetStock} ${payload.unit}`,
        });
      }

      const res = await salesService.updateProduct(editingProduct.id, payload);
      if (res?.data) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? (res.data as Product) : p)));
        toast.success('Cập nhật thông tin sản phẩm thành công!');
      }
    } else {
      const res = await salesService.createProduct(payload);
      if (res?.data) {
        const createdPrd = res.data;
        setProducts((prev) => [...prev, createdPrd]);

        // Ghi log khởi tạo tồn kho
        if (Number(newStock) > 0) {
          await inventoryService.recordStockMovement({
            productId: createdPrd.id,
            type: 'OPENING_BALANCE',
            quantity: Number(newStock),
            targetQuantity: Number(newStock),
            unitPrice: payload.cost_price || payload.price,
            referenceType: 'OPENING_BALANCE',
            referenceCode: `INIT-${Date.now()}`,
            note: `Tạo sản phẩm mới và nạp tồn ban đầu (+${newStock} ${payload.unit})`,
            reason: 'Khởi tạo tồn kho ban đầu',
          });
        }
        toast.success('Thêm mới sản phẩm thành công!');
      }
    }

    setShowAddProductModal(false);
    setEditingProduct(null);
    setAdjustmentReason('');
    loadStockLogsFromBackend(1);
  };

  const handleStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForIn) return;

    const prd = selectedProductForIn;
    const isImport = movementType === 'IMPORT';
    const cleanQty = Math.max(1, parseInt(String(movementQty), 10) || 1);
    const cleanUnitPrice = Number(movementUnitPrice) || (isImport ? Number(prd.cost_price) || 0 : Number(prd.price) || 0);

    const result = await inventoryService.recordStockMovement({
      productId: prd.id,
      type: movementType,
      quantity: cleanQty,
      unitPrice: cleanUnitPrice,
      referenceType: 'MANUAL',
      referenceCode: `MANUAL-${Date.now()}`,
      note: movementNote || (isImport ? `Nhập kho bổ sung (+${cleanQty} ${prd.unit || 'Cái'})` : `Xuất kho / Điều chuyển (-${cleanQty} ${prd.unit || 'Cái'})`),
      reason: movementNote,
    });

    if (!result.success) {
      toast.error(result.message || 'Thao tác không thành công');
      return;
    }

    // Cập nhật tồn kho sản phẩm trong giao diện
    salesService.fetchProducts().then((res) => {
      if (res.data) setProducts(res.data);
    });

    toast.success(
      isImport
        ? `Nhập kho thành công: +${cleanQty} ${prd.unit || 'Cái'} cho ${prd.name}`
        : `Xuất kho thành công: -${cleanQty} ${prd.unit || 'Cái'} cho ${prd.name}`
    );

    setShowStockInModal(false);
    setSelectedProductForIn(null);
    setMovementNote('');
    setMovementUnitPrice(0);
    loadStockLogsFromBackend(page);
  };

  const handleDeleteProducts = async (ids: string[]) => {
    for (const id of ids) {
      await salesService.deleteProduct(String(id));
    }
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
    toast.success('Đã xóa sản phẩm thành công!');
  };

  // Lọc sản phẩm ở tab Quản lý hàng hóa
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Xuất file Excel theo cơ chế Chunked Streaming
  const handleExportExcel = async () => {
    const filterParams: StockMovementFilterParams = {
      keyword: searchTerm,
      type: selectedMovementType === 'ALL' ? undefined : (selectedMovementType as StockMovementType),
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    };

    await exportInventoryHistoryToExcel({
      filter: filterParams,
      company: company || dbStore.companies[0],
      fileName: `NhatKyBienDongKho_${new Date().toISOString().slice(0, 10)}`,
      onProgress: (loaded, total, percent) => {
        toast.info(`Đang tải dữ liệu: ${loaded.toLocaleString('vi-VN')} / ${total.toLocaleString('vi-VN')} dòng (${percent}%)...`);
      },
    });
  };

  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.min_stock_alert || 20)).length;
  const totalStockItems = products.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0);

  return {
    activeTab, setActiveTab,
    products, stockLogs, filteredStockLogs: stockLogs, paginatedStockLogs: stockLogs,

    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    selectedMovementType, setSelectedMovementType,
    datePreset, setDatePreset,
    fromDate, setFromDate,
    toDate, setToDate,
    
    // Phân trang chuẩn Backend & Chống trùng lặp
    page, setPage,
    pageSize, setPageSize,
    totalElements,
    totalPages,
    isLoadingMovements,
    unseenLogsCount,
    handleJumpToLatest,
    handleExportExcel,
    company,

    showAddProductModal, setShowAddProductModal,
    editingProduct, setEditingProduct,
    showStockInModal, setShowStockInModal,
    selectedProductForIn, setSelectedProductForIn,
    
    newCode, setNewCode, newName, setNewName, newCategory, setNewCategory, newUnit, setNewUnit,
    newCostPrice, setNewCostPrice, newPrice, setNewPrice, newTaxPercent, setNewTaxPercent,
    newStock, setNewStock, newMinAlert, setNewMinAlert, newSupplier, setNewSupplier,
    adjustmentReason, setAdjustmentReason,
    
    movementType, setMovementType, movementQty, setMovementQty, movementUnitPrice, setMovementUnitPrice, movementNote, setMovementNote,
    
    categories, categoryLabels, movementTypeLabels,
    filteredProducts, lowStockCount, totalStockItems,
    
    handleAddProduct, handleStockMovement, handleDeleteProducts
  };
};
