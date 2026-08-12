import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

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
}: AdminConfigCardProps<T>) {
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

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
      alert('Vui lòng chọn 1 dòng cần sửa!');
      return;
    }
    if (selectedIds.length > 1) {
      alert('Vui lòng chỉ chọn 1 dòng để sửa!');
      return;
    }
    const target = data.find((item) => item.id === selectedIds[0]);
    if (target && onEdit) {
      onEdit(target);
    }
  };

  const handleDeleteClick = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 dòng cần xóa!');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} dòng đã chọn?`)) {
      if (onDelete) {
        onDelete(selectedIds);
        setSelectedIds([]);
      }
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md border border-slate-200 space-y-5 my-2">
      {/* Title */}
      <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-800">
        {title}
      </h2>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
        <button
          type="button"
          onClick={handleEditClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
        >
          <Edit className="w-4 h-4" /> Sửa
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
        >
          <Trash2 className="w-4 h-4" /> Xóa
        </button>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
              <th className="p-3 text-center w-12">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </th>
              {columns.map((col, idx) => (
                <th key={idx} className={`p-3 font-semibold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-6 text-center text-slate-400 italic">
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
                      handleSelectRow(row.id);
                    }}
                    className={`cursor-pointer hover:bg-blue-50/60 transition ${
                      isSelected ? 'bg-blue-50/90' : index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox row */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </td>

                    {/* Column values */}
                    {columns.map((col, colIdx) => {
                      if (col.header === 'Sử dụng') {
                        return (
                          <td key={colIdx} className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={() =>
                                onToggleActive && onToggleActive(row.id, isActive)
                              }
                              className="toggle-active-checkbox w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                        <td key={colIdx} className={`p-3 text-slate-800 ${col.className || ''}`}>
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
