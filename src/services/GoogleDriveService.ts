import { WeightEntry, GLP1Entry, GLP1Protocol, Peptide, PeptideLogEntry, UserProfile } from '../types';
import { db } from '../db/dexie';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const TOKEN_KEY = 'glpal_google_token';
const REFRESH_TOKEN_KEY = 'glpal_google_refresh_token';

export interface BackupData {
  version: number;
  timestamp: string;
  weights: WeightEntry[];
  medications: GLP1Entry[];
  protocols: GLP1Protocol[];
  peptides: Peptide[];
  peptideLogs: PeptideLogEntry[];
  userProfile: UserProfile | null;
}

export interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
  size: number;
}

class GoogleDriveService {
  private gapiLoaded = false;
  private gisLoaded = false;
  private tokenClient: any = null;
  private accessToken: string | null = null;

  async loadGapiScript(): Promise<void> {
    if (this.gapiLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });
            this.gapiLoaded = true;
            console.log('Google API client initialized successfully');
            resolve();
          } catch (error: any) {
            console.error('Failed to initialize gapi client:', error);
            if (error.message?.includes('Failed to fetch')) {
              reject(new Error('Failed to connect to Google API. Check API key restrictions and ensure Drive API is enabled in Google Cloud Console.'));
            } else {
              reject(error);
            }
          }
        });
      };
      script.onerror = (e) => {
        console.error('Failed to load gapi script:', e);
        reject(new Error('Failed to load Google API script. Check your internet connection.'));
      };
      document.body.appendChild(script);
    });
  }

  async loadGisScript(): Promise<void> {
    if (this.gisLoaded) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.gisLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Google Drive service...');
      console.log('Client ID:', GOOGLE_CLIENT_ID ? 'set' : 'missing');
      console.log('API Key:', API_KEY ? 'set' : 'missing');
      
      await Promise.all([this.loadGapiScript(), this.loadGisScript()]);

      if (!GOOGLE_CLIENT_ID || !API_KEY) {
        throw new Error('Google API credentials not configured. Check .env.development file.');
      }

      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        access_type: 'offline',
        prompt: 'consent',
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            localStorage.setItem(TOKEN_KEY, response.access_token);
            if (response.refresh_token) {
              localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
            }
          }
        },
      });
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive service:', error);
      throw error;
    }
  }

  async signIn(): Promise<boolean> {
    try {
      if (!this.tokenClient) {
        await this.initialize();
      }

      return new Promise((resolve) => {
        this.tokenClient.callback = (response: any) => {
          console.log('OAuth response:', response);
          if (response.access_token) {
            this.accessToken = response.access_token;
            localStorage.setItem(TOKEN_KEY, response.access_token);
            if (response.refresh_token) {
              localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
              console.log('Refresh token received and stored');
            } else {
              console.warn('No refresh token in response. This might be due to: 1) App in testing mode with >100 users, 2) Previous consent still valid, 3) Google decided not to issue a new refresh token');
            }
            resolve(true);
          } else if (response.error) {
            console.error('OAuth error:', response.error, response.error_description);
            resolve(false);
          } else {
            console.warn('OAuth response has no access_token or error');
            resolve(false);
          }
        };
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  signOut(): void {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && (window as any).google?.accounts?.oauth2) {
        (window as any).google.accounts.oauth2.revoke(token);
      }
    } catch (e) {
      console.warn('Failed to revoke token:', e);
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken = null;
  }

  forceSignOut(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.accessToken = null;
  }

  isSignedIn(): boolean {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  async ensureGapiReady(): Promise<void> {
    if (!this.gapiLoaded) {
      await this.loadGapiScript();
    }
  }

  async ensureValidToken(): Promise<void> {
    await this.ensureGapiReady();
    
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!token) {
      throw new Error('Not signed in');
    }

    try {
      (window as any).gapi.client.setToken({ access_token: token });
      await (window as any).gapi.client.drive.about.get({ fields: 'user' });
      this.accessToken = token;
    } catch (error: any) {
      console.error('Token validation error:', error);
      const errorStr = JSON.stringify(error);
      if ((error.status === 401 || errorStr.includes('401')) && refreshToken) {
        await this.refreshAccessToken(refreshToken);
      } else if (error.status === 400 || error.status === 403 || errorStr.includes('400') || errorStr.includes('403') || errorStr.includes('invalid') || errorStr.includes('revoked')) {
        this.signOut();
        throw new Error('Session expired. Please sign in again.');
      } else {
        throw error;
      }
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      localStorage.setItem(TOKEN_KEY, data.access_token);
      (window as any).gapi.client.setToken({ access_token: data.access_token });
    } catch (error) {
      this.signOut();
      throw new Error('Session expired. Please sign in again.');
    }
  }

  private async getOrCreateBackupFolder(): Promise<string> {
    await this.ensureValidToken();

    const folderName = 'GLPal Backups';

    const response = await (window as any).gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    const createResponse = await (window as any).gapi.client.drive.files.create({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    });

    return createResponse.result.id;
  }

  async exportAllData(): Promise<BackupData> {
    const [weights, medications, protocols, peptides, peptideLogs] = await Promise.all([
      db.weights.toArray(),
      db.medications.toArray(),
      db.protocols.toArray(),
      db.peptides.toArray(),
      db.peptideLogs.toArray(),
    ]);

    const userProfileArray = await db.userProfile.toArray();
    const userProfile = userProfileArray.length > 0 ? userProfileArray[0] : null;

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      weights,
      medications,
      protocols,
      peptides,
      peptideLogs,
      userProfile,
    };
  }

  async uploadBackup(data: BackupData): Promise<BackupFile> {
    await this.ensureValidToken();

    const folderId = await this.getOrCreateBackupFolder();
    const date = new Date().toISOString().split('T')[0];
    const fileName = `glpal-backup-${date}.json`;

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload backup');
    }

    const result = await response.json();
    return {
      id: result.id,
      name: result.name,
      createdTime: result.createdTime,
      size: parseInt(result.size || '0'),
    };
  }

  async listBackups(limit: number = 5): Promise<BackupFile[]> {
    await this.ensureValidToken();

    const folderId = await this.getOrCreateBackupFolder();

    const response = await (window as any).gapi.client.drive.files.list({
      q: `'${folderId}' in parents and name contains 'glpal-backup' and mimeType='application/json' and trashed=false`,
      fields: 'files(id, name, createdTime, size)',
      spaces: 'drive',
      orderBy: 'createdTime desc',
      pageSize: limit,
    });

    return (response.result.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      createdTime: file.createdTime,
      size: parseInt(file.size || '0'),
    }));
  }

  async downloadBackup(fileId: string): Promise<BackupData> {
    await this.ensureValidToken();

    const response = await (window as any).gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    });

    return JSON.parse(response.body);
  }

  async deleteBackup(fileId: string): Promise<void> {
    await this.ensureValidToken();

    await (window as any).gapi.client.drive.files.delete({
      fileId,
    });
  }

  async restoreData(data: BackupData, mode: 'merge' | 'replace'): Promise<void> {
    if (mode === 'replace') {
      await db.weights.clear();
      await db.medications.clear();
      await db.protocols.clear();
      await db.peptides.clear();
      await db.peptideLogs.clear();
      await db.userProfile.clear();
    }

    if (data.weights && data.weights.length > 0) {
      if (mode === 'merge') {
        for (const entry of data.weights) {
          await db.weights.put(entry);
        }
      } else {
        await db.weights.bulkPut(data.weights);
      }
    }

    if (data.medications && data.medications.length > 0) {
      if (mode === 'merge') {
        for (const entry of data.medications) {
          await db.medications.put(entry);
        }
      } else {
        await db.medications.bulkPut(data.medications);
      }
    }

    if (data.protocols && data.protocols.length > 0) {
      if (mode === 'merge') {
        for (const entry of data.protocols) {
          await db.protocols.put(entry);
        }
      } else {
        await db.protocols.bulkPut(data.protocols);
      }
    }

    if (data.peptides && data.peptides.length > 0) {
      if (mode === 'merge') {
        for (const entry of data.peptides) {
          await db.peptides.put(entry);
        }
      } else {
        await db.peptides.bulkPut(data.peptides);
      }
    }

    if (data.peptideLogs && data.peptideLogs.length > 0) {
      if (mode === 'merge') {
        for (const entry of data.peptideLogs) {
          await db.peptideLogs.put(entry);
        }
      } else {
        await db.peptideLogs.bulkPut(data.peptideLogs);
      }
    }

    if (data.userProfile) {
      const existing = await db.userProfile.toArray() as Array<UserProfile & { id: number }>;
      const profileData: any = { ...data.userProfile };
      if (existing.length > 0) {
        profileData.id = existing[0].id;
        await db.userProfile.put(profileData);
      } else {
        await db.userProfile.add(profileData);
      }
    }
  }
}

export const googleDriveService = new GoogleDriveService();
