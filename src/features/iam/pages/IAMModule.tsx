import React from 'react';
import { Shield, UserCheck, QrCode } from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { AdminConfigCard } from '../components/AdminConfigCard';
import { CameraQRScannerModal } from '../../ticketing/components/CameraQRScannerModal';
import { useIAM } from '../hooks/useIAM';
import { UserModal } from '../components/UserModal';
import { BadgeModal } from '../components/BadgeModal';
import { StaffQRScanner } from '../components/StaffQRScanner';

interface IAMModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const IAMModule: React.FC<IAMModuleProps> = ({ subTab = 'KhaiBaoPhanQuyen', onSelectSubTab }) => {
  const {
    activeSubTab, setActiveSubTab,
    users, roles, permissions,
    selectedBadgeUser, setSelectedBadgeUser,
    badgeQrMode, setBadgeQrMode,
    isCameraModalOpen, setIsCameraModalOpen,
    scanInput, setScanInput,
    scannedStaff, setScannedStaff,
    hasScanned, setHasScanned,
    handleScanStaffQR,
    showUserModal, setShowUserModal,
    editingUserId,
    fullname, setFullname,
    username, setUsername,
    password, setPassword,
    phone, setPhone,
    roleId, setRoleId,
    handleCreateOrUpdateUser,
    handleDeleteUsers,
    handleToggleUserActive,
    openNewUserModal,
    openEditUserModal
  } = useIAM(subTab);

  const currentTab = onSelectSubTab ? subTab : activeSubTab;
  
