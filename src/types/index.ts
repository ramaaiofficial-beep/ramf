export interface Song {
  id: number;
  name: string;
  artist: string;
  file_name: string;
  download_url: string;
  upload_date: string;
  file_size: number;
  duration: string;
}

export interface SongData {
  name: string;
  artist: string;
  duration: string;
}

export interface ConnectionStatus {
  status: 'testing' | 'connected' | 'failed';
}

export type ViewType = 'user' | 'admin';
export type TabType = 'upload' | 'manage';
