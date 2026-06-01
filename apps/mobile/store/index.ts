import { create } from 'zustand';
import type { ProcessingStatus, PickedImage, BackgroundRemovalResult } from '../types/index';

interface BGRemovalState {
  sourceImage: PickedImage | null;
  status: ProcessingStatus;
  result: BackgroundRemovalResult | null;
  errorMessage: string | null;

  setSourceImage: (image: PickedImage | null) => void;
  setStatus: (status: ProcessingStatus) => void;
  setResult: (result: BackgroundRemovalResult | null) => void;
  setError: (message: string | null) => void;
  reset: () => void;
}

const initialState = {
  sourceImage: null,
  status: 'idle' as ProcessingStatus,
  result: null,
  errorMessage: null,
};

export const useBGRemovalStore = create<BGRemovalState>((set) => ({
  ...initialState,

  setSourceImage: (image) => set({ sourceImage: image }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result, status: result ? 'done' : 'idle' }),
  setError: (message) => set({ errorMessage: message, status: 'error' }),
  reset: () => set(initialState),
}));
