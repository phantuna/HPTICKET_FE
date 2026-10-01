import React, { useEffect } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Layers,
  History,
  Package,
  Eye,
  Edit,
  Calendar,
  X,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { Product, StockMovementLog } from '../../../shared/types/hpticket';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { useInventory } from '../hooks/useInventory';
import { ProductFormModal } from '../components/ProductFormModal';
import { StockMovementModal } from '../components/StockMovementModal';
import { StockMovementDetailModal } from '../components/StockMovementDetailModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { DetailsModal } from '../../../shared/components/DetailsModal';
import { VNDateInput } from '../../../shared/components/ui';

interface InventoryModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ subTab = 'KhoHang', onSelectSubTab }) => {
  const { can } = usePermission();
  const [selectedProductForDetails, setSelectedProductForDetails] = React.useState<any>(null);
  const [selectedLogForDetails, setSelectedLogForDetails] = React.useState<StockMovementLog | null>(null);
  const invState = useInventory(subTab);

  const {
    activeTab, setActiveTab, products, stockLogs, filteredStockLogs, paginatedStockLogs,
    page, setPage, pageSize, setPageSize, totalPages, totalElements, isLoadingMovements,
    unseenLogsCount, handleJumpToLatest, handleExportExcel,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory, selectedMovementType, setSelectedMovementType,
    datePreset, setDatePreset, fromDate, setFromDate, toDate, setToDate,
    showAddProductModal, setShowAddProductModal,
    editingProduct, setEditingProduct, showStockInModal, setShowStockInModal,
    selectedProductForIn, setSelectedProductForIn,
    newCode, setNewCode, newName, setNewName, newCategory, setNewCategory, newUnit, setNewUnit,
    newCostPrice, setNewCostPrice, newPrice, setNewPrice, newTaxPercent, setNewTaxPercent,
    newStock, setNewStock, newMinAlert, setNewMinAlert, newSupplier, setNewSupplier,
    adjustmentReason, setAdjustmentReason,
    movementType, setMovementType, movementQty, setMovementQty, movementUnitPrice, setMovementUnitPrice, movementNote, setMovementNote,
    categories, categoryLabels, movementTypeLabels, filteredProducts, lowStockCount, totalStockItems,
    isSubmitting,
    handleAddProduct, handleStockMovement, handleDeleteProducts
  } = invState;

  const currentTab = onSelectSubTab ? subTab : activeTab;
  const setTab = (t: string) => {
    setActiveTab(t);
    if (onSelectSubTab) onSelectSubTab(t);
  };

  useEffect(() => {
    if (onSelectSubTab) setActiveTab(subTab);
  }, [subTab, onSelectSubTab, setActiveTab]);

  const handleOpenAddNew = () => {
    setEditingProduct(null);
    setNewCode('');
    setNewName('');
    setNewCategory('DRINK');
    setNewUnit('Chai');
    setNewCostPrice(5000);
    setNewPrice(15000);
    setNewTaxPercent(10);
    setNewStock(100);
    setNewMinAlert(20);
    setNewSupplier('');
    setAdjustmentReason('');
    setShowAddProductModal(true);
  };

  const handleOpenEdit = (item: Product) => {
    setEditingProduct(item);
    const rawCode = item.code.startsWith('PROD-') ? item.code.substring(5) : item.code;
    setNewCode(rawCode);
    setNewName(item.name);
    setNewCategory(item.category || 'DRINK');
    setNewUnit(item.unit || 'Chai');
    setNewCostPrice(item.cost_price || 0);
    setNewPrice(item.price || 0);
    setNewTaxPercent(item.tax_percent !== undefined ? item.tax_percent : 10);
    setNewStock(item.stock_quantity || 0);
    setNewMinAlert(item.min_stock_alert || 20);
    setNewSupplier(item.supplier || '');
    setAdjustmentReason('');
    setShowAddProductModal(true);
  };

