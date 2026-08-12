import React, { useEffect } from 'react';
import { Search, Filter, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Product, StockMovementLog } from '../../../shared/types/hpticket';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { useInventory } from '../hooks/useInventory';
import { InventoryHeader } from '../components/InventoryHeader';
import { InventoryTabs } from '../components/InventoryTabs';
import { ProductFormModal } from '../components/ProductFormModal';
import { StockMovementModal } from '../components/StockMovementModal';

interface InventoryModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({ subTab = 'KhoHang', onSelectSubTab }) => {
  const invState = useInventory(subTab);

  const {
    activeTab, setActiveTab, products, stockLogs, searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory, showAddProductModal, setShowAddProductModal,
    editingProduct, setEditingProduct, showStockInModal, setShowStockInModal,
    selectedProductForIn, setSelectedProductForIn,
    newCode, setNewCode, newName, setNewName, newCategory, setNewCategory, newUnit, setNewUnit,
    newCostPrice, setNewCostPrice, newPrice, setNewPrice, newTaxPercent, setNewTaxPercent,
    newStock, setNewStock, newMinAlert, setNewMinAlert, newSupplier, setNewSupplier,
    movementType, setMovementType, movementQty, setMovementQty, movementUnitPrice, setMovementUnitPrice, movementNote, setMovementNote,
    categories, categoryLabels, filteredProducts, lowStockCount, totalStockItems,
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      <InventoryHeader totalStockItems={totalStockItems} lowStockCount={lowStockCount} />

      <InventoryTabs 
        currentTab={currentTab} setTab={setTab} 
        productsCount={products.length} stockLogsCount={stockLogs.length} 
        onAddNew={() => {
          setEditingProduct(null); setNewCode(''); setNewName(''); setNewCategory('DRINK'); setNewUnit('Chai');
          setNewCostPrice(5000); setNewPrice(15000); setNewTaxPercent(10); setNewStock(100); setNewMinAlert(20);
          setNewSupplier(''); setShowAddProductModal(true);
        }} 
      />

      {currentTab === 'KhoHang' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Tìm tên sản phẩm, mã hàng hóa..." className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 font-medium" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Phân loại:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${selectedCategory === cat ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{categoryLabels[cat] || cat}</button>
                ))}
              </div>
            </div>
          </div>
          <AdminConfigCard<Product>
            title="DANH SÁCH SẢN PHẨM & TỒN KHO THỰC TẾ"
            data={filteredProducts}
            columns={[
              { header: 'STT', accessor: (row, idx) => idx + 1, className: 'w-14 font-mono text-center' },
              { header: 'Mã Sản Phẩm', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
              { header: 'Tên Sản Phẩm / Hàng Hóa', accessor: (row) => (<div><div className="font-bold text-slate-900">{row.name}</div><div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5"><span>Loại: {categoryLabels[row.category || ''] || row.category || 'N/A'}</span><span>•</span><span>ĐVT: {row.unit || 'Cái'}</span></div></div>), className: 'py-2' },
              { header: 'Số Lượng Tồn Kho', accessor: (row) => {
                  const isLow = row.stock_quantity <= (row.min_stock_alert || 20);
                  const isOut = row.stock_quantity === 0;
                  return (<div className="flex items-center justify-center gap-2"><span className={`font-mono font-bold px-3 py-1 rounded-lg text-xs border ${isOut ? 'bg-red-50 text-red-700 border-red-200' : isLow ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>{row.stock_quantity.toLocaleString('vi-VN')} {row.unit || 'Cái'}</span>{isLow && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Cảnh báo</span>}</div>);
                }, className: 'text-center w-40' },
              { header: 'Giá Bán (VND)', accessor: (row) => `${row.price.toLocaleString('vi-VN')} đ`, className: 'font-mono font-bold text-indigo-700 text-right pr-4' },
              { header: 'VAT', accessor: (row) => (<span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">{row.tax_percent !== undefined ? row.tax_percent : 10}%</span>), className: 'text-center w-16' },
              { header: 'Nhà Cung Cấp', accessor: (row) => row.supplier || 'N/A', className: 'text-slate-600 text-xs font-medium' },
              { header: 'Thao Tác Kho', accessor: (row) => (
                  <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => { setSelectedProductForIn(row); setMovementType('IMPORT'); setShowStockInModal(true); }} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-lg transition flex items-center gap-1"><ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /><span>Nhập Kho</span></button>
                    <button onClick={() => { setSelectedProductForIn(row); setMovementType('EXPORT'); setShowStockInModal(true); }} className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-lg transition flex items-center gap-1"><ArrowUpRight className="w-3.5 h-3.5 text-amber-600" /><span>Xuất Kho</span></button>
                  </div>
                ), className: 'text-center w-48' },
            ]}
            onAddNew={() => {
              setEditingProduct(null); setNewCode(''); setNewName(''); setNewCategory('DRINK'); setNewUnit('Chai');
              setNewCostPrice(5000); setNewPrice(15000); setNewTaxPercent(10); setNewStock(100); setNewMinAlert(20);
              setNewSupplier(''); setShowAddProductModal(true);
            }}
            onEdit={(item: Product) => {
              setEditingProduct(item);
              const rawCode = item.code.startsWith('PROD-') ? item.code.substring(5) : item.code;
              setNewCode(rawCode); setNewName(item.name); setNewCategory(item.category || 'DRINK'); setNewUnit(item.unit || 'Chai');
              setNewCostPrice(item.cost_price || 0); setNewPrice(item.price || 0); setNewTaxPercent(item.tax_percent !== undefined ? item.tax_percent : 10);
              setNewStock(item.stock_quantity || 0); setNewMinAlert(item.min_stock_alert || 20); setNewSupplier(item.supplier || '');
              setShowAddProductModal(true);
            }}
            onDelete={handleDeleteProducts}
          />
        </div>
      )}

      {currentTab === 'LichSu' && (
        <AdminConfigCard<StockMovementLog>
          title="NẬT KÝ LỊCH SỬ NHẬP XUẤT KHO"
          data={stockLogs}
          columns={[
            { header: 'Thời Gian', accessor: (row) => new Date(row.created_at).toLocaleString('vi-VN'), className: 'font-mono text-xs text-slate-600 w-40' },
            { header: 'Loại Thao Tác', accessor: (row) => (<span className={`font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md border ${row.type === 'IMPORT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : row.type === 'EXPORT' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{row.type === 'IMPORT' ? 'NHẬP KHO' : row.type === 'EXPORT' ? 'XUẤT KHO' : 'BÁN POS'}</span>), className: 'w-28 text-center' },
            { header: 'Tên Sản Phẩm', accessor: (row) => (<div><div className="font-bold text-slate-900">{row.product_name}</div><div className="font-mono text-[11px] text-slate-500">Mã: {row.product_code}</div></div>), className: 'py-2' },
            { header: 'Số Lượng', accessor: (row) => (<span className="font-mono font-bold text-slate-900">{row.type === 'IMPORT' ? '+' : '-'}{row.quantity}</span>), className: 'text-center font-mono w-24' },
            { header: 'Tổng Giá Trị (VND)', accessor: (row) => `${(row.total_value || 0).toLocaleString('vi-VN')} đ`, className: 'font-mono font-bold text-indigo-700 text-right pr-4' },
            { header: 'Ghi Chú', accessor: 'note', className: 'text-slate-600 text-xs' },
            { header: 'Người Thực Hiện', accessor: 'performed_by', className: 'font-mono text-slate-600 text-xs w-28 text-center' },
          ]}
        />
      )}

      {showAddProductModal && (
        <ProductFormModal 
          editingProduct={editingProduct} newCode={newCode} setNewCode={setNewCode} newName={newName} setNewName={setNewName}
          newCategory={newCategory} setNewCategory={setNewCategory} newUnit={newUnit} setNewUnit={setNewUnit}
          newCostPrice={newCostPrice} setNewCostPrice={setNewCostPrice} newPrice={newPrice} setNewPrice={setNewPrice}
          newTaxPercent={newTaxPercent} setNewTaxPercent={setNewTaxPercent} newStock={newStock} setNewStock={setNewStock}
          newMinAlert={newMinAlert} setNewMinAlert={setNewMinAlert} newSupplier={newSupplier} setNewSupplier={setNewSupplier}
          onSubmit={handleAddProduct} onClose={() => setShowAddProductModal(false)}
        />
      )}

      {showStockInModal && selectedProductForIn && (
        <StockMovementModal 
          selectedProductForIn={selectedProductForIn} movementType={movementType} movementQty={movementQty} setMovementQty={setMovementQty}
          movementUnitPrice={movementUnitPrice} setMovementUnitPrice={setMovementUnitPrice} movementNote={movementNote} setMovementNote={setMovementNote}
          onSubmit={handleStockMovement} onClose={() => { setShowStockInModal(false); setSelectedProductForIn(null); }}
        />
      )}
    </div>
  );
};
