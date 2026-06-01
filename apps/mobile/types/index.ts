export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  mimeType?: string;
  fileSize?: number;
  fileName?: string;
}

export type ProcessingStatus =
  | 'idle'
  | 'picking'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

export interface BackgroundRemovalResult {
  resultUri: string;
  originalUri: string;
  durationMs?: number;
}

export interface BackgroundRemovalError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export interface UserSession {
  id: string;
  email?: string;
  creditsRemaining: number;
}

export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
}
