import React, { useState, useEffect } from 'react';
import { iamService } from '../../../api/iamService';
import { User, Role, Permission } from '../../../shared/types/hpticket';

export const useIAM = (initialTab: string) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedBadgeUser, setSelectedBadgeUser] = useState<User | null>(null);
  const [badgeQrMode, setBadgeQrMode] = useState<'text' | 'vcard' | 'code'>('text');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useEffect(() => {
    iamService.fetchUsers().then(res => setUsers(res.data || []));
    iamService.fetchRoles().then(res => setRoles(res.data || []));
    iamService.fetchPermissions().then(res => setPermissions(res.data || []));
  }, []);

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
  const [roleId, setRoleId] = useState('');

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
            role_id: roleId,
            ...(password ? { password } : {})
        });
        if (res.code === 200) {
            setUsers(prev => prev.map(u => u.id === editingUserId ? {...u, fullname, username, phone, role_id: roleId} : u));
        }
    } else {
        const qrCodeStr = `EMP-${roleId.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const res = await iamService.createUser({
          fullname,
          username,
          password: password || '123456',
          phone,
          qr_code: qrCodeStr,
          role_id: roleId,
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
    setRoleId(roles[1]?.id || roles[0]?.id || 'role-2');
    setShowUserModal(true);
  };

  const openEditUserModal = (item: any) => {
    setEditingUserId(item.id);
    setFullname(item.fullname);
    setUsername(item.username);
    setPassword('');
    setPhone(item.phone || '');
    setRoleId(item.role_id || roles[1]?.id || 'role-2');
    setShowUserModal(true);
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
    roleId, setRoleId,
    handleCreateOrUpdateUser,
    handleDeleteUsers,
    handleToggleUserActive,
    openNewUserModal,
    openEditUserModal
  };
};
