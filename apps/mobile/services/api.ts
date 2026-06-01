import axios from 'axios';

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
    const message = error.response?.data?.detail ?? error.response?.data?.message ?? error.message;

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
  const formData = new FormData();
  
  const type = mimeType || 'image/jpeg';
  const name = fileName || 'upload.jpg';
  
  formData.append('file', {
    uri: imageUri,
    name: name,
    type: type,
  } as any);

  const response = await api.post('/api/remove-background', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    responseType: 'arraybuffer',
  });

  const base64 = arrayBufferToBase64(response.data);
  return `data:image/png;base64,${base64}`;
};

export default api;
