import axios from 'axios';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    let message = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;

    if (typeof message === 'object' && message !== null) {
      if (Array.isArray(message)) {
        message = message
          .map((err: any) => `${err.loc ? err.loc.join('.') : 'field'}: ${err.msg}`)
          .join(', ');
      } else {
        message = JSON.stringify(message);
      }
    }

    if (status === 401) {
      console.warn('[BGlyt API] 401 Unauthorized');
    }

    return Promise.reject({ status, code: error.code ?? 'UNKNOWN', message });
  },
);

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


export const removeBackground = async (
  imageUri: string,
  mimeType?: string,
  fileName?: string
): Promise<string> => {
  const type = mimeType || 'image/jpeg';
  const name = fileName || 'upload.jpg';
  
  if (Platform.OS === 'web') {
    const formData = new FormData();
    const res = await fetch(imageUri);
    const blob = await res.blob();
    formData.append('file', blob, name);

    const response = await api.post('/api/remove-background', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.image;
  } else {
    const uploadResult = await FileSystem.uploadAsync(
      `${BASE_URL}/api/remove-background`,
      imageUri,
      {
        fieldName: 'file',
        httpMethod: 'POST',
        uploadType: FileSystemUploadType.MULTIPART,
        mimeType: type,
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      let errMsg = 'Failed to remove background.';
      try {
        const errData = JSON.parse(uploadResult.body);
        errMsg = errData?.detail ?? errData?.message ?? errMsg;
        if (Array.isArray(errMsg)) {
          errMsg = errMsg
            .map((err: any) => `${err.loc ? err.loc.join('.') : 'field'}: ${err.msg}`)
            .join(', ');
        }
      } catch (_) {
        if (uploadResult.body) {
          errMsg = uploadResult.body;
        }
      }
      throw new Error(errMsg);
    }

    const data = JSON.parse(uploadResult.body);
    return data.image;
  }
};

export default api;
