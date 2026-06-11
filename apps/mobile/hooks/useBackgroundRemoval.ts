import { useMutation } from '@tanstack/react-query';
import { removeBackground } from '../services/api';
import { useBGRemovalStore } from '../store';
import { PickedImage } from '../types';
import { sanitizeError } from '../services/errorSanitizer';

export default function useBackgroundRemoval() {
  const { setStatus, setResult, setError } = useBGRemovalStore();

  return useMutation({
    mutationFn: async (image: PickedImage) => {
      setStatus('processing');
      setError(null);

      const startTime = Date.now();
      const base64DataUri = await removeBackground(image.uri, image.mimeType, image.fileName);
      const durationMs = Date.now() - startTime;

      return {
        resultUri: base64DataUri,
        originalUri: image.uri,
        durationMs,
      };
    },
    onSuccess: (data) => {
      setResult(data);
      setStatus('done');
    },
    onError: (error: any) => {
      const errMsg = sanitizeError(error);
      setError(errMsg);
      setStatus('error');
    },
  });
}
