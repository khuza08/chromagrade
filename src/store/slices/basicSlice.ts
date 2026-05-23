import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface BasicState {
  exposure: number;
  toneHighlights: number;
  toneShadows: number;
  whites: number;
  blacks: number;
  texture: number;
  clarity: number;
  dehaze: number;
  profile: string;
  bw: boolean;
  hdr: boolean;
  hdrLimit: number;
  visualizeHdr: boolean;
  sdrPreview: boolean;
  sdrBrightness: number;
  sdrContrast: number;
  sdrClarity: number;
  sdrHighlights: number;
  sdrShadows: number;
  sdrWhites: number;
  sdrHighlightSat: number;
  wbPreset: 'as-shot' | 'auto' | 'custom';
}

const initialState: BasicState = {
  exposure: 0,
  toneHighlights: 0,
  toneShadows: 0,
  whites: 0,
  blacks: 0,
  texture: 0,
  clarity: 0,
  dehaze: 0,
  profile: "Color",
  bw: false,
  hdr: false,
  hdrLimit: 4,
  visualizeHdr: false,
  sdrPreview: false,
  sdrBrightness: 0,
  sdrContrast: 0,
  sdrClarity: 0,
  sdrHighlights: 0,
  sdrShadows: 0,
  sdrWhites: 0,
  sdrHighlightSat: 0,
  wbPreset: 'as-shot',
};

export const basicSlice = createSlice({
  name: "basic",
  initialState,
  reducers: {
    setExposure: (state, action: PayloadAction<number>) => {
      state.exposure = action.payload;
    },
    setToneHighlights: (state, action: PayloadAction<number>) => {
      state.toneHighlights = action.payload;
    },
    setToneShadows: (state, action: PayloadAction<number>) => {
      state.toneShadows = action.payload;
    },
    setWhites: (state, action: PayloadAction<number>) => {
      state.whites = action.payload;
    },
    setBlacks: (state, action: PayloadAction<number>) => {
      state.blacks = action.payload;
    },
    setTexture: (state, action: PayloadAction<number>) => {
      state.texture = action.payload;
    },
    setClarity: (state, action: PayloadAction<number>) => {
      state.clarity = action.payload;
    },
    setDehaze: (state, action: PayloadAction<number>) => {
      state.dehaze = action.payload;
    },
    setProfile: (state, action: PayloadAction<string>) => {
      state.profile = action.payload;
    },
    setBw: (state, action: PayloadAction<boolean>) => {
      state.bw = action.payload;
    },
    setHdr: (state, action: PayloadAction<boolean>) => {
      state.hdr = action.payload;
    },
    setHdrLimit: (state, action: PayloadAction<number>) => {
      state.hdrLimit = action.payload;
    },
    setVisualizeHdr: (state, action: PayloadAction<boolean>) => {
      state.visualizeHdr = action.payload;
    },
    setSdrPreview: (state, action: PayloadAction<boolean>) => {
      state.sdrPreview = action.payload;
    },
    setSdrBrightness: (state, action: PayloadAction<number>) => {
      state.sdrBrightness = action.payload;
    },
    setSdrContrast: (state, action: PayloadAction<number>) => {
      state.sdrContrast = action.payload;
    },
    setSdrClarity: (state, action: PayloadAction<number>) => {
      state.sdrClarity = action.payload;
    },
    setSdrHighlights: (state, action: PayloadAction<number>) => {
      state.sdrHighlights = action.payload;
    },
    setSdrShadows: (state, action: PayloadAction<number>) => {
      state.sdrShadows = action.payload;
    },
    setSdrWhites: (state, action: PayloadAction<number>) => {
      state.sdrWhites = action.payload;
    },
    setSdrHighlightSat: (state, action: PayloadAction<number>) => {
      state.sdrHighlightSat = action.payload;
    },
    setWbPreset: (state, action: PayloadAction<BasicState['wbPreset']>) => {
      state.wbPreset = action.payload;
    },
    resetBasic: () => initialState,
    applyBasicSnapshot: (state, action: PayloadAction<Partial<BasicState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setExposure,
  setToneHighlights,
  setToneShadows,
  setWhites,
  setBlacks,
  setTexture,
  setClarity,
  setDehaze,
  setProfile,
  setBw,
  setHdr,
  setHdrLimit,
  setVisualizeHdr,
  setSdrPreview,
  setSdrBrightness,
  setSdrContrast,
  setSdrClarity,
  setSdrHighlights,
  setSdrShadows,
  setSdrWhites,
  setSdrHighlightSat,
  setWbPreset,
  resetBasic,
  applyBasicSnapshot,
} = basicSlice.actions;

export default basicSlice.reducer;
