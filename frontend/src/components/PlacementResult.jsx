import { motion }                            from 'framer-motion';
import { Sparkles, MapPin, Info, BarChart2 } from 'lucide-react';

export default function PlacementResult({ placement, product }) {
  if (!placement) return null;

  const { suggestion, reasoning, x_percent, y_percent, scale_factor } = placement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y:  0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-belami-blue/15 shadow-premium overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-belami-navy to-belami-blue px-4 py-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-belami-gold" />
        <h3 className="text-sm font-700 text-white">Gemini AI Recommendation</h3>
        <span className="ml-auto text-[10px] text-white/60 font-500">
          {product?.name}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Suggestion */}
        {suggestion && (
          <div className="flex gap-3">
            <MapPin className="w-4 h-4 text-belami-blue flex-shrink-0 mt-0.5" />
            <p className="text-sm font-600 text-belami-navy leading-relaxed">{suggestion}</p>
          </div>
        )}

        {/* Reasoning */}
        {reasoning && (
          <div className="flex gap-3 bg-belami-cream/60 rounded-xl p-3">
            <Info className="w-4 h-4 text-belami-navy/50 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-belami-navy/70 leading-relaxed">{reasoning}</p>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Position X" value={`${Math.round(x_percent ?? 0)}%`} />
          <Metric label="Position Y" value={`${Math.round(y_percent ?? 0)}%`} />
          <Metric label="Scale"      value={`×${Number(scale_factor ?? 1).toFixed(2)}`} />
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-belami-navy/5 rounded-xl p-2.5 text-center">
      <p className="text-[10px] text-belami-navy/50 font-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-700 text-belami-navy mt-0.5">{value}</p>
    </div>
  );
}
