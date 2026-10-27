import { useState } from 'react';
import type { LegacyExport } from '../../shared/types.js';

const LEGACY_KEYS = ['tasks', 'cellsData', 'title', 'headerText'];

// Before the Docker version, everything lived in this browser's localStorage
function readLegacyData(): LegacyExport | null {
  try {
    const tasks = JSON.parse(localStorage.getItem('tasks') ?? '[]');
    if (!Array.isArray(tasks) || tasks.length === 0) return null;
    return {
      tasks,
      cellData: JSON.parse(localStorage.getItem('cellsData') ?? '[]'),
      title: localStorage.getItem('title') ?? undefined,
      headerText: localStorage.getItem('headerText') ?? undefined,
    };
  } catch {
    return null;
  }
}

interface ImportBannerProps {
  onImport: (data: LegacyExport) => Promise<boolean>;
}

const ImportBanner = ({ onImport }: ImportBannerProps) => {
  const [legacyData, setLegacyData] = useState(readLegacyData);

  if (!legacyData) return null;

  const handleImport = async () => {
    if (!(await onImport(legacyData))) return;
    LEGACY_KEYS.forEach(key => localStorage.removeItem(key));
    setLegacyData(null);
  };

  return (
    <div className="import-banner">
      <span>
        Found {legacyData.tasks.length} task{legacyData.tasks.length === 1 ? '' : 's'} saved in this browser by the
        old version of Sheet-Like Plan. Import them into this plan?
      </span>
      <button className="apply-button" onClick={handleImport}>Import</button>
      <button className="cancel-button" onClick={() => setLegacyData(null)}>Not now</button>
    </div>
  );
};

export default ImportBanner;
