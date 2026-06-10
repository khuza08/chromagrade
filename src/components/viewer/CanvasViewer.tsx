import React, { useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { store } from "../../store/store";
import type { RootState } from "../../store/store";
import { setImage } from "../../store/slices/imageSlice";
import { canvasEngine } from "../../lib/CanvasEngine";
import { setPickerActive } from "../../store/slices/uiSlice";
import { setCurvePoints } from "../../store/slices/gradingSlice";
import {
  Upload,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  SplitSquareHorizontal,
} from "lucide-react";
import TargetOverlay from "./TargetOverlay";
import { extractPalette } from "../../utils/vibrant";
import { useTheme } from "../../context/ThemeContext";
import { extractPreview } from "../../lib/rawLoader";

import { parseCube } from "../../lib/lut/parseCube";

const CanvasViewer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const { applyPalette } = useTheme();
  const { originalUrl, dimensions, fileName } = useSelector(
    (state: RootState) => state.image,
  );
  const previewWarning = useSelector(
    (state: RootState) => state.image.previewWarning,
  );
  const { isPickerActive } = useSelector((state: RootState) => state.ui);
  const viewportResetToken = useSelector(
    (state: RootState) => state.ui.viewportResetToken,
  );
  const gradingParams = useSelector((state: RootState) => state.grading, shallowEqual);
  const curves = gradingParams.curves;
  const basic = useSelector((state: RootState) => state.basic);
  const lut = useSelector((state: RootState) => state.lut);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePos, setComparePos] = useState(0.5);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setCompareMode(false);
    setComparePos(0.5);
  }, [originalUrl]);
  const isGLInitialized = useRef(false);

  // Initialize WebGL ONCE on component mount — canvas is always in the DOM
  useEffect(() => {
    if (canvasRef.current && !isGLInitialized.current) {
      canvasEngine.init(canvasRef.current);
      isGLInitialized.current = true;
    }
  }, []);

  // Sync Fullscreen State
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      // Immediately trigger engine resize for resolution awareness
      if (containerRef.current) {
        canvasEngine.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        );
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Update Curve and HSL Textures separately to avoid excessive LUT generation
  useEffect(() => {
    canvasEngine.updateCurveTextures(curves);
  }, [curves]);

  useEffect(() => {
    canvasEngine.updateHslTextures(gradingParams.hsl);
  }, [gradingParams.hsl]);

  // Sync activeLut with canvasEngine
  useEffect(() => {
    if (!lut.activeLut) {
      canvasEngine.clearLut();
      return;
    }

    let isSubscribed = true;
    async function loadLutAsync() {
      try {
        const res = await fetch(`/luts/${lut.activeLut}.cube`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const { size, data } = parseCube(text);
        if (isSubscribed) {
          canvasEngine.loadLut(data, size);
        }
      } catch (e) {
        console.error("Failed to load active LUT in CanvasViewer:", e);
      }
    }
    loadLutAsync();

    return () => {
      isSubscribed = false;
    };
  }, [lut.activeLut]);

  // Redraw when grading params or basic sliders change
  useEffect(() => {
    if (originalUrl) {
      canvasEngine.render(gradingParams, basic.exposure);
    }
  }, [
    gradingParams,
    basic.exposure,
    basic.toneHighlights,
    basic.toneShadows,
    basic.whites,
    basic.blacks,
    basic.texture,
    basic.clarity,
    basic.dehaze,
    basic.hdr,
    basic.hdrLimit,
    basic.hdrGamma,
    basic.hdrIntensity,
    basic.hdrLightAdapt,
    basic.hdrColorAdapt,
    basic.visualizeHdr,
    basic.sdrPreview,
    basic.sdrBrightness,
    basic.sdrContrast,
    basic.sdrHighlights,
    basic.sdrShadows,
    basic.sdrWhites,
    basic.sdrHighlightSat,
    lut.activeLut,
    lut.strength,
    originalUrl,
  ]);

  // Extract color palette for dynamic UI
  useEffect(() => {
    if (!originalUrl) {
      applyPalette(null);
      return;
    }

    const timer = setTimeout(async () => {
      const palette = await extractPalette(originalUrl);
      applyPalette(palette);
    }, 300);

    return () => clearTimeout(timer);
  }, [originalUrl, applyPalette]);

  // Reset zoom/pan when workspace is loaded externally (e.g. from TopBar)
  useEffect(() => {
    if (viewportResetToken === 0) return;
    setTimeout(() => {
      const fit = calculateFitZoom();
      setZoom(fit);
      setPan({ x: 0, y: 0 });
    }, 50);
  }, [viewportResetToken]);

  // Handle Resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      canvasEngine.resize(
        containerRef.current!.clientWidth,
        containerRef.current!.clientHeight,
      );
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const calculateFitZoom = () => {
    if (!containerRef.current || !canvasRef.current) return 1.0;
    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;
    const canvasW = canvasRef.current.width;
    const canvasH = canvasRef.current.height;

    if (canvasW === 0 || canvasH === 0) return 1.0;

    return Math.min(
      (containerW - 40) / canvasW,
      (containerH - 40) / canvasH,
      1.0,
    );
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.05, Math.min(10.0, prev + delta)));
  };

  const resetZoom = () => {
    const fit = calculateFitZoom();
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  };

  const isHslTargetActive = useSelector(
    (state: RootState) => state.ui.isHslTargetActive,
  );
  const hslViewMode = useSelector((state: RootState) => state.ui.hslViewMode);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!originalUrl) return;
    // Block panning if Target Tool is active (Target Tool only works in HSL mode)
    if (isHslTargetActive && hslViewMode === "hsl") return;

    // Allow panning if zoomed in OR if the image is larger than container
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isPickerActive || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;

    // Sample pixel from WebGL canvas using the engine
    const pixel = canvasEngine.samplePixel(normX, normY);

    // Get value based on active curve channel
    let value = 0;
    const activeCurveChannel = (store.getState() as RootState).ui
      .activeCurveChannel;

    if (activeCurveChannel === "master") {
      // Rec. 709 Luma
      value = (0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]) / 255;
    } else if (activeCurveChannel === "red") {
      value = pixel[0] / 255;
    } else if (activeCurveChannel === "green") {
      value = pixel[1] / 255;
    } else if (activeCurveChannel === "blue") {
      value = pixel[2] / 255;
    }

    const currentPoints = curves[activeCurveChannel];
    const newPoints = [...currentPoints, { x: value, y: value }].sort(
      (a, b) => a.x - b.x,
    );
    dispatch(
      setCurvePoints({ channel: activeCurveChannel, points: newPoints }),
    );

    dispatch(setPickerActive(false));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleFileUpload = async (file: File) => {
    const RAW_EXTENSIONS = [
      "arw",
      "cr2",
      "cr3",
      "nef",
      "orf",
      "raf",
      "rw2",
      "dng",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const isRaw = RAW_EXTENSIONS.includes(ext);
    if (!file.type.startsWith("image/") && !isRaw) return;

    let url: string;
    let previewWarning: string | null = null;

    // Revoke previous image URL to prevent blob memory leak
    if (originalUrl) URL.revokeObjectURL(originalUrl);

    if (isRaw) {
      const { blob, previewWarning: warning } = await extractPreview(file);
      url = URL.createObjectURL(blob);
      previewWarning = warning;
    } else {
      url = URL.createObjectURL(file);
    }

    const dimensions = await canvasEngine.loadImage(url);
    dispatch(
      setImage({
        url,
        width: dimensions.width,
        height: dimensions.height,
        name: file.name,
        previewWarning,
      }),
    );
    canvasEngine.render(gradingParams, basic.exposure);
    setTimeout(() => {
      const fit = calculateFitZoom();
      setZoom(fit);
      setPan({ x: 0, y: 0 });
    }, 50);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative group bg-[var(--bg-base)] overflow-hidden flex items-center justify-center transition-colors duration-500 ${isFullscreen ? "bg-black" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drop zone overlay */}
      {!originalUrl && (
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center transition-colors duration-300`}
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center gap-6 transition-all ${isDragging ? "border-[var(--theme-primary)] bg-[var(--bg-panel)] shadow-2xl" : "border-[var(--border)]"}`}
          >
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-control)] flex items-center justify-center shadow-inner">
              <Upload
                size={32}
                className={
                  isDragging
                    ? "text-[var(--theme-primary)]"
                    : "text-[var(--text-secondary)]"
                }
              />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                Drop image here
              </h3>
              <p className="text-[var(--text-secondary)]/50 text-sm max-w-xs">
                Supports JPG, PNG and WebP formats
              </p>
            </div>
            <label className="bg-[var(--theme-primary)] hover:opacity-90 text-white px-8 py-2.5 rounded-full text-sm font-bold cursor-pointer transition-all active:scale-95 shadow-lg shadow-black/20">
              Browse Files
              <input
                type="file"
                className="hidden"
                accept="image/*,.arw,.cr2,.cr3,.nef,.orf,.raf,.rw2,.dng"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
              />
            </label>
          </div>
        </div>
      )}

      {/* WebGL Canvas Wrapper */}
      <TargetOverlay />
      <div
        className="relative shadow-2xl shadow-black/50 transition-shadow duration-300 w-fit h-fit"
        style={{
          display: originalUrl ? "block" : "none",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          transition: isDragging
            ? "none"
            : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
          cursor: isPickerActive
            ? "crosshair"
            : isDragging
              ? "grabbing"
              : "grab",
        }}
        onDoubleClick={resetZoom}
        onClick={handleCanvasClick}
      >
        {compareMode && originalUrl && (
          <img
            src={originalUrl}
            alt="Before"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              pointerEvents: "none",
            }}
          />
        )}
        <canvas
          ref={canvasRef}
          className="object-contain"
          style={{
            display: "block",
            imageRendering: zoom > 1.0 ? "pixelated" : "auto",
            clipPath: compareMode ? `inset(0 ${(1 - comparePos) * 100}% 0 0)` : undefined,
          }}
        />
        {compareMode && (
          <div
            style={{
              position: "absolute",
              left: `${comparePos * 100}%`,
              top: 0,
              bottom: 0,
              width: "2px",
              background: "white",
              cursor: "ew-resize",
              zIndex: 20,
              transform: "translateX(-50%)",
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId) && canvasRef.current) {
                const canvasRect = canvasRef.current.getBoundingClientRect();
                const newPos = (e.clientX - canvasRect.left) / canvasRect.width;
                setComparePos(Math.max(0.05, Math.min(0.95, newPos)));
              }
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
          >
            <div
              className="flex items-center justify-center text-gray-800"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                width: "32px",
                height: "32px",
                borderRadius: "9999px",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              }}
            >
              <SplitSquareHorizontal size={16} />
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "8px",
                transform: `scale(${1 / zoom})`,
                transformOrigin: "bottom right",
                pointerEvents: "none",
              }}
              className="text-[10px] font-bold text-white bg-black/40 rounded px-1.5 py-0.5"
            >
              Before
            </div>
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                left: "8px",
                transform: `scale(${1 / zoom})`,
                transformOrigin: "bottom left",
                pointerEvents: "none",
              }}
              className="text-[10px] font-bold text-white bg-black/40 rounded px-1.5 py-0.5"
            >
              After
            </div>
          </div>
        )}
      </div>

      {/* Viewer HUD */}
      {originalUrl && (
        <>
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <div className="flex items-center gap-2 px-2 py-1 bg-[var(--bg-panel)]/20 safari-blur rounded-lg border border-[var(--border)] mr-2 group/zoom">
              <span className="text-[10px] font-mono text-[var(--theme-primary)] min-w-[32px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={resetZoom}
                className="hover:text-[var(--theme-primary)] text-[var(--text-secondary)] transition-all cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw size={10} />
              </button>
            </div>
            <button
              onClick={() => handleZoom(0.2)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg safari-blur text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg safari-blur text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={toggleFullscreen}
              className={`p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg safari-blur transition-all border border-[var(--border)] ${isFullscreen ? "text-[var(--theme-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
            >
              <Maximize size={18} />
            </button>
          </div>
          <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[var(--bg-panel)]/20 safari-blur rounded-md text-[10px] font-mono text-[var(--text-tertiary)] tracking-wider uppercase border border-[var(--border)] z-20 flex gap-3">
            <span>
              {dimensions
                ? dimensions.width >= 3840
                  ? "4K"
                  : dimensions.width >= 2560
                    ? "QHD"
                    : dimensions.width >= 1920
                      ? "FHD"
                      : dimensions.width >= 1280
                        ? "HD"
                        : "SD"
                : "---"}{" "}
              {fileName?.split(".").pop() || "IMG"}
            </span>
            <span className="opacity-30">•</span>
            <span>
              {dimensions ? `${dimensions.width}x${dimensions.height}` : "0x0"}
            </span>
            <span className="opacity-30">•</span>
            <span>sRGB</span>
            {previewWarning && (
              <>
                <span className="opacity-30">•</span>
                <span className="text-amber-400 normal-case">
                  ⚠ Preview quality
                </span>
              </>
            )}
          </div>
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`p-2 rounded-lg safari-blur transition-all border border-[var(--border)] mr-2 ${compareMode ? "bg-[var(--bg-control)] text-[var(--theme-primary)]" : "bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
              title="Compare before/after"
            >
              <SplitSquareHorizontal size={18} />
            </button>
            <button
              onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg safari-blur text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
              title="Rotate left"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-2 bg-[var(--bg-panel)]/20 hover:bg-[var(--bg-panel)]/20 rounded-lg safari-blur text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-[var(--border)]"
              title="Rotate right"
            >
              <RotateCw size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CanvasViewer;
