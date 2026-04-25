import { motion }                       from 'framer-motion';
import { Loader2, CheckCircle, Zap }    from 'lucide-react';

const PLACEMENT_LABELS = {
  ceiling:  '🔆 Ceiling',
  wall:     '🖼️ Wall',
  floor:    '🪑 Floor',
  tabletop: '🏺 Tabletop',
};

const CATEGORY_COLORS = {
  lighting:  'bg-amber-100 text-amber-700',
  fans:      'bg-sky-100   text-sky-700',
  furniture: 'bg-emerald-100 text-emerald-700',
  decor:     'bg-purple-100  text-purple-700',
};

export default function ProductCard({
  product,
  isSelected,
  isAnalyzing,
  isDisabled,
  onSelect,
}) {
  const dimStr = [
    product.width  && `${product.width}"W`,
    product.height && `${product.height}"H`,
    product.depth  && `${product.depth}"D`,
  ].filter(Boolean).join(' × ');

  const catColor = CATEGORY_COLORS[product.category] || 'bg-gray-100 text-gray-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onSelect}
        disabled={isDisabled}
        className={`
          w-full text-left rounded-2xl overflow-hidden border-2 transition-all duration-200
          flex flex-col bg-white shadow-sm
          ${isSelected
            ? 'border-belami-blue shadow-premium ring-2 ring-belami-blue/20'
            : isDisabled
            ? 'border-belami-navy/10 opacity-50 cursor-not-allowed'
            : 'border-belami-navy/10 hover:border-belami-blue/40 hover:shadow-md active:scale-[0.98]'
          }
        `}
      >
        {/* Product Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
              🏠
            </div>
          )}

          {/* Selected badge */}
          {isSelected && !isAnalyzing && (
            <div className="absolute top-2 right-2 bg-belami-blue text-white rounded-full p-1 shadow-md">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-belami-navy/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
              <span className="text-white text-xs font-600">AI Analyzing…</span>
            </div>
          )}

          {/* Category badge */}
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-700 uppercase tracking-wider ${catColor}`}>
            {product.category}
          </span>
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-1.5 flex-1">
          <p className="text-xs font-700 text-belami-navy leading-tight line-clamp-2">
            {product.name}
          </p>

          <div className="flex items-center justify-between gap-1">
            {dimStr && (
              <span className="text-[10px] text-belami-navy/50 font-500 font-mono">
                {dimStr}
              </span>
            )}
            {product.placement && (
              <span className="text-[10px] text-belami-navy/50 font-500 whitespace-nowrap">
                {PLACEMENT_LABELS[product.placement] || product.placement}
              </span>
            )}
          </div>

          {product.price && (
            <p className="text-sm font-700 text-belami-gold">{product.price}</p>
          )}

          {!isDisabled && !isSelected && !isAnalyzing && (
            <div className="flex items-center gap-1 text-[10px] text-belami-blue font-600 pt-0.5">
              <Zap className="w-3 h-3" />
              <span>Tap to visualize</span>
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}