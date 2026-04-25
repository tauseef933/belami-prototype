/**
 * TryOnCanvas
 * -----------
 * • Room photo fills the container
 * • AI places bg-removed product PNG at x_percent / y_percent
 * • User can drag to reposition, drag corner handles to resize
 * • Toolbar: Bigger / Smaller / Flip / Reset / Download
 * • Download exports full-resolution composite as PNG
 */
import {
  useState, useRef, useEffect,
  useCallback, useLayoutEffect
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ZoomIn, ZoomOut,
  FlipHorizontal2, RotateCcw, Download
} from 'lucide-react';

const MIN_W      = 48;
const HANDLE_PX  = 12;   // handle square size in px

// Corner handle definitions
const CORNERS = [
  { key: 'nw', style: { top: -HANDLE_PX/2, left:  -HANDLE_PX/2 }, cursor: 'nw-resize' },
  { key: 'ne', style: { top: -HANDLE_PX/2, right: -HANDLE_PX/2 }, cursor: 'ne-resize' },
  { key: 'sw', style: { bottom: -HANDLE_PX/2, left:  -HANDLE_PX/2 }, cursor: 'sw-resize' },
  { key: 'se', style: { bottom: -HANDLE_PX/2, right: -HANDLE_PX/2 }, cursor: 'se-resize' },
];

