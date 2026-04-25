import { useRef, useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Sparkles, Wand2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { PROMPT_SUGGESTIONS } from '../data/products.js';
import { formatDims, resolvePromptAnchor } from '../utils/dimensionCalc.js';
import { loadImage, computePlacement } from '../utils/canvasBlend.js';
import { removeProductBackgroundHighRes } from '../utils/bgRemoval.js';

const MIN_SCALE = 0.45;
const MAX_SCALE = 2.2;

export default function PromptBuilder({
  product, room, value, onChange, onBack, onGenerate, isLoading,
}) {
  const suggestions = PROMPT_SUGGESTIONS[product?.placement] || [];
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoomPct, setZoomPct] = useState(100);

  const S = useRef({
    roomImg: null,
    productCanvas: null,
    productImgSz: null,
    roomW: 0,
    roomH: 0,
    canvasW: 0,
    canvasH: 0,
    scale: 1,
    panX: 0,
    panY: 0,
  });

  const fitRoom = useCallback(() => {
    const c = containerRef.current;
    const cv = canvasRef.current;
    if (!c || !cv || !S.current.roomW) return;

    const cW = c.clientWidth;
    const cH = c.clientHeight;
    cv.width = cW;
    cv.height = cH;
    S.current.canvasW = cW;
    S.current.canvasH = cH;

    const fitScale = Math.min(cW / S.current.roomW, cH / S.current.roomH) * 0.97;
    S.current.scale = fitScale;
    S.current.panX = (cW - S.current.roomW * fitScale) / 2;
    S.current.panY = (cH - S.current.roomH * fitScale) / 2;
    setZoomPct(Math.round(fitScale * 100));
  }, []);

  const draw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const cv = canvasRef.current;
      if (!cv || !S.current.roomImg || !S.current.productCanvas) return;
      const ctx = cv.getContext('2d');
      const { roomImg, productCanvas, productImgSz, roomW, roomH, canvasW, canvasH, scale, panX, panY } = S.current;

      const promptAnchor = resolvePromptAnchor(product, value);
      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.fillStyle = '#1B2635';
      ctx.fillRect(0, 0, canvasW, canvasH);

      ctx.save();
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(roomImg, 0, 0, roomW, roomH);

      const rect = computePlacement(
        product,
        { width: roomW, height: roomH },
        value,
        { anchor: promptAnchor, scaleFactor: 1 },
        productImgSz,
      );

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.42)';
      ctx.shadowBlur = 18 / scale;
      ctx.shadowOffsetY = 7 / scale;
      ctx.globalAlpha = 0.97;
      ctx.drawImage(productCanvas, rect.x, rect.y, rect.w, rect.h);
      ctx.restore();

      ctx.restore();
    });
  }, [product, value]);

  const applyZoom = (factor) => {
    const s = S.current.scale;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor));
    if (next === s) return;

    const cx = S.current.canvasW / 2;
    const cy = S.current.canvasH / 2;
    S.current.panX = cx - (cx - S.current.panX) * (next / s);
    S.current.panY = cy - (cy - S.current.panY) * (next / s);
    S.current.scale = next;
    setZoomPct(Math.round(next * 100));
    draw();
  };

  useEffect(() => {
    if (!room?.src || !product?.image) return;
    let cancelled = false;
    setReady(false);
    setLoadError(false);

    (async () => {
      try {
        const roomImg = await loadImage(room.src);
        const productCanvas = await removeProductBackgroundHighRes(product.image);
        if (cancelled) return;

        S.current.roomImg = roomImg;
        S.current.productCanvas = productCanvas;
        S.current.productImgSz = { w: productCanvas.width, h: productCanvas.height };
        S.current.roomW = roomImg.naturalWidth;
        S.current.roomH = roomImg.naturalHeight;

        requestAnimationFrame(() => {
          if (cancelled) return;
          fitRoom();
          draw();
          setReady(true);
        });
      } catch (err) {
        console.error('[PromptBuilder] load error', err);
        if (!cancelled) {
          setLoadError(true);
          setReady(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [room?.src, product?.image, fitRoom, draw]);

  useEffect(() => {
    if (ready) draw();
  }, [value, ready, draw]);

  const handleGenerate = () => {
    const fallbackAnchor = resolvePromptAnchor(product, value);
    onGenerate({ anchor: fallbackAnchor, scaleFactor: 1 });
  };

  return (
    <div className="card p-6 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost !px-3 !py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="eyebrow">Step 4 · Placement</div>
          <h2 className="h-display text-2xl md:text-3xl font-bold mt-1">Position Preview</h2>
          <p className="text-belami-navy/60 text-sm mt-0.5">
            Preview the product position before generating.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-belami-navy/80 mb-2">
              Placement text (optional manual override)
            </label>
            <div className="relative">
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                placeholder="e.g. Center of ceiling above the seating area"
                className="w-full resize-none rounded-2xl border-2 border-belami-navy/10 bg-white p-4 pr-12 text-belami-navy placeholder:text-belami-navy/30 outline-none transition focus:border-belami-gold"
              />
              <Wand2 size={18} className="absolute right-4 top-4 text-belami-navy/30 pointer-events-none" />
            </div>
          </div>

          {suggestions.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-belami-navy/60 mb-2">
                Prompt templates
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onChange(s)}
                    className="rounded-full border border-belami-navy/15 bg-white px-3.5 py-1.5 text-xs font-medium text-belami-navy hover:border-belami-gold hover:text-belami-gold transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-belami-navy text-white p-4 shadow-premium">
            <div className="text-[10px] uppercase tracking-[0.25em] text-belami-gold font-semibold mb-2">
              Selected Product
            </div>
            <div className="flex items-center gap-3">
              <img src={product?.image} alt={product?.name} className="h-12 w-12 rounded-lg object-contain bg-white p-1" />
              <div className="min-w-0">
                <div className="font-semibold truncate text-sm">{product?.name}</div>
                <div className="text-xs text-white/60 mt-0.5">{formatDims(product)} · {product?.placement}</div>
              </div>
            </div>
          </div>

          <button className="btn-gold w-full" onClick={handleGenerate} disabled={isLoading || !value.trim()}>
            <Sparkles size={16} />
            {isLoading ? 'Loading…' : 'Generate 3 Variations →'}
          </button>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-belami-navy/60">Preview Canvas</span>
            <div className="flex items-center gap-1">
              <button onClick={() => applyZoom(0.82)} className="btn-ghost !px-2 !py-1.5" title="Zoom out">
                <ZoomOut size={14} />
              </button>
              <span className="text-xs tabular-nums font-semibold text-belami-navy/70 w-12 text-center">{zoomPct}%</span>
              <button onClick={() => applyZoom(1.22)} className="btn-ghost !px-2 !py-1.5" title="Zoom in">
                <ZoomIn size={14} />
              </button>
              <button onClick={() => { fitRoom(); draw(); }} className="btn-ghost !px-2 !py-1.5" title="Fit room">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative rounded-2xl overflow-hidden bg-[#1B2635] border border-belami-navy/20"
            style={{ height: '440px' }}
          >
            {!ready && !loadError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full border-4 border-white/10 border-t-belami-gold animate-spin" />
                <p className="text-xs text-white/50 font-medium">Preparing placement preview…</p>
              </div>
            )}
            {loadError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-red-400">Could not load preview.</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                width: '100%',
                height: '100%',
                opacity: ready ? 1 : 0,
                transition: 'opacity 0.25s',
              }}
            />
          </div>

          <div className="rounded-2xl border border-belami-navy/10 bg-belami-cream/40 p-4 text-sm text-belami-navy">
            <div className="font-semibold">Placement Preview</div>
            <div className="mt-1">
              {value.trim() || 'Use a prompt template or enter placement text.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
