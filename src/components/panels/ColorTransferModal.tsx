import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Upload, Loader2, Wand2 } from 'lucide-react';
import type { RootState } from '../../store/store';
import {
  closeModal,
  setReferenceStats,
  setBaseStats,
  setTransferResult,
  setStrength,
  setStatus,
  setError,
} from '../../store/slices/colorTransferSlice';
import { applySnapshot } from '../../store/slices/gradingSlice';
import { CanvasEngine } from '../../lib/CanvasEngine';
import { analyzeImage, computeTransfer, blendGrading } from '../../lib/colorTransfer';

const ColorTransferModal: React.FC = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    status,
    errorMessage,
    referenceImageUrl,
    referenceStats,
    baseStats,
    baseGrading,
    transferResult,
    strength,
  } = useSelector((state: RootState) => state.colorTransfer);

  const originalUrl = useSelector((state: RootState) => state.image.originalUrl);

  const [isAnalyzingBase, setIsAnalyzingBase] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localEngine = useRef<CanvasEngine | null>(null);
  const referenceImageUrlRef = useRef<string | null>(null);
  const baseAnalyzedRef = useRef<string | null>(null); // tracks which url has been analyzed

  // Store reference image url in a ref for cleanup stability
  useEffect(() => {
    referenceImageUrlRef.current = referenceImageUrl;
  }, [referenceImageUrl]);

  // Clean up when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      baseAnalyzedRef.current = null;
      if (referenceImageUrlRef.current) {
        URL.revokeObjectURL(referenceImageUrlRef.current);
        referenceImageUrlRef.current = null;
      }
      if (localEngine.current) {
        const engine = localEngine.current as any;
        try {
          if (engine.gl) {
            if (engine._proxyTexture) engine.gl.deleteTexture(engine._proxyTexture);
            Object.values(engine._curveTextures).forEach((t: any) => engine.gl.deleteTexture(t));
            Object.values(engine._hslTextures).forEach((t: any) => engine.gl.deleteTexture(t));
            if (engine.program) engine.gl.deleteProgram(engine.program);
            if (engine.positionBuffer) engine.gl.deleteBuffer(engine.positionBuffer);
            if (engine.texCoordBuffer) engine.gl.deleteBuffer(engine.texCoordBuffer);
          }
          if (engine._histogramWorker) {
            engine._histogramWorker.terminate();
          }
        } catch (err) {
          console.error('Error cleaning up CanvasEngine in modal:', err);
        }
        localEngine.current = null;
      }
    }
  }, [isOpen]);

  // Analyze Base Image when modal opens (runs once per unique originalUrl)
  useEffect(() => {
    if (isOpen && originalUrl && baseAnalyzedRef.current !== originalUrl) {
      baseAnalyzedRef.current = originalUrl;
      setIsAnalyzingBase(true);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get 2d context');
          ctx.drawImage(img, 0, 0, 256, 256);
          const imageData = ctx.getImageData(0, 0, 256, 256);
          const stats = analyzeImage(imageData);
          dispatch(setBaseStats(stats));
        } catch (err: any) {
          dispatch(setError(err.message || 'Failed to analyze base image'));
        } finally {
          setIsAnalyzingBase(false);
        }
      };
      img.onerror = () => {
        dispatch(setError('Failed to load base image'));
        setIsAnalyzingBase(false);
      };
      img.src = originalUrl;
    }
  }, [isOpen, originalUrl, dispatch]);

  // Compute Color Transfer when both stats are available
  useEffect(() => {
    if (baseStats && referenceStats) {
      const result = computeTransfer(baseStats, referenceStats);
      dispatch(setTransferResult(result));
    }
  }, [baseStats, referenceStats, dispatch]);

  // Derive preview grading state
  const previewGradingState = useMemo(() => {
    if (status === 'ready' && baseGrading && transferResult) {
      return blendGrading(baseGrading, transferResult, strength);
    }
    return baseGrading;
  }, [baseGrading, transferResult, strength, status]);

  // Initialize CanvasEngine for preview canvas
  useEffect(() => {
    if (isOpen && canvasRef.current && originalUrl) {
      if (!localEngine.current) {
        localEngine.current = new CanvasEngine();
        localEngine.current.init(canvasRef.current);
      }
      localEngine.current.loadImage(originalUrl).then(() => {
        if (previewGradingState && localEngine.current) {
          localEngine.current.updateCurveTextures(previewGradingState.curves);
          localEngine.current.updateHslTextures(previewGradingState.hsl);
          localEngine.current.render(previewGradingState);
        }
      });
    }
  }, [isOpen, originalUrl]);

  // Re-render preview canvas on preview state change
  useEffect(() => {
    if (localEngine.current && previewGradingState) {
      localEngine.current.updateCurveTextures(previewGradingState.curves);
      localEngine.current.updateHslTextures(previewGradingState.hsl);
      localEngine.current.render(previewGradingState);
    }
  }, [previewGradingState]);

  // Handle reference image selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    dispatch(setStatus('analyzing'));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');

        ctx.drawImage(img, 0, 0, 256, 256);
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const stats = analyzeImage(imageData);
        dispatch(setReferenceStats({ url, stats }));
      } catch (err: any) {
        dispatch(setError(err.message || 'Failed to analyze reference image'));
      }
    };
    img.onerror = () => {
      dispatch(setError('Failed to load reference image'));
    };
    img.src = url;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleApply = () => {
    if (previewGradingState) {
      dispatch(applySnapshot(previewGradingState));
      dispatch(closeModal());
    }
  };

  const handleCancel = () => {
    dispatch(closeModal());
  };

  if (!isOpen) return null;

  // Determine status message
  let statusText = 'Load a reference image';
  if (status === 'analyzing') {
    statusText = 'Analyzing images...';
  } else if (status === 'ready') {
    statusText = 'Match ready. Adjust strength and apply.';
  } else if (status === 'applying') {
    statusText = 'Applying adjustments...';
  } else if (status === 'error') {
    statusText = errorMessage || 'An error occurred';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 safari-blur p-4">
      <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-black/10">
          <div className="flex items-center gap-2 text-[var(--theme-primary)]">
            <Wand2 size={20} />
            <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)]">Match Color (experimental)</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Two Columns Body */}
        <div className="flex-1 flex flex-col md:flex-row gap-6 p-6 overflow-hidden min-h-0">
          
          {/* Left Column: Reference Image */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
              Reference Look
            </div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 border-2 border-dashed rounded-xl bg-[var(--bg-base)] flex flex-col justify-center items-center relative overflow-hidden transition-all ${
                isDragOver ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 scale-[0.99]' : 'border-[var(--border)]'
              }`}
            >
              {referenceImageUrl ? (
                <>
                  <img
                    src={referenceImageUrl}
                    alt="Reference"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-white px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-lg">
                      Replace Reference
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-control)] flex items-center justify-center shadow-inner text-[var(--text-secondary)]">
                    <Upload size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Drop reference image here</h3>
                    <p className="text-[var(--text-tertiary)] text-[11px] max-w-xs">JPG, PNG, or WebP</p>
                  </div>
                  <label className="bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-white px-6 py-2 rounded-full text-xs font-bold cursor-pointer transition-all shadow-md">
                    Browse Reference
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                </div>
              )}

              {/* Analyzing spinner overlay */}
              {status === 'analyzing' && !referenceImageUrl && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-[var(--theme-primary)]" />
                  <span className="text-xs font-semibold text-white">Analyzing Reference...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Target Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
              Preview (Base Image)
            </div>
            <div className="flex-1 border border-[var(--border)] rounded-xl bg-[var(--bg-base)] flex justify-center items-center relative overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full object-contain shadow-md"
              />
              {isAnalyzingBase && (
                <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={32} className="animate-spin text-[var(--theme-primary)]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Analyzing Base...</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Bottom Control Bar */}
        <div className="px-6 py-5 border-t border-[var(--border)] bg-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Status Display */}
          <div className="flex flex-col gap-0.5 items-start">
            <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2">
              {status === 'analyzing' && <Loader2 size={12} className="animate-spin text-[var(--theme-primary)]" />}
              {status === 'error' && <span className="w-2 h-2 rounded-full bg-[var(--accent-red)]" />}
              {status === 'ready' && <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse" />}
              {statusText}
            </div>
            {status === 'error' && (
              <span className="text-[10px] text-[var(--accent-red)] font-semibold">{errorMessage}</span>
            )}
          </div>

          {/* Strength Slider */}
          <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[320px]">
            <span className={`text-xs font-bold text-[var(--text-secondary)] whitespace-nowrap ${status !== 'ready' ? 'opacity-30' : ''}`}>
              Strength: {Math.round(strength * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(strength * 100)}
              disabled={status !== 'ready'}
              onChange={(e) => dispatch(setStrength(parseInt(e.target.value, 10) / 100))}
              className="flex-1 h-1.5 bg-[var(--bg-control)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleCancel}
              className="px-5 py-2 hover:bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-primary)] rounded-full text-xs font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={status !== 'ready'}
              className="px-6 py-2 bg-[var(--theme-primary)] hover:opacity-90 active:scale-95 text-white disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed rounded-full text-xs font-bold transition-all shadow-md"
            >
              Apply Match
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ColorTransferModal;
