import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/products.js';
import ProductCard from './ProductCard.jsx';

export default function ProductPicker({ category, value, onSelect, onBack, onNext, products = [] }) {
  const cat = CATEGORIES.find((c) => c.id === category);

  return (
    <div className="card p-6 md:p-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost !px-3 !py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <div className="eyebrow">Step 3 · {cat?.label}</div>
          <h2 className="h-display text-2xl md:text-3xl font-bold mt-1">Select your product</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => (
          <ProductCard key={p.sku} product={p} selected={value?.sku === p.sku} onSelect={onSelect} />
        ))}
      </div>

      {value && (
        <div className="mt-8 flex items-center justify-end">
          <button className="btn-primary" onClick={onNext}>
            Continue to placement <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