export default function TryOnCanvas({
  roomDataUrl,
  productUrl,       // bg-removed PNG object URL (or null while analyzing)
  placement,        // { x_percent, y_percent, scale_factor }
  isAnalyzing,
}) {
  const containerRef = useRef(null);
  const roomImgRef   = useRef(null);

  // Rendered canvas size in CSS pixels
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // Product overlay: x, y, w, h in CSS px + flipped flag
  const [overlay, setOverlay] = useState(null);

  const draggingRef = useRef(false);
  const resizingRef = useRef(null);   // corner key or null
  const pointerStart = useRef(null);  // { mx, my, ox, oy, ow, oh }

  // ── Measure rendered image size ───────────────────────────────────────
  useLayoutEffect(() => {
    const measure = () => {
      if (!roomImgRef.current) return;
      const { width, height } = roomImgRef.current.getBoundingClientRect();
      setCanvasSize({ w: width, h: height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [roomDataUrl]);

  // ── Place product at AI coordinates when placement arrives ────────────
  useEffect(() => {
    if (!placement || !productUrl || canvasSize.w === 0) return;

    const img = new Image();
    img.onload = () => {
      const aspect    = img.naturalWidth / img.naturalHeight;
      const scaleFact = Math.max(0.5, Math.min(1.5, placement.scale_factor ?? 1));

      // Base height: 28% of canvas height, scaled by Gemini's suggestion
      const baseH = canvasSize.h * 0.28 * scaleFact;
      const baseW = baseH * aspect;

      // Clamp so product never exceeds 60% of canvas width
      const w = Math.max(MIN_W, Math.min(baseW, canvasSize.w * 0.60));
      const h = w / aspect;

      // Center at AI's suggested percentage position
      const cx = (placement.x_percent / 100) * canvasSize.w;
      const cy = (placement.y_percent / 100) * canvasSize.h;

      setOverlay({
        x:       Math.max(0, Math.min(cx - w / 2, canvasSize.w - w)),
        y:       Math.max(0, Math.min(cy - h / 2, canvasSize.h - h)),
        w, h,
        flipped: false,
      });
    };
    img.src = productUrl;
  }, [placement, productUrl, canvasSize]);

  // ── Pointer helpers ───────────────────────────────────────────────────
  const getXY = (e) => {
    const src = e.touches?.[0] ?? e;
    return { x: src.clientX, y: src.clientY };
  };

  // ── Drag start (on product div) ───────────────────────────────────────
  const onProductPointerDown = useCallback((e) => {
    if (resizingRef.current) return;
    e.preventDefault();
    const { x, y } = getXY(e);
    pointerStart.current = { mx: x, my: y, ox: overlay.x, oy: overlay.y };
    draggingRef.current  = true;
  }, [overlay]);

  // ── Resize start (on corner handle) ──────────────────────────────────
  const onHandlePointerDown = useCallback((e, corner) => {
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getXY(e);
    pointerStart.current = {
      mx: x, my: y,
      ox: overlay.x, oy: overlay.y,
      ow: overlay.w, oh: overlay.h,
    };
    resizingRef.current  = corner;
    draggingRef.current  = false;
  }, [overlay]);

  // ── Global pointer move ───────────────────────────────────────────────
  const onPointerMove = useCallback((e) => {
    if (!pointerStart.current) return;
    const { x, y } = getXY(e);
    const dx = x - pointerStart.current.mx;
    const dy = y - pointerStart.current.my;

    if (draggingRef.current) {
      // Move
      setOverlay(prev => ({
        ...prev,
        x: Math.max(0, Math.min(pointerStart.current.ox + dx, canvasSize.w - prev.w)),
        y: Math.max(0, Math.min(pointerStart.current.oy + dy, canvasSize.h - prev.h)),
      }));
    } else if (resizingRef.current) {
      // Resize — maintain aspect ratio, anchor opposite corner
      const corner = resizingRef.current;
      const { ox, oy, ow, oh } = pointerStart.current;
      const aspect = ow / oh;
      let newW = ow, newH = oh, newX = ox, newY = oy;

      if (corner === 'se') {
        newW = Math.max(MIN_W, ow + dx);
      } else if (corner === 'sw') {
        newW = Math.max(MIN_W, ow - dx);
        newX = ox + ow - newW;
      } else if (corner === 'ne') {
        newW = Math.max(MIN_W, ow + dx);
        newY = oy + oh - (newW / aspect);
      } else if (corner === 'nw') {
        newW = Math.max(MIN_W, ow - dx);
        newX = ox + ow - newW;
        newY = oy + oh - (newW / aspect);
      }
      newH = newW / aspect;

      // Clamp to canvas bounds
      newX = Math.max(0, Math.min(newX, canvasSize.w - newW));
      newY = Math.max(0, Math.min(newY, canvasSize.h - newH));

      setOverlay(prev => ({ ...prev, x: newX, y: newY, w: newW, h: newH }));
    }
  }, [canvasSize]);

  const onPointerUp = useCallback(() => {
    draggingRef.current  = false;
    resizingRef.current  = null;
    pointerStart.current = null;
  }, []);

  // Attach global listeners while interacting
  useEffect(() => {
    window.addEventListener('mousemove',  onPointerMove);
    window.addEventListener('mouseup',    onPointerUp);
    window.addEventListener('touchmove',  onPointerMove, { passive: false });
    window.addEventListener('touchend',   onPointerUp);
    return () => {
      window.removeEventListener('mousemove',  onPointerMove);
      window.removeEventListener('mouseup',    onPointerUp);
      window.removeEventListener('touchmove',  onPointerMove);
      window.removeEventListener('touchend',   onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // ── Toolbar actions ───────────────────────────────────────────────────
  const scale = (factor) => setOverlay(prev => {
    if (!prev) return prev;
    const newW = Math.max(MIN_W, prev.w * factor);
    const newH = Math.max(MIN_W, prev.h * factor);
    return {
      ...prev, w: newW, h: newH,
      x: Math.max(0, Math.min(prev.x, canvasSize.w - newW)),
      y: Math.max(0, Math.min(prev.y, canvasSize.h - newH)),
    };
  });

  const flip = () => setOverlay(prev => prev ? { ...prev, flipped: !prev.flipped } : prev);

  const clearProduct = () => setOverlay(null);

  // ── Download full-res composite ───────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!overlay || !productUrl || !roomImgRef.current) return;

    const roomEl  = roomImgRef.current;
    const natW    = roomEl.naturalWidth;
    const natH    = roomEl.naturalHeight;
    const scaleX  = natW / canvasSize.w;
    const scaleY  = natH / canvasSize.h;

    const canvas  = document.createElement('canvas');
    canvas.width  = natW;
    canvas.height = natH;
    const ctx     = canvas.getContext('2d');

    // Draw room background at full resolution
    ctx.drawImage(roomEl, 0, 0, natW, natH);

    // Draw product cutout
    const prodImg = new Image();
    prodImg.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      prodImg.onload  = res;
      prodImg.onerror = rej;
      prodImg.src = productUrl;
    });

    const px = overlay.x * scaleX;
    const py = overlay.y * scaleY;
    const pw = overlay.w * scaleX;
    const ph = overlay.h * scaleY;

    ctx.save();
    if (overlay.flipped) {
      ctx.translate(px + pw, py);
      ctx.scale(-1, 1);
      ctx.drawImage(prodImg, 0, 0, pw, ph);
    } else {
      ctx.drawImage(prodImg, px, py, pw, ph);
    }
    ctx.restore();

    // Trigger download
    canvas.toBlob((blob) => {
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'belami-tryon.png';
      link.href     = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }, 'image/png', 1.0);
  }, [overlay, productUrl, canvasSize]);

  const showProduct = overlay && productUrl && !isAnalyzing && canvasSize.w > 0;

  return (
    <div className="space-y-3">
      {/* ── Main canvas ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-gray-100 shadow-premium select-none"
      >
        {/* Room photo */}
        <img
          ref={roomImgRef}
          src={roomDataUrl}
          alt="Room"
          draggable={false}
          className="w-full h-auto block"
          style={{ maxHeight: '68vh', objectFit: 'contain', display: 'block' }}
        />

        {/* Analyzing spinner */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-belami-navy/50 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-9 h-9 text-belami-gold" />
              </motion.div>
              <p className="text-white font-700 text-sm tracking-wide">
                Gemini is finding the perfect spot…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product overlay — draggable */}
        {showProduct && (
          <div
            onMouseDown={onProductPointerDown}
            onTouchStart={onProductPointerDown}
            style={{
              position:    'absolute',
              left:        overlay.x,
              top:         overlay.y,
              width:       overlay.w,
              height:      overlay.h,
              cursor:      'grab',
              touchAction: 'none',
              userSelect:  'none',
            }}
          >
            {/* Product image — transparent cutout */}
            <img
              src={productUrl}
              alt="Product"
              draggable={false}
              style={{
                width:         '100%',
                height:        '100%',
                objectFit:     'contain',
                transform:     overlay.flipped ? 'scaleX(-1)' : 'none',
                pointerEvents: 'none',
                userSelect:    'none',
                display:       'block',
              }}
            />

            {/* Dashed selection border */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '1.5px dashed rgba(46,134,171,0.65)',
              borderRadius: 3, pointerEvents: 'none',
            }} />

            {/* Corner resize handles */}
            {CORNERS.map(({ key, style, cursor }) => (
              <div
                key={key}
                onMouseDown={(e) => onHandlePointerDown(e, key)}
                onTouchStart={(e) => onHandlePointerDown(e, key)}
                style={{
                  position:     'absolute',
                  width:        HANDLE_PX,
                  height:       HANDLE_PX,
                  background:   '#2E86AB',
                  border:       '2px solid white',
                  borderRadius: 2,
                  boxShadow:    '0 1px 3px rgba(0,0,0,0.35)',
                  cursor,
                  zIndex:       10,
                  touchAction:  'none',
                  ...style,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProduct && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <Btn onClick={() => scale(1.12)} icon={<ZoomIn  className="w-3.5 h-3.5" />} label="Bigger"  />
            <Btn onClick={() => scale(0.88)} icon={<ZoomOut className="w-3.5 h-3.5" />} label="Smaller" />
            <Btn onClick={flip}              icon={<FlipHorizontal2 className="w-3.5 h-3.5" />} label="Flip" />
            <Btn onClick={clearProduct}      icon={<RotateCcw className="w-3.5 h-3.5" />} label="Remove" ghost />
            <div className="flex-1" />
            <Btn
              onClick={handleDownload}
              icon={<Download className="w-3.5 h-3.5" />}
              label="Save Image"
              primary
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint text */}
      {showProduct && (
        <p className="text-[11px] text-belami-navy/38 text-center">
          Drag to reposition · Corner handles to resize · Save to download full-resolution
        </p>
      )}
    </div>
  );
}

function Btn({ onClick, icon, label, primary, ghost }) {
  const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-600 transition-all active:scale-95 whitespace-nowrap';
  const variant = primary
    ? 'bg-belami-navy text-white hover:bg-belami-navy-light shadow-md'
    : ghost
    ? 'bg-belami-navy/6 text-belami-navy/60 hover:bg-belami-navy/12'
    : 'bg-white border border-belami-navy/15 text-belami-navy hover:border-belami-blue/40 shadow-sm';
  return (
    <button onClick={onClick} className={`${base} ${variant}`}>
      {icon}{label}
    </button>
  );
}