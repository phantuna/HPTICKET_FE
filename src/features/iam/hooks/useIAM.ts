import React, { useState, useEffect } from 'react';
import { iamService } from '../../../api/iamService';
import { salesService } from '../../../api/salesService';
import { User, Role, Permission } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';

const globalIamCache: any = { users: null, roles: null, perms: null };

export const useIAM = (initialTab: string) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const [users, setUsers] = useState<User[]>(globalIamCache.users || []);
  const [roles, setRoles] = useState<Role[]>(globalIamCache.roles || []);
  const [permissions, setPermissions] = useState<Permission[]>(globalIamCache.perms || []);
  const [selectedBadgeUser, setSelectedBadgeUser] = useState<User | null>(null);
  const [badgeQrMode, setBadgeQrMode] = useState<'text' | 'vcard' | 'code'>('text');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'KhaiBaoPhanQuyen') {
      if (!globalIamCache.roles) { iamService.fetchRoles().then(res => { setRoles(res.data || []); globalIamCache.roles = res.data; }); }
      if (!globalIamCache.perms) { iamService.fetchPermissions().then(res => { setPermissions(res.data || []); globalIamCache.perms = res.data; }); }
    } else if (activeSubTab === 'KhaibaoDangNhap' || activeSubTab === 'KhaiBaoThe_NV') {
      if (!globalIamCache.users) { iamService.fetchUsers().then(res => { setUsers(res.data || []); globalIamCache.users = res.data; }); }
      if (!globalIamCache.roles) { iamService.fetchRoles().then(res => { setRoles(res.data || []); globalIamCache.roles = res.data; }); }
    }
  }, [activeSubTab]);

  const [scanInput, setScanInput] = useState('');
  const [scannedStaff, setScannedStaff] = useState<User | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  const handleScanStaffQR = (codeToScan?: string) => {
    const input = (codeToScan || scanInput).trim();
    if (!input) return;

    setHasScanned(true);
    const found = users.find(
      (u) =>
        u.qr_code === input ||
        u.username === input ||
        u.phone === input ||
        u.qr_code.toLowerCase() === input.toLowerCase() ||
        u.fullname.toLowerCase().includes(input.toLowerCase())
    );

    setScannedStaff(found || null);
  };

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [roleId, setRoleId] = useState('');
  const [selectedCounterIds, setSelectedCounterIds] = useState<string[]>([]);
  const [salesCounters, setSalesCounters] = useState<any[]>([]);

  // Load sales counters when needed
  useEffect(() => {
    if (activeSubTab === 'KhaibaoDangNhap' || activeSubTab === 'KhaiBaoThe_NV') {
      salesService.fetchSalesCounters().then(res => setSalesCounters(res.data || []));
    }
  }, [activeSubTab]);

  // Set default roleId when roles load
  useEffect(() => {
    if (roles.length > 0 && !roleId) {
      setRoleId(roles[1]?.id || roles[0]?.id || 'role-2');
    }
  }, [roles, roleId]);

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !username) return;

    if (editingUserId) {
        const res = await iamService.updateUser(editingUserId, {
            fullname,
            username,
            phone,
            qr_code: qrCode || undefined,
            role_id: roleId,
            assigned_counter_ids: selectedCounterIds,
            ...(password ? { password } : {})
        });
        if (res.code === 200) {
            setUsers(prev => prev.map(u => u.id === editingUserId ? {...u, fullname, username, phone, qr_code: qrCode || u.qr_code, role_id: roleId} : u));
        }
    } else {
        const qrCodeStr = qrCode || `EMP-${roleId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const res = await iamService.createUser({
          fullname,
          username,
          password: password || '123456',
          phone,
          qr_code: qrCodeStr,
          role_id: roleId,
          assigned_counter_ids: selectedCounterIds,
          is_active: true,
        });

        if (res.code === 201 && res.data) {
          setUsers(prev => [...prev, res.data]);
        }
    }

    setShowUserModal(false);
    setEditingUserId(null);
    setFullname('');
    setUsername('');
    setPassword('');
    setPhone('');
    setQrCode('');
    setSelectedCounterIds([]);
  };

  const handleDeleteUsers = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await iamService.deleteUser(String(id));
    }
    setUsers((prev) => prev.filter((u) => !ids.includes(u.id)));
  };

  const handleToggleUserActive = async (id: string | number, currentActive: boolean) => {
    const newActive = !currentActive;
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: newActive, isActive: newActive, active: newActive } : u))
    );
    await iamService.updateUserStatus(id as string, newActive);
  };

  const openNewUserModal = () => {
    setEditingUserId(null);
    setFullname('');
    setUsername('');
    setPassword('');
    setPhone('');
    setQrCode('');
    setRoleId(roles[1]?.id || roles[0]?.id || 'role-2');
    setSelectedCounterIds([]);
    setShowUserModal(true);
  };

  const openEditUserModal = (item: any) => {
    setEditingUserId(item.id);
    setFullname(item.fullname);
    setUsername(item.username);
    setPassword('');
    setPhone(item.phone || '');
    setQrCode(item.qr_code || '');
    setRoleId(item.role_id || roles[1]?.id || 'role-2');
    // Load các quầy đang được gán cho user này
    const existingCounterIds = (item.assigned_counters || []).map((c: any) => c.id).filter(Boolean);
    setSelectedCounterIds(existingCounterIds);
    setShowUserModal(true);
  };

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleCode, setRoleCode] = useState('');
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const handleCreateOrUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleCode || !roleName) return;

    try {
      if (editingRoleId) {
        const res = await iamService.updateRole(editingRoleId, {
          code: roleCode,
          name: roleName,
          permissions: rolePermissions
        });
        if (res.code === 200) {
          // Lấy lại danh sách sau khi sửa (hoặc cập nhật state thủ công, nhưng fetch lại cho chắc do cần load permission)
          iamService.fetchRoles().then(r => setRoles(r.data || []));
        }
      } else {
        const res = await iamService.createRole({
          code: roleCode,
          name: roleName,
          is_active: true,
          permissions: rolePermissions
        } as Role);
        if (res.code === 201) {
          iamService.fetchRoles().then(r => setRoles(r.data || []));
        }
      }
      setShowRoleModal(false);
      setEditingRoleId(null);
      setRoleCode('');
      setRoleName('');
      setRolePermissions([]);
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
      console.error(err);
    }
  };

  const handleDeleteRoles = async (ids: (string | number)[]) => {
    try {
      for (const id of ids) {
        await iamService.deleteRole(String(id));
      }
      setRoles(prev => prev.filter(r => !ids.includes(r.id)));
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
      console.error(err);
    }
  };

  const handleToggleRoleActive = async (id: string | number, currentActive: boolean) => {
    const newActive = !currentActive;
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: newActive, isActive: newActive } : r))
    );
    try {
      await iamService.updateRoleStatus(String(id), newActive);
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
      console.error(err);
    }
  };

  const openNewRoleModal = () => {
    setEditingRoleId(null);
    setRoleCode('');
    setRoleName('');
    setRolePermissions([]);
    setShowRoleModal(true);
  };

  const openEditRoleModal = (item: any) => {
    setEditingRoleId(item.id);
    setRoleCode(item.code || '');
    setRoleName(item.name || '');
    setRolePermissions(item.permissions || []);
    setShowRoleModal(true);
  };

  return {
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
    editingUserId, setEditingUserId,
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
    
    // Role management
    showRoleModal, setShowRoleModal,
    editingRoleId, setEditingRoleId,
    roleCode, setRoleCode,
    roleName, setRoleName,
    rolePermissions, setRolePermissions,
    handleCreateOrUpdateRole,
    handleDeleteRoles,
    handleToggleRoleActive,
    openNewRoleModal,
    openEditRoleModal
  };
};