  React.useEffect(() => {
    if (onSelectSubTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab, onSelectSubTab, setActiveSubTab]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. KHAI BÁO NHÓM QUYỀN (/KhaiBaoPhanQuyen) */}
      {currentTab === 'KhaiBaoPhanQuyen' && (
        <AdminConfigCard
          title="KHAI BÁO NHÓM QUYỀN"
          data={roles}
          columns={[
            {
              header: 'ID',
              accessor: (row: any, idx) => idx + 1,
              className: 'w-20 font-mono',
            },
            {
              header: 'Mã nhóm quyền',
              accessor: 'code',
              className: 'font-mono font-bold text-slate-800',
            },
            {
              header: 'Tên nhóm quyền',
              accessor: 'name',
              className: 'font-semibold text-slate-900',
            },
            {
              header: 'Danh mục quyền gán',
              accessor: (row: any) => (
                <div className="flex flex-wrap gap-1">
                  {(row.permissions || []).map((p: string) => (
                    <span
                      key={p}
                      className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ),
              className: 'py-2',
            },
            {
              header: 'Sử dụng',
              accessor: () => true,
              className: 'text-center w-24',
            },
          ]}
          onAddNew={() => alert('Thêm nhóm quyền mới')}
          onEdit={(item: any) => {
            alert(`Sửa nhóm quyền: ${item.name}`);
          }}
          onDelete={(ids) => {
            alert(`Xóa ${ids.length} nhóm quyền`);
          }}
        />
      )}

      {/* 2. KHAI BÁO TÀI KHOẢN ĐĂNG NHẬP (/KhaibaoDangNhap) */}
      {currentTab === 'KhaibaoDangNhap' && (
        <AdminConfigCard
          title="KHAI BÁO ĐĂNG NHẬP"
          data={users}
          columns={[
            {
              header: 'ID',
              accessor: (row, idx) => idx + 1,
              className: 'w-20 font-mono',
            },
            {
              header: 'Tên đăng nhập',
              accessor: 'username',
              className: 'font-mono font-bold text-slate-800',
            },
            {
              header: 'Nhóm quyền',
              accessor: (row) => {
                const r = roles.find((role) => role.id === row.role_id);
                return r?.name || 'Quản trị viên';
              },
              className: 'font-semibold text-slate-800',
            },
            {
              header: 'Tên người dùng',
              accessor: 'fullname',
              className: 'font-semibold text-slate-900',
            },
            {
              header: 'Sử dụng',
              accessor: 'is_active',
              className: 'text-center w-24',
            },
          ]}
          onAddNew={openNewUserModal}
          onEdit={openEditUserModal}
          onDelete={handleDeleteUsers}
          onToggleActive={handleToggleUserActive}
        />
      )}

      {/* 3. KHAI BÁO MÃ QR THẺ NHÂN VIÊN (/KhaiBaoThe_NV) */}
      {currentTab === 'KhaiBaoThe_NV' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-emerald-800 tracking-tight uppercase">
                    KHAI BÁO MÃ QR NHÂN VIÊN
                  </h2>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    /KhaiBaoThe_NV
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Liệt kê thông tin số điện thoại & mã QR nhân viên
                </p>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono">
              Tài Khoản & Phân Quyền
            </div>
          </div>

          <StaffQRScanner
            scanInput={scanInput} setScanInput={setScanInput}
            handleScanStaffQR={handleScanStaffQR} setIsCameraModalOpen={setIsCameraModalOpen}
            hasScanned={hasScanned} scannedStaff={scannedStaff} roles={roles}
          />

          <AdminConfigCard
            title="DANH SÁCH MÃ QR & SỐ ĐIỆN THOẠI NHÂN VIÊN"
            data={users}
            columns={[
              {
                header: 'ID',
                accessor: (row: any, idx) => idx + 1,
                className: 'w-16 font-mono text-center',
              },
              {
                header: 'Mã QR Nhân Viên',
                accessor: 'qr_code',
                className: 'font-mono font-bold text-emerald-700',
              },
              {
                header: 'Tên nhân viên',
                accessor: 'fullname',
                className: 'font-semibold text-slate-900',
              },
              {
                header: 'Số điện thoại',
                accessor: (row: any) => row.phone || '0901234567',
                className: 'font-mono text-slate-700 font-medium',
              },
              {
                header: 'Nhóm quyền',
                accessor: (row: any) => {
                  const r = roles.find((role) => role.id === row.role_id);
                  return (
                    <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {r?.name || 'Nhân viên'}
                    </span>
                  );
                },
                className: 'py-2',
              },
              {
                header: 'Ảnh QR',
                accessor: (row: any) => (
                  <div className="p-1 bg-white inline-block border border-slate-200 rounded-lg shadow-xs">
                    <QRCodeDisplay value={row.qr_code} size={48} />
                  </div>
                ),
                className: 'p-2 text-center w-28',
              },
              {
                header: 'Thao Tác',
                accessor: (row: any) => (
                  <button
                    onClick={() => setSelectedBadgeUser(row)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Xem Thẻ NV
                  </button>
                ),
                className: 'p-2 text-center',
              },
            ]}
            onAddNew={openNewUserModal}
            onEdit={openEditUserModal}
            onDelete={handleDeleteUsers}
          />
        </div>
      )}

      {selectedBadgeUser && (
        <BadgeModal
          selectedBadgeUser={selectedBadgeUser} roles={roles}
          badgeQrMode={badgeQrMode} setBadgeQrMode={setBadgeQrMode}
          onClose={() => setSelectedBadgeUser(null)}
        />
      )}

      <CameraQRScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanResult={(staff, rawCode) => {
          if (staff) {
            setScannedStaff(staff);
            setHasScanned(true);
            setScanInput(staff.qr_code);
          } else {
            setScannedStaff(null);
            setHasScanned(true);
            setScanInput(rawCode);
          }
        }}
      />

      {showUserModal && (
        <UserModal
          editingUserId={editingUserId} fullname={fullname} setFullname={setFullname}
          username={username} setUsername={setUsername} password={password} setPassword={setPassword}
          phone={phone} setPhone={setPhone} roleId={roleId} setRoleId={setRoleId}
          roles={roles} onClose={() => setShowUserModal(false)} onSubmit={handleCreateOrUpdateUser}
        />
      )}
    </div>
  );
};
