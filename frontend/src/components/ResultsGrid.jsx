import { useState } from 'react';
import { Download, Share2, RefreshCw, Maximize2, X, Check, ArrowLeft } from 'lucide-react';
import { downloadDataUrl } from '../utils/canvasBlend.js';
import { formatDims } from '../utils/dimensionCalc.js';

export default function ResultsGrid({ results, product, onReset, onBack }) {
  const [preview, setPreview] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleShare = async (r) => {
    const filename = `belami-${product.sku}-${r.id}.jpg`;
    try {
      const blob = await (await fetch(r.dataUrl)).blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${product.name} — Belami Try-On`,
          text: `Check out how ${product.name} looks in this room.`,
        });
        return;
      }
    } catch {
      // fall through
    }
    try {
      await navigator.clipboard.writeText(r.dataUrl);
      setCopied(r.id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      downloadDataUrl(r.dataUrl, filename);
    }
  };

  return (
    <div className="card p-6 md:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="btn-ghost !px-3 !py-2 shrink-0">
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <div className="eyebrow">Step 5 · Your Results</div>
            <h2 className="h-display text-2xl md:text-3xl font-bold mt-1">Three ways to see it</h2>
            <p className="text-belami-navy/70 mt-1 text-sm">
              {product.name} · {formatDims(product)} · SKU {product.sku}
            </p>
          </div>
        </div>
        <button className="btn-ghost" onClick={onReset}>
          <RefreshCw size={15} /> Start new try-on
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {results.map((r) => (
          <article key={r.id} className="group relative overflow-hidden rounded-2xl bg-white shadow-premium">
            <div className="relative">
              <img src={r.dataUrl} alt={r.label} className="w-full h-auto object-cover" />
              <button
                onClick={() => setPreview(r)}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-belami-navy shadow-md hover:bg-white transition"
                title="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
              <div className="absolute left-3 top-3 rounded-full bg-belami-navy/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white">
                {r.label}
              </div>
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest text-belami-navy/50 font-semibold">
                  {product.sku}
                </div>
                <div className="font-semibold text-belami-navy truncate">{product.name}</div>
                <div className="text-xs text-belami-navy/60">{formatDims(product)} · {product.placement}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadDataUrl(r.dataUrl, `belami-${product.sku}-${r.id}.jpg`)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-belami-navy px-3 py-2 text-xs font-semibold text-white hover:bg-belami-navy-light transition"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => handleShare(r)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-belami-navy/15 bg-white px-3 py-2 text-xs font-semibold text-belami-navy hover:border-belami-gold hover:text-belami-gold transition"
                >
                  {copied === r.id ? <Check size={14} /> : <Share2 size={14} />}
                  {copied === r.id ? 'Copied' : 'Share'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-belami-navy/85 backdrop-blur-sm p-6"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute right-6 top-6 rounded-full bg-white p-2 text-belami-navy shadow-md"
          >
            <X size={18} />
          </button>
          <img
            src={preview.dataUrl}
            alt={preview.label}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
