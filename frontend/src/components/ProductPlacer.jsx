import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Move, Sparkles, RotateCcw } from 'lucide-react';
import { loadImage, removeWhiteBackground, computePlacement } from '../utils/canvasBlend.js';
import { resolvePromptAnchor } from '../utils/dimensionCalc.js';

/**
 * ProductPlacer
 * -------------
 * Interactive canvas step where the user drags/clicks to reposition
 * the product before the full 4-variation generate pass.
 *
 * Fixes applied vs earlier version:
 *   - Canvas is displayed inside an aspect-ratio wrapper with max-height: 65vh
 *     so it never overflows the viewport and isn't "zoomed".
 *   - Touch/mouse events only call preventDefault when a drag is in progress,
 *     so normal page scrolling still works.
 *   - Product image natural pixel size is passed to computePlacement so the
 *     product is drawn at its photo aspect ratio (no stretch/distortion).
 */
export default function ProductPlacer({ room, product, prompt, initialOverride, onConfirm, onBack }) {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const stateRef     = useRef({
    roomImg:       null,
    productCanvas: null,
    productImgSz:  null,   // { w, h } natural px of product photo
    anchor:        null,
    dragging:      false,
    dragOffset:    null,
    rect:          null,
    canvasW:       0,
    canvasH:       0,
  });

  const [loading,    setLoading]    = useState(true);
  const [anchor,     setAnchor]     = useState(null);
  const [canvasDims, setCanvasDims] = useState(null); // for the CSS wrapper

  // ─── coordinate mapping ────────────────────────────────────────────────────

  const getCanvasXY = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const cr     = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / cr.width;
    const scaleY = canvas.height / cr.height;
    const src    = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - cr.left) * scaleX,
      y: (src.clientY - cr.top)  * scaleY,
    };
  };

  // ─── drawing ───────────────────────────────────────────────────────────────

  const scheduleRedraw = useCallback((nextAnchor) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { roomImg, productCanvas, productImgSz, canvasW, canvasH } = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !roomImg || !productCanvas || !nextAnchor) return;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.drawImage(roomImg, 0, 0, canvasW, canvasH);

      // Compute product rect using the image's own aspect ratio
      const rect = computePlacement(
        product,
        { width: canvasW, height: canvasH },
        prompt,
        { anchor: nextAnchor },
        productImgSz,
      );
      stateRef.current.rect = rect;

      // Draw product with drop-shadow
      ctx.save();
      ctx.shadowColor   = 'rgba(10, 20, 40, 0.42)';
      ctx.shadowBlur    = 20;
      ctx.shadowOffsetY = 8;
      ctx.globalAlpha   = 0.97;
      ctx.drawImage(productCanvas, rect.x, rect.y, rect.w, rect.h);
      ctx.restore();

      // Dashed selection border
      ctx.save();
      ctx.strokeStyle = 'rgba(241,143,1,0.9)';
      ctx.lineWidth   = 2;
      ctx.setLineDash([7, 5]);
      ctx.strokeRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
      ctx.setLineDash([]);

      // Move handle at product center
      const cx = rect.x + rect.w / 2;
      const cy = rect.y + rect.h / 2;
      ctx.fillStyle = 'rgba(241,143,1,0.92)';
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.fill();

      // ✥ cross-arrows icon
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 2.2;
      ctx.lineCap     = 'round';
      [[cx - 8, cy, cx + 8, cy], [cx, cy - 8, cx, cy + 8]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });
      // arrowheads
      const ah = 4;
      [[cx + 8, cy, ah, 0], [cx - 8, cy, -ah, 0], [cx, cy + 8, 0, ah], [cx, cy - 8, 0, -ah]]
        .forEach(([bx, by, dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(bx - dy - dx * 0.6, by + dx - dy * 0.6);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx + dy - dx * 0.6, by - dx - dy * 0.6);
          ctx.stroke();
        });

      ctx.restore();
    });
  }, [product, prompt]);

  // ─── load images ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const [roomImg, productImgRaw] = await Promise.all([
          loadImage(room.src),
          loadImage(product.image),
        ]);
        if (cancelled) return;

        const productCanvas = removeWhiteBackground(productImgRaw);
        const productImgSz  = { w: productCanvas.width, h: productCanvas.height };

        // Keep canvas resolution ≤ 900px wide for performance
        const MAX_W = 900;
        const scale = Math.min(1, MAX_W / roomImg.naturalWidth);
        const W     = Math.round(roomImg.naturalWidth  * scale);
        const H     = Math.round(roomImg.naturalHeight * scale);

        if (canvasRef.current) {
          canvasRef.current.width  = W;
          canvasRef.current.height = H;
        }

        const initAnchor = initialOverride?.anchor || resolvePromptAnchor(product, prompt);

        stateRef.current = {
          roomImg,
          productCanvas,
          productImgSz,
          anchor:     initAnchor,
          dragging:   false,
          dragOffset: null,
          rect:       null,
          canvasW:    W,
          canvasH:    H,
        };

        setCanvasDims({ w: W, h: H });
        setAnchor(initAnchor);
        setLoading(false);
      } catch (err) {
        console.error('[ProductPlacer] load error', err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [room.src, product, prompt, initialOverride]);

  useEffect(() => {
    if (!loading && anchor) scheduleRedraw(anchor);
  }, [loading, anchor, scheduleRedraw]);

  // ─── interaction ───────────────────────────────────────────────────────────

  const handleDown = useCallback((e) => {
    const pos  = getCanvasXY(e);
    const { rect, canvasW, canvasH } = stateRef.current;

    if (rect &&
        pos.x >= rect.x && pos.x <= rect.x + rect.w &&
        pos.y >= rect.y && pos.y <= rect.y + rect.h) {
      // Drag started inside product — begin dragging
      e.preventDefault();
      stateRef.current.dragging   = true;
      stateRef.current.dragOffset = {
        dx: pos.x - (rect.x + rect.w * (product.anchor?.x ?? 0.5)),
        dy: pos.y - (rect.y + rect.h * (product.anchor?.y ?? 0.5)),
      };
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    } else {
      // Click outside product — teleport it to clicked position
      const newAnchor = {
        x: Math.max(0.04, Math.min(0.96, pos.x / canvasW)),
        y: Math.max(0.04, Math.min(0.96, pos.y / canvasH)),
      };
      stateRef.current.anchor = newAnchor;
      setAnchor({ ...newAnchor });
    }
  }, [product]);

  const handleMove = useCallback((e) => {
    const { dragging } = stateRef.current;
    if (!dragging) return;          // not dragging → don't block scroll
    e.preventDefault();             // only block scroll when actually dragging

    const { dragOffset, canvasW, canvasH } = stateRef.current;
    const pos = getCanvasXY(e);
    const newAnchor = {
      x: Math.max(0.04, Math.min(0.96, (pos.x - dragOffset.dx) / canvasW)),
      y: Math.max(0.04, Math.min(0.96, (pos.y - dragOffset.dy) / canvasH)),
    };
    stateRef.current.anchor = newAnchor;
    setAnchor({ ...newAnchor });
  }, []);

  const handleUp = useCallback(() => {
    stateRef.current.dragging = false;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  const resetPosition = () => {
    const def = resolvePromptAnchor(product, prompt);
    stateRef.current.anchor = def;
    setAnchor({ ...def });
  };

  const handleConfirm = () => {
    const a = stateRef.current.anchor;
    onConfirm(a ? { anchor: a } : null);
  };

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <div className="card p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="btn-ghost !px-3 !py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="eyebrow">Step 5 · Position</div>
          <h2 className="h-display text-2xl md:text-3xl font-bold mt-1">
            Drag to position
          </h2>
          <p className="text-belami-navy/70 mt-1 text-sm">
            Click anywhere in the room to place the product there, or drag it to fine-tune.
          </p>
        </div>
      </div>

      {/* Canvas */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-belami-cream/50 gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-belami-navy/10 border-t-belami-gold animate-spin" />
          <p className="text-sm text-belami-navy/60 font-medium">Loading preview…</p>
        </div>
      ) : (
        /*
         * Aspect-ratio wrapper + maxHeight: 65vh
         * When the wrapper hits the height cap, its width auto-shrinks because
         * the CSS aspect-ratio and max-height interact correctly in modern browsers.
         * The canvas inside fills the wrapper absolutely → no CSS scaling of canvas.
         */
        <div
          className="relative rounded-2xl overflow-hidden shadow-premium select-none mx-auto w-full"
          style={{
            aspectRatio: canvasDims ? `${canvasDims.w} / ${canvasDims.h}` : '16/9',
            maxHeight: '65vh',
            // When maxHeight kicks in, prevent width from exceeding aspect-ratio limit
            maxWidth: canvasDims
              ? `calc(65vh * ${canvasDims.w} / ${canvasDims.h})`
              : '100%',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              cursor: 'grab',
              touchAction: 'pan-y', // allow vertical scroll; horizontal pan is handled by JS
              display: 'block',
            }}
            onMouseDown={handleDown}
            onMouseMove={handleMove}
            onMouseUp={handleUp}
            onMouseLeave={handleUp}
            onTouchStart={handleDown}
            onTouchMove={handleMove}
            onTouchEnd={handleUp}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-belami-navy/80 px-3 py-1.5 text-xs text-white font-semibold backdrop-blur-sm pointer-events-none">
            <Move size={12} />
            Click or drag to reposition
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={onBack}>
            <ArrowLeft size={16} /> Back
          </button>
          <button className="btn-ghost" onClick={resetPosition} disabled={loading}>
            <RotateCcw size={15} /> Reset
          </button>
        </div>
        <button className="btn-gold" onClick={handleConfirm} disabled={loading}>
          <Sparkles size={16} />
          Generate 4 Variations
        </button>
      </div>
    </div>
  );
}
