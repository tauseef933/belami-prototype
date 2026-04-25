import { Lightbulb, Fan, Sofa, Frame, ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '../data/products.js';

const ICONS = { Lightbulb, Fan, Sofa, Frame };

export default function CategorySelector({ value, onSelect, onBack, products = [] }) {
  return (
    <div className="card p-6 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost !px-3 !py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="eyebrow">Step 2</div>
          <h2 className="h-display text-2xl md:text-3xl font-bold mt-1">Choose a category</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.icon] || Lightbulb;
          const count = products.filter((p) => p.category === c.id).length;
          const selected = value === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                selected
                  ? 'border-belami-gold shadow-gold bg-white'
                  : 'border-transparent bg-white hover:border-belami-navy/20 hover:-translate-y-1 shadow-premium'
              }`}
            >
              <div
                className={`absolute inset-0 -z-10 bg-gradient-to-br ${c.accent} opacity-0 group-hover:opacity-10 transition-opacity ${
                  selected ? 'opacity-15' : ''
                }`}
              />
              <div className="h-14 w-14 rounded-2xl bg-belami-navy text-white flex items-center justify-center shadow-premium">
                <Icon size={26} />
              </div>
              <div className="mt-5 font-display text-xl font-bold text-belami-navy">
                {c.label}
              </div>
              <div className="text-sm text-belami-navy/60">{c.tagline}</div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-belami-gold">
                {count} {count === 1 ? 'Product' : 'Products'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