  // Header Right: Badges and SubTab switchers
  const renderHeaderRight = () => (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Subtab Selector */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setTab('KhoHang')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
            currentTab === 'KhoHang'
              ? 'bg-white text-emerald-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tồn kho ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('LichSu')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
            currentTab === 'LichSu'
              ? 'bg-white text-emerald-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch sử ({stockLogs.length})</span>
        </button>
      </div>

      {/* Stats Badges */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-mono text-slate-700">
          <span className="text-slate-500 font-sans text-[11px] mr-1.5">Tổng tồn:</span>
          <span className="font-bold text-slate-900">{totalStockItems.toLocaleString('vi-VN')}</span> món
        </div>
        <div
          className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1 ${
            lowStockCount > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          <span className="font-sans text-[11px]">Cảnh báo:</span>
          <span className="font-bold">{lowStockCount}</span>
        </div>
      </div>
    </div>
  );

  // Toolbar Right: Search & Category / Movement Type Filter
  const renderToolbarRight = () => (
    <div className="flex items-center gap-2 flex-wrap">
      {currentTab === 'KhoHang' ? (
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 shadow-xs"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {categoryLabels[cat] || cat}
            </option>
          ))}
        </select>
      ) : (
        <select
          value={selectedMovementType}
          onChange={(e) => setSelectedMovementType(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 shadow-xs"
        >
          {Object.entries(movementTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      )}

      <div className="relative min-w-[200px]">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={currentTab === 'KhoHang' ? 'Tìm tên, mã sản phẩm...' : 'Tìm tên, mã, ghi chú, người...'}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-500 font-medium placeholder:text-slate-400 shadow-xs"
        />
      </div>

      {currentTab === 'LichSu' && (
        <button
          type="button"
          onClick={handleExportExcel}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Xuất nhật ký biến động kho ra file Excel chuẩn form hệ thống"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Xuất Excel</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="p-3 sm:p-5 max-w-full space-y-4 text-slate-900">
      {currentTab === 'KhoHang' && (
        <AdminConfigCard<Product>
          title="QUẢN LÝ KHO SẢN PHẨM & DỊCH VỤ"
          data={filteredProducts}
          compact={true}
          headerRight={renderHeaderRight()}
          toolbarRight={renderToolbarRight()}
          columns={[
            {
              header: 'STT',
              accessor: (_row, idx) => idx + 1,
              className: 'w-10 font-mono text-center text-xs',
            },
            {
              header: 'Tên Sản Phẩm / Hàng Hóa',
              accessor: (row) => (
                <div className="py-0.5">
                  <div className="font-bold text-slate-900 text-xs sm:text-sm">{row.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span>{row.code}</span>
                    <span>•</span>
                    <span>ĐVT: {row.unit || 'Cái'}</span>
                  </div>
                </div>
              ),
              className: 'min-w-[170px] py-1',
            },
            {
              header: 'Phân Loại',
              accessor: (row) => (
                <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  {categoryLabels[row.category || ''] || row.category || 'Khác'}
                </span>
              ),
              className: 'w-24 text-center',
            },
            {
              header: 'Số Lượng Tồn',
              accessor: (row) => {
                const isLow = row.stock_quantity <= (row.min_stock_alert || 20);
                const isOut = row.stock_quantity === 0;
                return (
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                        isOut
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {row.stock_quantity.toLocaleString('vi-VN')} {row.unit || 'Cái'}
                    </span>
                    {isLow && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">
                        Sắp hết
                      </span>
                    )}
                  </div>
                );
              },
              className: 'text-center w-28',
            },
            {
              header: 'Giá Bán (VND)',
              accessor: (row) => `${row.price.toLocaleString('vi-VN')} đ`,
              className: 'font-mono font-bold text-emerald-700 text-right pr-2 w-28 text-xs sm:text-sm',
            },
            {
              header: 'Thao Tác',
              accessor: (row) => (
                <div className="flex items-center justify-center gap-1">
                  {can('UPDATE_PRODUCT') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForIn(row);
                        setMovementType('IMPORT');
                        setMovementQty(10);
                        setMovementUnitPrice(row.cost_price || 0);
                        setMovementNote('');
                        setShowStockInModal(true);
                      }}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] rounded transition flex items-center gap-0.5"
                      title="Nhập thêm hàng vào kho"
                    >
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      <span>Nhập</span>
                    </button>
                  )}
                  {can('UPDATE_PRODUCT') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductForIn(row);
                        setMovementType('EXPORT');
                        setMovementQty(1);
                        setMovementUnitPrice(row.price || 0);
                        setMovementNote('');
                        setShowStockInModal(true);
                      }}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] rounded transition flex items-center gap-0.5"
                      title="Xuất bớt hàng khỏi kho"
                    >
                      <ArrowUpRight className="w-3 h-3 text-amber-600" />
                      <span>Xuất</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProductForDetails(row);
                    }}
                    className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-[11px] rounded transition flex items-center gap-0.5"
                    title="Xem chi tiết hàng hóa"
                  >
                    <Eye className="w-3 h-3 text-slate-600" />
                    <span>Xem</span>
                  </button>
                </div>
              ),
              className: 'text-center w-36',
            },
          ]}
          onAddNew={can('CREATE_PRODUCT') ? handleOpenAddNew : undefined}
          onEdit={can('UPDATE_PRODUCT') ? handleOpenEdit : undefined}
          onDelete={can('DELETE_PRODUCT') ? handleDeleteProducts : undefined}
          hideAddButton={!can('CREATE_PRODUCT')}
          hideDeleteButton={!can('DELETE_PRODUCT')}
        />
      )}

      {currentTab === 'LichSu' && (
        <div className="space-y-3">
          {/* Date Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Khoảng thời gian:</span>
              </span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                {(['ALL', 'TODAY', '7DAYS', '30DAYS', 'CUSTOM'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDatePreset(preset)}
                    className={`px-3 py-1.5 rounded-md transition ${
                      datePreset === preset
                        ? 'bg-white text-emerald-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset === 'ALL'
                      ? 'Tất cả'
                      : preset === 'TODAY'
                      ? 'Hôm nay'
                      : preset === '7DAYS'
                      ? '7 ngày'
                      : preset === '30DAYS'
                      ? '30 ngày'
                      : 'Tùy chọn'}
                  </button>
                ))}
              </div>
            </div>

            {(datePreset === 'CUSTOM' || fromDate || toDate) && (
              <div className="flex items-center gap-2 flex-wrap animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap shrink-0">Từ ngày:</span>
                  <VNDateInput
                    value={fromDate}
                    onChange={(val) => {
                      setFromDate(val);
                      if (datePreset !== 'CUSTOM') setDatePreset('CUSTOM');
                    }}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium text-[11px] whitespace-nowrap shrink-0">Đến ngày:</span>
                  <VNDateInput
                    value={toDate}
                    onChange={(val) => {
                      setToDate(val);
                      if (datePreset !== 'CUSTOM') setDatePreset('CUSTOM');
                    }}
                    className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                {(fromDate || toDate) && (
                  <button
                    type="button"
                    onClick={() => setDatePreset('ALL')}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition"
                    title="Xóa bộ lọc ngày"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="text-slate-500 text-[11px] font-mono ml-auto">
              Tổng số <strong className="text-slate-800">{totalElements.toLocaleString('vi-VN')}</strong> biến động
            </div>
          </div>


          {/* Banner thông báo biến động kho mới khi người dùng đang ở trang > 1 */}
          {unseenLogsCount > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-2.5 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                </span>
                <span className="font-medium">
                  Có <strong className="font-bold text-blue-900">{unseenLogsCount}</strong> giao dịch bán hàng / biến động kho mới vừa phát sinh trong lúc bạn đang xem trang {page}. Dữ liệu trang hiện tại được giữ cố định để tránh xáo trộn/trùng lặp.
                </span>
              </div>
              <button
                type="button"
                onClick={handleJumpToLatest}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition text-xs shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xem mới nhất (Về Trang 1)</span>
              </button>
            </div>
          )}

          <AdminConfigCard<StockMovementLog>
            title="NHẬT KÝ LỊCH SỬ NHẬP XUẤT KHO"
            data={paginatedStockLogs}
            compact={true}
            hideCheckbox={true}
            onRowClick={(row) => setSelectedLogForDetails(row)}
            headerRight={renderHeaderRight()}
            toolbarRight={renderToolbarRight()}
            columns={[
              {
                header: 'Thời Gian',
                accessor: (row) => {
                  const dateStr = row.created_at || (row as any).createdAt;
                  if (!dateStr) return '—';
                  const d = new Date(dateStr);
                  return isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN');
                },
                className: 'font-mono text-xs text-slate-600 w-36',
              },
              {
                header: 'Loại Thao Tác',
                accessor: (row) => (
                  <span
                    className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded border inline-block ${
                      row.type === 'OPENING_BALANCE'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : row.type === 'IMPORT'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : row.type === 'EXPORT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : row.type === 'POS_SALE'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    {row.type === 'OPENING_BALANCE'
                      ? 'TỒN ĐẦU KỲ'
                      : row.type === 'IMPORT'
                      ? 'NHẬP KHO'
                      : row.type === 'EXPORT'
                      ? 'XUẤT KHO'
                      : row.type === 'POS_SALE'
                      ? 'BÁN POS'
                      : 'ĐIỀU CHỈNH'}
                  </span>
                ),
                className: 'w-28 text-center',
              },
              {
                header: 'Tên Sản Phẩm',
                accessor: (row) => {
                  const pName = row.product_name || (row as any).productName || '—';
                  const pCode = row.product_code || (row as any).productCode || 'PRD';
                  const pUnit = row.unit || 'Cái';
                  return (
                    <div className="py-0.5">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{pName}</div>
                      <div className="font-mono text-[11px] text-slate-500">Mã: {pCode} • ĐVT: {pUnit}</div>
                    </div>
                  );
                },
                className: 'min-w-[160px] py-1',
              },
              {
                header: 'Số Lượng',
                accessor: (row) => {
                  const absQty = Math.abs(row.quantity);
                  const isPositive =
                    row.type === 'IMPORT' ||
                    row.type === 'OPENING_BALANCE' ||
                    (row.type === 'ADJUST' && ((row.after_quantity ?? (row as any).afterQuantity ?? 0) >= (row.before_quantity ?? (row as any).beforeQuantity ?? 0)));
                  const isAdjust = row.type === 'ADJUST';
                  const sign = isAdjust ? '±' : (isPositive ? '+' : '-');
                  const before = row.before_quantity !== undefined ? row.before_quantity : (row as any).beforeQuantity;
                  const after = row.after_quantity !== undefined ? row.after_quantity : (row as any).afterQuantity;

                  return (
                    <div className="flex flex-col items-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          row.type === 'IMPORT' || row.type === 'OPENING_BALANCE'
                            ? 'text-emerald-700'
                            : row.type === 'ADJUST'
                            ? 'text-purple-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {sign}{absQty}
                      </span>
                      {(before !== undefined || after !== undefined) && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {before ?? '—'} → {after ?? '—'}
                        </span>
                      )}
                    </div>
                  );
                },
                className: 'text-center font-mono w-24',
              },
              {
                header: 'Tổng Giá Trị (VND)',
                accessor: (row) => {
                  const total = row.total_value ?? (row as any).totalValue ?? 0;
                  return `${Number(total).toLocaleString('vi-VN')} đ`;
                },
                className: 'font-mono font-bold text-emerald-700 text-right pr-3 w-28 text-xs',
              },
              {
                header: 'Ghi Chú / Mã HĐ',
                accessor: (row) => {
                  const refCode = row.reference_code || (row as any).referenceCode;
                  const counterName = row.sales_counter_name || (row as any).salesCounterName;
                  return (
                    <div className="py-0.5 space-y-0.5">
                      <div className="text-slate-800 text-xs truncate max-w-[220px]" title={row.note || ''}>
                        {row.note || '—'}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {refCode && refCode !== 'MANUAL' && (
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 inline-block">
                            {refCode}
                          </span>
                        )}
                        {counterName && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 inline-block">
                            {counterName}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                },
                className: 'text-slate-600 text-xs min-w-[150px]',
              },
              {
                header: 'Người Thực Hiện',
                accessor: (row) => row.performed_by || (row as any).performedBy || 'admin',
                className: 'font-mono text-slate-600 text-xs w-24 text-center',
              },
              {
                header: 'Thao Tác',
                accessor: (row) => (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLogForDetails(row);
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-[11px] rounded transition flex items-center gap-1 mx-auto"
                    title="Xem chi tiết biến động kho"
                  >
                    <Eye className="w-3 h-3 text-slate-600" />
                    <span>Xem</span>
                  </button>
                ),
                className: 'text-center w-16',
              },
            ]}
            hideAddButton={true}
            hideDeleteButton={true}
            footer={
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <span>
                    Hiển thị{' '}
                    <strong className="text-slate-900 font-mono">
                      {totalElements === 0 ? 0 : (page - 1) * pageSize + 1}
                    </strong>{' '}
                    -{' '}
                    <strong className="text-slate-900 font-mono">
                      {Math.min(page * pageSize, totalElements)}
                    </strong>{' '}
                    trên tổng số{' '}
                    <strong className="text-emerald-700 font-mono">
                      {totalElements.toLocaleString('vi-VN')}
                    </strong>{' '}
                    biến động
                  </span>

                  {/* Chọn số bản ghi trên trang */}
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                    <span className="text-[11px] text-slate-500">Hiển thị:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 outline-none focus:border-emerald-500 font-mono font-medium shadow-2xs"
                    >
                      <option value={10}>10 / trang</option>
                      <option value={20}>20 / trang</option>
                      <option value={50}>50 / trang</option>
                      <option value={100}>100 / trang</option>
                    </select>
                  </div>
                </div>

                {/* Các nút bấm phân trang */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition shadow-2xs"
                  >
                    ← Trước
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-slate-400 font-mono">...</span>}
                            <button
                              type="button"
                              onClick={() => setPage(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition ${
                                page === p
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition shadow-2xs"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            }
          />
        </div>
      )}

      {selectedProductForDetails && (
        <DetailsModal
          title="Chi tiết Sản phẩm / Hàng hóa"
          fields={[
            { label: 'Mã Sản Phẩm', value: selectedProductForDetails.code },
            { label: 'Tên Sản Phẩm', value: selectedProductForDetails.name },
            {
              label: 'Loại Hàng Hóa',
              value:
                categoryLabels[selectedProductForDetails.category || ''] ||
                selectedProductForDetails.category ||
                'N/A',
            },
            { label: 'Đơn Vị Tính (ĐVT)', value: selectedProductForDetails.unit || 'Cái' },
            {
              label: 'Giá Vốn',
              value: `${(selectedProductForDetails.cost_price || 0).toLocaleString('vi-VN')} đ`,
            },
            {
              label: 'Giá Bán',
              value: `${(selectedProductForDetails.price || 0).toLocaleString('vi-VN')} đ`,
            },
            {
              label: 'VAT',
              value: `${
                selectedProductForDetails.tax_percent !== undefined
                  ? selectedProductForDetails.tax_percent
                  : 10
              }%`,
            },
            {
              label: 'Nhà Cung Cấp',
              value: selectedProductForDetails.supplier || 'Không có thông tin',
            },
            {
              label: 'Tồn Kho Hiện Tại',
              value: `${selectedProductForDetails.stock_quantity || 0} ${
                selectedProductForDetails.unit || 'Cái'
              }`,
            },
            {
              label: 'Cảnh Báo Tối Thiểu',
              value: `${selectedProductForDetails.min_stock_alert || 0} ${
                selectedProductForDetails.unit || 'Cái'
              }`,
            },
          ]}
          onClose={() => setSelectedProductForDetails(null)}
        />
      )}

      {showAddProductModal && (
        <ProductFormModal
          editingProduct={editingProduct}
          newCode={newCode}
          setNewCode={setNewCode}
          newName={newName}
          setNewName={setNewName}
          newCategory={newCategory}
          setNewCategory={setNewCategory}
          newUnit={newUnit}
          setNewUnit={setNewUnit}
          newCostPrice={newCostPrice}
          setNewCostPrice={setNewCostPrice}
          newPrice={newPrice}
          setNewPrice={setNewPrice}
          newTaxPercent={newTaxPercent}
          setNewTaxPercent={setNewTaxPercent}
          newStock={newStock}
          setNewStock={setNewStock}
          newMinAlert={newMinAlert}
          setNewMinAlert={setNewMinAlert}
          newSupplier={newSupplier}
          setNewSupplier={setNewSupplier}
          adjustmentReason={adjustmentReason}
          setAdjustmentReason={setAdjustmentReason}
          isSubmitting={isSubmitting}
          onSubmit={handleAddProduct}
          onClose={() => {
            setShowAddProductModal(false);
            setEditingProduct(null);
            setAdjustmentReason('');
          }}
        />
      )}

      {selectedLogForDetails && (
        <StockMovementDetailModal
          log={selectedLogForDetails}
          onClose={() => setSelectedLogForDetails(null)}
        />
      )}

      {showStockInModal && selectedProductForIn && (
        <StockMovementModal
          selectedProductForIn={selectedProductForIn}
          movementType={movementType}
          movementQty={movementQty}
          setMovementQty={setMovementQty}
          movementUnitPrice={movementUnitPrice}
          setMovementUnitPrice={setMovementUnitPrice}
          movementNote={movementNote}
          setMovementNote={setMovementNote}
          isSubmitting={isSubmitting}
          onSubmit={handleStockMovement}
          onClose={() => {
            setShowStockInModal(false);
            setSelectedProductForIn(null);
          }}
        />
      )}
    </div>
  );
};
export default InventoryModule;
