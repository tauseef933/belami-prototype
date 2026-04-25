import { useState, useCallback }     from 'react';
import { motion, AnimatePresence }    from 'framer-motion';
import {
  Home, Sparkles, ChevronRight, RotateCcw,
  CheckCircle, ImageIcon, LayoutGrid, Wand2,
} from 'lucide-react';

import { useProducts }                from './hooks/useProducts.js';
import { useTryOn, STEP }             from './hooks/useTryOn.js';
import RoomUploader                   from './components/RoomUploader.jsx';
import TryOnCanvas                    from './components/TryOnCanvas.jsx';
import BgRemovalProgress              from './components/BgRemovalProgress.jsx';
import {
  ProductCard, PlacementResult,
  ErrorBanner, LoadingSkeleton,
}                                     from './components/index.jsx';

const CATEGORIES = [
  { id: 'all',       label: 'All'       },
  { id: 'furniture', label: 'Furniture' },
  { id: 'lighting',  label: 'Lighting'  },
  { id: 'fans',      label: 'Fans'      },
  { id: 'decor',     label: 'Decor'     },
];

export default function App() {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const {
    step, roomImage, selectedProduct, productCutoutUrl,
    placement, error, bgProgress,
    loadRoom, analyzeProduct, reset, resetToRoom, clearError,
  } = useTryOn();

  const [activeCategory, setActiveCategory] = useState('all');
  const [analyzingId,    setAnalyzingId]    = useState(null);

  const filtered = products.filter(
    p => activeCategory === 'all' || p.category === activeCategory
  );

  const isProcessing = step === STEP.REMOVING_BG || step === STEP.ANALYZING;

  const handleRoomLoad = useCallback(async (file) => {
    try { await loadRoom(file); }
    catch { /* error shown by RoomUploader itself */ }
  }, [loadRoom]);

  const handleSelectProduct = useCallback(async (product) => {
    if (isProcessing) return;
    if (!roomImage)   return;
    setAnalyzingId(product.sku);
    try   { await analyzeProduct(product); }
    catch { /* error stored in hook state */ }
    finally { setAnalyzingId(null); }
  }, [isProcessing, roomImage, analyzeProduct]);

  return (
    <div className="min-h-screen bg-belami-cream font-sans">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-belami-navy/10 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-belami-navy to-belami-blue flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold text-belami-navy tracking-tight">Belami</span>
              <span className="text-xs font-medium text-belami-blue uppercase tracking-widest hidden sm:inline">
                Virtual Try-On
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {step !== STEP.IDLE && (
              <button
                onClick={step === STEP.RESULT ? resetToRoom : reset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-belami-navy/55 hover:text-belami-navy hover:bg-belami-navy/8 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {step === STEP.RESULT ? 'Try Another' : 'Start Over'}
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-belami-navy/40">
              <Sparkles className="w-3.5 h-3.5 text-belami-gold" />
              <span className="hidden sm:inline font-medium">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Step bar ─────────────────────────────────────────────── */}
        <StepBar step={step} />

        {/* ── Error banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {error && <ErrorBanner message={error} onDismiss={clearError} />}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEP 1 — No room loaded yet                               */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step === STEP.IDLE && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y:  0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white rounded-3xl border border-belami-navy/10 shadow-premium p-6 sm:p-8">
              <RoomUploader onFileSelected={handleRoomLoad} />
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STEPS 2+ — Room loaded: two-column layout                 */}
        {/* ══════════════════════════════════════════════════════════ */}
        {step !== STEP.IDLE && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start">

            {/* LEFT: Room canvas ─────────────────────────────────── */}
            <div className="space-y-4">
              <SectionLabel icon={<ImageIcon className="w-4 h-4" />} title="Room Preview" />

              {/* BG removal progress bar */}
              <AnimatePresence mode="wait">
                {step === STEP.REMOVING_BG && (
                  <BgRemovalProgress
                    progress={bgProgress}
                    productName={selectedProduct?.name ?? ''}
                  />
                )}
              </AnimatePresence>

              {/* Main interactive canvas */}
              {roomImage && (
                <TryOnCanvas
                  roomDataUrl={roomImage.dataUrl}
                  productUrl={step === STEP.RESULT ? productCutoutUrl : null}
                  placement={step === STEP.RESULT ? placement : null}
                  isAnalyzing={step === STEP.ANALYZING}
                />
              )}

              {/* AI suggestion card */}
              <AnimatePresence>
                {step === STEP.RESULT && placement && (
                  <PlacementResult placement={placement} product={selectedProduct} />
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT: Product catalog ────────────────────────────── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel icon={<LayoutGrid className="w-4 h-4" />} title="Select a Product" />
              </div>

              {/* Category pills */}
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-belami-navy text-white shadow-md'
                        : 'bg-white text-belami-navy/65 hover:bg-belami-navy/10 border border-belami-navy/15'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Instruction hint */}
              {step === STEP.ROOM_READY && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-start gap-2.5 bg-belami-blue/8 rounded-xl px-3 py-2.5"
                >
                  <Wand2 className="w-4 h-4 text-belami-blue flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-belami-navy/70 font-medium leading-relaxed">
                    Tap any product. AI will remove its background and place it
                    in your room — then drag and resize to your liking.
                  </p>
                </motion.div>
              )}

              {/* Product grid */}
              {productsLoading ? (
                <LoadingSkeleton />
              ) : productsError ? (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                  <p className="text-sm text-red-600 font-medium">{productsError}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl bg-white border border-belami-navy/10 p-8 text-center">
                  <p className="text-sm text-belami-navy/45">No products in this category.</p>
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-2 gap-3 sm:gap-4 max-h-[600px] overflow-y-auto pr-1 custom-scroll"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map(product => (
                      <ProductCard
                        key={product.sku}
                        product={product}
                        isSelected={selectedProduct?.sku === product.sku}
                        isAnalyzing={analyzingId === product.sku}
                        isDisabled={isProcessing && analyzingId !== product.sku}
                        onSelect={() => handleSelectProduct(product)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

function SectionLabel({ icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-belami-blue">{icon}</span>
      <h2 className="text-sm font-bold text-belami-navy uppercase tracking-wider">{title}</h2>
    </div>
  );
}

function StepBar({ step }) {
  const steps = [
    { label: 'Choose Room',  done: step !== STEP.IDLE },
    { label: 'Pick Product', done: [STEP.REMOVING_BG, STEP.ANALYZING, STEP.RESULT].includes(step) },
    { label: 'See in Room',  done: step === STEP.RESULT },
  ];
  return (
    <div className="flex items-center bg-white rounded-2xl border border-belami-navy/10 shadow-sm px-4 py-3 overflow-x-auto">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-shrink-0">
          <div className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${
            s.done ? 'text-belami-blue' : 'text-belami-navy/35'
          }`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s.done ? 'bg-belami-blue text-white' : 'border-2 border-current'
            }`}>
              {s.done ? <CheckCircle className="w-3 h-3" /> : i + 1}
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className="w-4 h-4 text-belami-navy/20 mx-1 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}