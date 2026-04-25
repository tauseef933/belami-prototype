import { Check } from 'lucide-react';

const STEPS = [
  { id: 'room',     label: 'Room' },
  { id: 'category', label: 'Category' },
  { id: 'product',  label: 'Product' },
  { id: 'prompt',   label: 'Place' },
  { id: 'results',  label: 'Results' },
];

export default function Stepper({ current }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <nav className="w-full">
      <ol className="flex items-center justify-between gap-2 overflow-x-auto">
        {STEPS.map((s, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;
          return (
            <li key={s.id} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-belami-gold border-belami-gold text-white'
                      : isCurrent
                      ? 'bg-belami-navy border-belami-navy text-white shadow-premium'
                      : 'bg-white border-belami-navy/20 text-belami-navy/50'
                  }`}
                >
                  {isDone ? <Check size={14} /> : i + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold truncate ${
                    isCurrent ? 'text-belami-navy' : 'text-belami-navy/50'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-3 h-px flex-1 bg-gradient-to-r from-belami-navy/20 to-belami-navy/5" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
