import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile } from '../../../types';
import { dataImportExportService } from '../../../services/DataImportExportService';
import { ImportPreview, ImportResult, ImportMode } from '../../../utils/csvTypes';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onImportComplete: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [includeData, setIncludeData] = useState(true);
  const [includeUserSettings, setIncludeUserSettings] = useState(true);
  const [importWeightUnit, setImportWeightUnit] = useState<'auto' | 'kg' | 'lbs'>('auto');
  const [offsetDays, setOffsetDays] = useState(0);
  const [offsetHours, setOffsetHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      document.body.classList.add('modal-open');
      setPreview(null);
      setImportResult(null);
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen]);

  const handleExport = () => {
    dataImportExportService.exportData();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const preview = dataImportExportService.parseImportFile(content, importWeightUnit);
      setPreview(preview);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!preview) return;

    setIsLoading(true);
    setTimeout(() => {
      const result = dataImportExportService.importData(importMode, {
        includeData,
        includeUserSettings,
        importWeightUnit,
        offsetDays,
        offsetHours,
      });
      setImportResult(result);
      setIsLoading(false);
      if (result.success) {
        onImportComplete();
      }
    }, 100);
  };

  const handleResetImport = () => {
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isVisible) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className={`fixed inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'}`}
        style={{ backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />
      <div
        className={`relative rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] p-4 sm:p-6 overflow-hidden flex flex-col ${
          isClosing ? 'modal-fade-out' : 'modal-content-fade-in'
        } ${
          isDarkMode
            ? 'bg-gradient-to-b from-[#1a1625]/70 to-[#0d0a15]/95 border border-[#B19CD9]/30'
            : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Import / Export Data
          </h2>
        </div>

        <div className="flex border-b mb-4">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-[#B19CD9] border-b-2 border-[#B19CD9]'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
          >
            Export
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-[#B19CD9] border-b-2 border-[#B19CD9]'
                : isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-500'
            }`}
          >
            Import
          </button>
        </div>

        {activeTab === 'export' && (
          <div className="flex-1">
            <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Export all your data to a CSV file. You can use this file to back up your data or transfer it to another device.
            </p>
            
            <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-[#B19CD9]/10' : 'bg-blue-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-[#B19CD9]' : 'text-blue-700'}`}>
                Export includes: Weight logs, Dose logs, Side effects, and User settings.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Download CSV
            </button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="flex-1 overflow-y-auto">
            {!preview && !importResult && (
              <>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Import data from a CSV file. Select a file to see a preview before importing.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className={`w-full p-3 border rounded-lg mb-4 cursor-pointer ${
                    isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />

                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                    <strong>Note:</strong> Merge mode may create duplicates. Replace mode will clear all existing data before importing.
                  </p>
                </div>
              </>
            )}

            {preview && (
              <>
                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Import Preview
                  </h3>
                  <div className={`grid grid-cols-2 gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className={`p-2 rounded ${isDarkMode ? 'bg-[#B19CD9]/10' : 'bg-gray-100'}`}>
                      Data Entries: <strong>{preview.entries}</strong>
                    </div>
                    <div className={`p-2 rounded ${isDarkMode ? 'bg-[#B19CD9]/10' : 'bg-gray-100'}`}>
                      User Settings: <strong>{preview.userSettings}</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Import Mode
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Merge (add to existing data)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Replace (clear and import fresh)
                      </span>
                    </label>
                  </div>
                  {importMode === 'merge' && (
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      Warning: Merge may create duplicate entries if the same dates already exist.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Data to Import
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeData}
                        onChange={(e) => setIncludeData(e.target.checked)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Data entries (weight, dose, side effects)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeUserSettings}
                        onChange={(e) => setIncludeUserSettings(e.target.checked)}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>User settings</span>
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Weight Unit
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setImportWeightUnit('auto')}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                        importWeightUnit === 'auto'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : isDarkMode
                            ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      Auto Detect
                    </button>
                    <button
                      onClick={() => setImportWeightUnit('kg')}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                        importWeightUnit === 'kg'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : isDarkMode
                            ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      KG
                    </button>
                    <button
                      onClick={() => setImportWeightUnit('lbs')}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                        importWeightUnit === 'lbs'
                          ? 'bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white shadow-[0_0_15px_rgba(177,156,217,0.4)]'
                          : isDarkMode
                            ? 'bg-[#B19CD9]/10 text-[#B19CD9] border border-[#B19CD9]/30 hover:bg-[#B19CD9]/20'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      LBS
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Date Offset (for timezone adjustments)
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Days
                      </label>
                      <input
                        type="number"
                        value={offsetDays}
                        onChange={(e) => setOffsetDays(parseInt(e.target.value) || 0)}
                        className={`w-full p-2 rounded-lg border text-sm transition-all ${
                          isDarkMode 
                            ? 'border-[#B19CD9]/50 bg-black/40 text-white placeholder-[#B19CD9]/50' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <label className={`text-xs block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Hours
                      </label>
                      <input
                        type="number"
                        value={offsetHours}
                        onChange={(e) => setOffsetHours(parseInt(e.target.value) || 0)}
                        className={`w-full p-2 rounded-lg border text-sm transition-all ${
                          isDarkMode 
                            ? 'border-[#B19CD9]/50 bg-black/40 text-white placeholder-[#B19CD9]/50' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Use this to fix date issues from timezone differences
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleResetImport}
                    className={`flex-1 py-2 border rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isLoading || (preview.entries + preview.userSettings) === 0}
                    className="flex-1 py-2 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </>
            )}

            {importResult && (
              <div>
                <div className={`p-4 rounded-lg mb-4 ${importResult.success 
                  ? (isDarkMode ? 'bg-green-900/30' : 'bg-green-50') 
                  : (isDarkMode ? 'bg-red-900/30' : 'bg-red-50')}`}>
                  <h3 className={`font-medium mb-2 ${importResult.success 
                    ? (isDarkMode ? 'text-green-400' : 'text-green-700') 
                    : (isDarkMode ? 'text-red-400' : 'text-red-700')}`}>
                    Import Complete
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Imported: {importResult.imported} entries<br />
                    Skipped: {importResult.skipped} entries<br />
                    {importResult.errors.length > 0 && (
                      <>
                        Errors: {importResult.errors.length}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white rounded-lg font-medium"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-card-border">
          <button
            onClick={onClose}
            className={`px-6 py-2 transition-all duration-300 ${
              isDarkMode
                ? 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImportExportModal;
