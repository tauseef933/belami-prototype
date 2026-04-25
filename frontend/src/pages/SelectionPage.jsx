import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import RoomUploader from '../components/RoomUploader.jsx';
import ProductCard from '../components/ProductCard.jsx';
import LoadingSkeleton from '../components/LoadingSkeleton.jsx';
import { useProducts } from '../hooks/useProducts.js';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'fans', label: 'Fans' },
  { id: 'decor', label: 'Decor' },
];

export default function SelectionPage({ tryOn, onResult }) {
  const { products, loading, error } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedRoom, selectedProduct, selectRoom, selectProduct } = tryOn;

  const filteredProducts = useMemo(
    () => products.filter(product => activeCategory === 'all' || product.category === activeCategory),
    [activeCategory, products]
  );

  const canPreview = selectedRoom && selectedProduct;
  const selectedRoomSrc = selectedRoom?.src || (selectedRoom ? `/rooms/${selectedRoom.file}` : null);

  const handlePreview = () => {
    if (!canPreview || isGenerating) return;
    setIsGenerating(true);
    window.setTimeout(() => {
      setIsGenerating(false);
      onResult();
    }, 2200);
  };

  return (
    <main className="min-h-screen bg-belami-cream px-4 pb-32 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-xl">
        <div className="mb-6">
          <p className="text-xs font-700 uppercase tracking-[0.24em] text-belami-blue">Belami Preview Studio</p>
          <h1 className="mt-2 font-display text-3xl font-800 text-belami-navy sm:text-4xl">
            Build Your Room Preview
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-belami-navy/10 bg-white p-5 shadow-premium sm:p-6">
            <h2 className="mb-4 text-lg font-800 text-belami-navy">Choose Your Room</h2>
            {selectedRoomSrc && (
              <div className="mb-4 overflow-hidden rounded-3xl border border-belami-navy/10 bg-belami-cream/60">
                <img
                  src={selectedRoomSrc}
                  alt={selectedRoom.label}
                  className="h-auto w-full object-contain"
                />
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-800 text-belami-navy">{selectedRoom.label}</span>
                  <span className="rounded-full bg-belami-navy/10 px-3 py-1 text-xs font-700 text-belami-navy/60">
                    Room only preview
                  </span>
                </div>
              </div>
            )}
            <RoomUploader selectedRoom={selectedRoom} onSelect={selectRoom} />
            {selectedRoom && (
              <p className="mt-4 text-sm font-700 text-belami-navy">
                Selected: {selectedRoom.label}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-belami-navy/10 bg-white p-5 shadow-premium sm:p-6">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-800 text-belami-navy">Choose a Product</h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-700 transition-all duration-200 ${
                      activeCategory === category.id
                        ? 'bg-belami-navy text-white'
                        : 'border border-belami-navy/15 bg-white text-belami-navy/65 hover:bg-belami-navy/5'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-600 text-red-600">
                {error}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-belami-navy/10 bg-belami-cream/60 p-8 text-center text-sm text-belami-navy/50">
                No products in this category.
              </div>
            ) : (
              <motion.div layout className="grid max-h-[620px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.sku}
                      product={product}
                      isSelected={selectedProduct?.sku === product.sku}
                      isAnalyzing={false}
                      isDisabled={false}
                      onSelect={() => selectProduct(product)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-belami-navy/10 bg-white/95 px-4 py-4 shadow-[0_-12px_40px_rgba(27,58,92,0.12)] backdrop-blur">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm font-700 ${canPreview ? 'text-belami-navy' : 'text-belami-navy/40'}`}>
            {canPreview
              ? `${selectedRoom.label} + ${selectedProduct.name}`
              : 'Select a room and product to preview'}
          </p>
          <button
            type="button"
            disabled={!canPreview || isGenerating}
            onClick={handlePreview}
            className={`rounded-2xl px-6 py-3 text-sm font-800 transition-all duration-200 ${
              canPreview
                ? 'bg-belami-gold text-belami-navy shadow-md hover:scale-[1.01]'
                : 'cursor-not-allowed bg-gray-200 text-gray-500'
            }`}
          >
            {isGenerating ? 'Generating Preview…' : 'Preview in Room →'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-belami-navy/90 px-4 backdrop-blur-md"
          >
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-7 text-center shadow-premium">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-belami-gold/15">
                <div className="h-10 w-10 rounded-full border-4 border-belami-gold/25 border-t-belami-gold animate-spin" />
              </div>
              <h2 className="text-2xl font-800 text-belami-navy">AI is generating your room preview</h2>
              <p className="mt-3 text-sm leading-6 text-belami-navy/60">
                Analyzing room perspective, matching product scale, and rendering the final Belami preview.
              </p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-belami-navy/10">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-belami-gold" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
