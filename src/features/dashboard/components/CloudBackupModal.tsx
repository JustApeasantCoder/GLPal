import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { googleDriveService, BackupFile, BackupData } from '../../../services/GoogleDriveService';

interface CloudBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onDataRestored: () => void;
}

type ModalTab = 'backup' | 'restore';

const CloudBackupModal: React.FC<CloudBackupModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<ModalTab>('backup');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      document.body.classList.add('modal-open');
      setError('');
      checkSignInStatus();
    } else if (isVisible && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
        document.body.classList.remove('modal-open');
      }, 200);
    }
  }, [isOpen]);

  const checkSignInStatus = async () => {
    const hasToken = !!localStorage.getItem('glpal_google_token');
    if (!hasToken) {
      setIsSignedIn(false);
      return;
    }
    
    try {
      await googleDriveService.ensureGapiReady();
      await googleDriveService.ensureValidToken();
      setIsSignedIn(true);
      await loadBackups();
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('Session expired') || errorMsg.includes('Not signed in') || err.status === 401 || err.status === 403) {
        googleDriveService.forceSignOut();
        setIsSignedIn(false);
      } else {
        setIsSignedIn(true);
      }
    }
  };

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      setError('');
      const list = await googleDriveService.listBackups(5);
      setBackups(list);
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (errorMsg.includes('Session expired') || errorMsg.includes('Not signed in') || err.status === 401 || err.status === 403) {
        googleDriveService.signOut();
        setIsSignedIn(false);
        setError('Session expired. Please sign in again.');
      } else {
        setError(err.message || 'Failed to load backups');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      const success = await googleDriveService.signIn();
      if (success) {
        await checkSignInStatus();
      } else {
        setError('Sign in was cancelled');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    googleDriveService.signOut();
    setIsSignedIn(false);
    setBackups([]);
    setSelectedBackup(null);
    setError('');
  };

  const handleBackup = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Exporting data...');
      
      const data = await googleDriveService.exportAllData();
      
      setStatus('Uploading to Google Drive...');
      await googleDriveService.uploadBackup(data);
      
      setStatus('Backup complete!');
      await loadBackups();
      setTimeout(() => setStatus(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create backup');
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;

    try {
      setIsLoading(true);
      setError('');
      setStatus('Downloading backup...');
      
      const data = await googleDriveService.downloadBackup(selectedBackup.id);
      
      setStatus('Restoring data...');
      await googleDriveService.restoreData(data, restoreMode);
      
      setStatus('Restore complete!');
      onDataRestored();
      setTimeout(() => {
        setStatus('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to restore backup');
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      setIsLoading(true);
      setError('');
      await googleDriveService.deleteBackup(fileId);
      await loadBackups();
    } catch (err: any) {
      setError(err.message || 'Failed to delete backup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
            Cloud Backup
          </h2>
          <div className={`text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30`}>
            DEV
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
            {error}
          </div>
        )}

        {status && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            {status}
          </div>
        )}

        {!isSignedIn ? (
          <div className="flex-1 text-center py-8">
            <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Sign in with Google to backup and restore your data
            </p>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-[#B19CD9] to-[#9C7BD3] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Sign in with Google'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('backup')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'backup'
                    ? 'text-[#B19CD9] border-b-2 border-[#B19CD9]'
                    : isDarkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                Backup
              </button>
              <button
                onClick={() => setActiveTab('restore')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'restore'
                    ? 'text-[#B19CD9] border-b-2 border-[#B19CD9]'
                    : isDarkMode
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}
              >
                Restore
              </button>
            </div>

            {activeTab === 'backup' && (
              <div className="flex-1">
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Create a backup of all your data (weights, medications, protocols, peptides, and user profile) and save it to Google Drive.
                </p>

                <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-[#B19CD9]/10' : 'bg-blue-50'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-[#B19CD9]' : 'text-blue-700'}`}>
                    Backups are saved to "GLPal Backups" folder in your Google Drive.
                  </p>
                </div>

                <button
                  onClick={handleBackup}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Creating Backup...' : 'Create Backup Now'}
                </button>

                <button
                  onClick={handleSignOut}
                  className={`w-full mt-3 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            )}

            {activeTab === 'restore' && (
              <div className="flex-1 overflow-y-auto max-h-[400px]">
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Select a backup to restore. Your data will be merged with or replace existing data based on your choice.
                </p>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Restore Mode
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Merge (add to existing data)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mr-2"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Replace (clear and import fresh)
                      </span>
                    </label>
                  </div>
                  {restoreMode === 'merge' && (
                    <p className={`text-xs mt-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      Warning: Merge may create duplicate entries.
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Available Backups
                  </h3>
                  {isLoading && backups.length === 0 ? (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
                  ) : backups.length === 0 ? (
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No backups found</p>
                  ) : (
                    <div className="space-y-2">
                      {backups.map((backup) => (
                        <div
                          key={backup.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedBackup?.id === backup.id
                              ? 'border-[#B19CD9] bg-[#B19CD9]/10'
                              : isDarkMode
                                ? 'border-gray-600 hover:bg-gray-700'
                                : 'border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedBackup(backup)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {backup.name}
                              </p>
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatDate(backup.createdTime)} • {formatSize(backup.size)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBackup(backup.id);
                              }}
                              className={`p-1 rounded ${isDarkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleRestore}
                  disabled={!selectedBackup || isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#4ADEA8] to-[#4FD99C] text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Restoring...' : 'Restore Selected Backup'}
                </button>

                <button
                  onClick={handleSignOut}
                  className={`w-full mt-3 py-2 border rounded-lg transition-colors ${
                    isDarkMode
                      ? 'border-gray-600 text-gray-400 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            )}
          </>
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

export default CloudBackupModal;
