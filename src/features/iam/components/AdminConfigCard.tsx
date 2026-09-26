import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

export interface ColumnDef<T> {
  header: string;
  accessor?: string | keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
}

interface AdminConfigCardProps<T> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  onAddNew?: () => void;
  onEdit?: (selectedItem: T) => void;
  onDelete?: (selectedIds: (string | number)[]) => void;
  onToggleActive?: (id: string | number, currentActive: boolean) => void;
  activeField?: string;
  hideAddButton?: boolean;
  hideDeleteButton?: boolean;
  hideCheckbox?: boolean;
  compact?: boolean;
  onViewDetails?: (selectedItem: T) => void;
  onRowClick?: (selectedItem: T) => void;
  headerRight?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function AdminConfigCard<T extends { id: string | number }>({
  title,
  data,
  columns,
  onAddNew,
  onEdit,
  onDelete,
  onToggleActive,
  activeField = 'is_active',
  hideAddButton = false,
  hideDeleteButton = false,
  hideCheckbox = false,
  compact = false,
  onViewDetails,
  onRowClick,
  headerRight,
  toolbarRight,
  footer,
  children,
}: AdminConfigCardProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds([]); // Bỏ chọn nếu click lại chính nó
    } else {
      setSelectedIds([id]); // Chỉ chọn 1 cái, tự bỏ chọn các cái khác
    }
  };

  const handleEditClick = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn 1 dòng cần sửa!');
      return;
    }
    if (selectedIds.length > 1) {
      toast.error('Vui lòng chỉ chọn 1 dòng để sửa!');
      return;
    }
    const target = data.find((item) => item.id === selectedIds[0]);
    if (target && onEdit) {
      onEdit(target);
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 dòng cần xóa!');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
    setShowDeleteConfirm(false);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md border border-slate-200 space-y-5 my-2">
      {/* Title & Header Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-800">
          {title}
        </h2>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>

      {/* Action Buttons Toolbar & Toolbar Right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!hideAddButton && (
            <button
              type="button"
              onClick={onAddNew}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
            >
              <Edit className="w-4 h-4" /> Sửa
            </button>
          )}

          {!hideDeleteButton && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
            >
              <Trash2 className="w-4 h-4" /> Xóa
            </button>
          )}
        </div>
        {toolbarRight && <div className="flex items-center gap-2 flex-wrap">{toolbarRight}</div>}
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
              {!hideCheckbox && (
                <th className={`text-center w-10 ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} className={`font-semibold ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {onViewDetails && (
                <th className={`font-semibold text-center w-20 ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>Chi Tiết</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hideCheckbox ? 0 : 1) + (onViewDetails ? 1 : 0)} className="p-6 text-center text-slate-400 italic">
                  Chưa có dữ liệu khai báo.
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const isSelected = selectedIds.includes(row.id);
                const rec = row as Record<string, any>;
                const isActive = Boolean(
                  rec[activeField] ??
                  rec.isActive ??
                  rec.is_active ??
                  rec.active ??
                  (rec.status === 'ACTIVE' || rec.status === true)
                );

                return (
                  <tr
                    key={row.id}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      // Bỏ qua nếu click vào nút toggle Sử dụng hoặc các button khác
                      if (target.closest('.toggle-active-checkbox') || target.tagName === 'BUTTON') {
                        return;
                      }
                      if (onRowClick) {
                        onRowClick(row);
                      } else if (!hideCheckbox) {
                        handleSelectRow(row.id);
                      }
                    }}
                    className={`cursor-pointer hover:bg-blue-50/60 transition ${isSelected ? 'bg-blue-50/90' : index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                      }`}
                  >
                    {/* Checkbox row */}
                    {!hideCheckbox && (
                      <td className={`text-center ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Column values */}
                    {columns.map((col, colIdx) => {
                      if (col.header === 'Sử dụng') {
                        return (
                          <td key={colIdx} className={`text-center ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() =>
                                onToggleActive && onToggleActive(row.id, isActive)
                              }
                              disabled={!onToggleActive}
                              className={`toggle-active-checkbox w-4 h-4 rounded border-slate-300 focus:ring-blue-500 ${onToggleActive ? 'text-blue-600 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
                            />
                          </td>
                        );
                      }

                      let cellContent: React.ReactNode;
                      if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(row, index);
                      } else if (typeof col.accessor === 'string') {
                        cellContent = (row as Record<string, any>)[col.accessor];
                      }

                      return (
                        <td key={colIdx} className={`text-slate-800 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} ${col.className || ''}`}>
                          {cellContent}
                        </td>
                      );
                    })}

                    {/* Chi tiết column */}
                    {onViewDetails && (
                      <td className={`text-center whitespace-nowrap ${compact ? 'px-2 py-2' : 'px-3 py-2.5'}`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails(row);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition inline-flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Chi Tiết
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {footer}
      {children}

      {/* Reusable Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa ${selectedIds.length} dòng đã chọn? Hệ thống sẽ ghi nhận lịch sử thay đổi này.`}
        type="danger"
        confirmText="Xác nhận xóa"
      />
    </div>
  );
}
