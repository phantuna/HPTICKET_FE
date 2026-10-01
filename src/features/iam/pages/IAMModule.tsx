import React from 'react';
import { QrCode } from 'lucide-react';
import { AdminConfigCard } from '../components/AdminConfigCard';
import { CameraQRScannerModal } from '../../ticketing/components/CameraQRScannerModal';
import { useIAM } from '../hooks/useIAM';
import { UserModal } from '../components/UserModal';
import { RoleModal } from '../components/RoleModal';
import { BadgeModal } from '../components/BadgeModal';
import { DetailsModal } from '../../../shared/components/DetailsModal';
import { toast } from '../../../shared/utils/toast';
import { usePermission } from '../../../shared/hooks/usePermission';

interface IAMModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const IAMModule: React.FC<IAMModuleProps> = ({ subTab = 'KhaiBaoPhanQuyen', onSelectSubTab }) => {
  const { can } = usePermission();
  const [selectedUserForDetails, setSelectedUserForDetails] = React.useState<any>(null);
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
    qrCode, setQrCode,
    roleId, setRoleId,
    selectedCounterIds, setSelectedCounterIds,
    salesCounters,
    handleCreateOrUpdateUser,
    handleDeleteUsers,
    handleToggleUserActive,
    openNewUserModal,
    openEditUserModal,
    showRoleModal, setShowRoleModal,
    editingRoleId,
    roleCode, setRoleCode,
    roleName, setRoleName,
    rolePermissions, setRolePermissions,
    handleCreateOrUpdateRole,
    handleDeleteRoles,
    handleToggleRoleActive,
    openNewRoleModal,
    openEditRoleModal,
    isSubmitting
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
              accessor: () => true, // Để dummy vì Role đang có active field riêng, hoặc dùng accessor: 'is_active'
              className: 'text-center w-24',
            },
          ]}
          onAddNew={can('CREATE_ROLE') ? openNewRoleModal : undefined}
          onEdit={can('UPDATE_ROLE') ? openEditRoleModal : undefined}
          onDelete={can('DELETE_ROLE') ? handleDeleteRoles : undefined}
          onToggleActive={can('UPDATE_ROLE') ? handleToggleRoleActive : undefined}
          hideAddButton={!can('CREATE_ROLE')}
          hideDeleteButton={!can('DELETE_ROLE')}
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
              accessor: (row: any, idx: number) => idx + 1,
              className: 'w-16 font-mono text-center'
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
          onAddNew={can('CREATE_USER') ? openNewUserModal : undefined}
          onEdit={can('UPDATE_USER') ? openEditUserModal : undefined}
          onDelete={can('DELETE_USER') ? handleDeleteUsers : undefined}
          onToggleActive={can('UPDATE_USER') ? handleToggleUserActive : undefined}
          hideAddButton={!can('CREATE_USER')}
          hideDeleteButton={!can('DELETE_USER')}
        />
      )}

      {/* 3. KHAI BÁO MÃ QR THẺ NHÂN VIÊN (/KhaiBaoThe_NV) */}
      {currentTab === 'KhaiBaoThe_NV' && (
        <AdminConfigCard
          title="Khai báo thẻ nhân viên / QR"
          data={users}
          columns={[
            {
              header: 'STT',
              accessor: (row: any, idx: number) => idx + 1,
              className: 'w-16 font-mono text-center'
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
              header: 'Thao Tác Nhanh',
              accessor: (row: any) => (
                <button
                  onClick={() => setSelectedBadgeUser(row)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Xem Thẻ NV
                </button>
              ),
              className: 'p-2 text-center w-32',
            },
          ]}
          onAddNew={can('CREATE_USER') ? openNewUserModal : undefined}
          onEdit={can('UPDATE_USER') ? openEditUserModal : undefined}
          onDelete={can('DELETE_USER') ? handleDeleteUsers : undefined}
          onViewDetails={(item: any) => setSelectedUserForDetails(item)}
          hideAddButton={!can('CREATE_USER')}
          hideDeleteButton={!can('DELETE_USER')}
        />
      )}

      {selectedBadgeUser && (
        <BadgeModal
          selectedBadgeUser={selectedBadgeUser} roles={roles}
          badgeQrMode={badgeQrMode} setBadgeQrMode={setBadgeQrMode}
          onClose={() => setSelectedBadgeUser(null)}
        />
      )}

      {selectedUserForDetails && (
        <DetailsModal
          title="Chi tiết Tài khoản / Nhân viên"
          fields={[
            { label: 'Tên đăng nhập', value: selectedUserForDetails.username },
            { label: 'Tên nhân viên', value: selectedUserForDetails.fullname },
            { label: 'Số điện thoại', value: selectedUserForDetails.phone || 'N/A' },
            { 
              label: 'Nhóm quyền', 
              value: roles.find((r) => r.id === selectedUserForDetails.role_id)?.name || 'Quản trị viên' 
            },
            { label: 'Mã QR Nhân Viên', value: selectedUserForDetails.qr_code },
            { 
              label: 'Quầy được gán', 
              value: selectedUserForDetails.assigned_counters && selectedUserForDetails.assigned_counters.length > 0
                ? selectedUserForDetails.assigned_counters.map((c: any) => c.name || c.code).join(', ')
                : 'Chưa phân quầy',
              isFullWidth: true
            },
          ]}
          onClose={() => setSelectedUserForDetails(null)}
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
          phone={phone} setPhone={setPhone} qrCode={qrCode} setQrCode={setQrCode} roleId={roleId} setRoleId={setRoleId}
          roles={roles}
          salesCounters={salesCounters}
          selectedCounterIds={selectedCounterIds}
          setSelectedCounterIds={setSelectedCounterIds}
          isSubmitting={isSubmitting}
          onClose={() => setShowUserModal(false)} onSubmit={handleCreateOrUpdateUser}
        />
      )}

      {showRoleModal && (
        <RoleModal
          editingRoleId={editingRoleId}
          roleCode={roleCode} setRoleCode={setRoleCode}
          roleName={roleName} setRoleName={setRoleName}
          rolePermissions={rolePermissions} setRolePermissions={setRolePermissions}
          allPermissions={permissions}
          isSubmitting={isSubmitting}
          onClose={() => setShowRoleModal(false)}
          onSubmit={handleCreateOrUpdateRole}
        />
      )}
    </div>
  );
};
