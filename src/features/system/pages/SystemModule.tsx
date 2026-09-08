import React from 'react';
import SystemDataPage from './SystemDataPage';

interface SystemModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const SystemModule = ({ subTab, onSelectSubTab }: SystemModuleProps) => {
  return (
    <div className="w-full">
      {subTab === 'BackupRestore' && <SystemDataPage />}
      {!subTab && <SystemDataPage />}
    </div>
  );
};
