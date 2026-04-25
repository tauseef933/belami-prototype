// ─── ProductCard ──────────────────────────────────────────────────────────
import { motion }                      from 'framer-motion';
import { Loader2, CheckCircle, Zap }   from 'lucide-react';

const PLACEMENT_ICONS = { ceiling:'🔆', wall:'🖼️', floor:'🪑', tabletop:'🏺' };
const CAT_COLORS = {
  lighting:  'bg-amber-100  text-amber-700',
  fans:      'bg-sky-100    text-sky-700',
  furniture: 'bg-emerald-100 text-emerald-700',
  decor:     'bg-purple-100  text-purple-700',
};

export function ProductCard({ product, isSelected, isAnalyzing, isDisabled, onSelect }) {
  const dims = [
    product.width  && `${product.width}"W`,
    product.height && `${product.height}"H`,
    product.depth  && `${product.depth}"D`,
  ].filter(Boolean).join(' × ');

  return (
    <motion.div layout initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }} transition={{ duration: 0.2 }}>
      <button
        onClick={onSelect}
        disabled={isDisabled}
        className={`
          w-full text-left rounded-2xl overflow-hidden border-2 flex flex-col bg-white shadow-sm transition-all duration-200
          ${isSelected
            ? 'border-belami-blue shadow-premium ring-2 ring-belami-blue/20'
            : isDisabled
            ? 'border-belami-navy/10 opacity-50 cursor-not-allowed'
            : 'border-belami-navy/10 hover:border-belami-blue/40 hover:shadow-md active:scale-[0.98]'
          }
        `}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image
            ? <img src={product.image} alt={product.name} loading="lazy"
                className="w-full h-full object-contain p-2"
                onError={e => { e.target.style.display='none'; }} />
            : <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-20">🏠</div>
          }
          {isSelected && !isAnalyzing && (
            <div className="absolute top-2 right-2 bg-belami-blue text-white rounded-full p-1 shadow">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          )}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-belami-navy/55 backdrop-blur-sm flex flex-col items-center justify-center gap-1.5">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
              <span className="text-white text-[10px] font-600">Processing…</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider ${CAT_COLORS[product.category] || 'bg-gray-100 text-gray-600'}`}>
            {product.category}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1 flex-1">
          <p className="text-xs font-700 text-belami-navy leading-tight line-clamp-2">{product.name}</p>
          <div className="flex items-center justify-between gap-1 flex-wrap">
            {dims && <span className="text-[10px] text-belami-navy/45 font-500 font-mono">{dims}</span>}
            {product.placement && (
              <span className="text-[10px] text-belami-navy/45">
                {PLACEMENT_ICONS[product.placement]} {product.placement}
              </span>
            )}
          </div>
          {product.price && <p className="text-sm font-700 text-belami-gold">{product.price}</p>}
          {!isDisabled && !isSelected && !isAnalyzing && (
            <div className="flex items-center gap-1 text-[10px] text-belami-blue font-600 pt-0.5">
              <Zap className="w-3 h-3" /><span>Tap to visualize</span>
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────
import { AlertCircle, X } from 'lucide-react';

export function ErrorBanner({ message, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity:0, y:-8, height:0 }} animate={{ opacity:1, y:0, height:'auto' }}
      exit={{ opacity:0, y:-8, height:0 }} transition={{ duration:0.3 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700 font-500 flex-1 leading-relaxed">{message}</p>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── LoadingSkeleton ──────────────────────────────────────────────────────
export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white border border-belami-navy/10 animate-pulse">
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded-full w-4/5" />
            <div className="h-3 bg-gray-100 rounded-full w-2/5" />
            <div className="h-4 bg-gray-100 rounded-full w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
