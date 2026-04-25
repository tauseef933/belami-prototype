import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles }       from 'lucide-react';

/**
 * Renders the room image with an animated dot indicating
 * where Gemini suggests placing the selected product.
 */
export default function PlacementOverlay({
  roomImage,
  product,
  placement,
  isAnalyzing,
}) {
  // x_percent / y_percent come from Gemini (0-100)
  const dotX = placement?.x_percent ?? null;
  const dotY = placement?.y_percent ?? null;

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: calcAspect(roomImage) }}>
      {/* Room photo */}
      <img
        src={roomImage.dataUrl}
        alt="Your room"
        className="w-full h-full object-cover rounded-2xl"
        draggable={false}
      />

      {/* Analyzing overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-belami-navy/55 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-8 h-8 text-belami-gold" />
            </motion.div>
            <div className="text-center">
              <p className="text-white font-700 text-sm">Gemini AI is analyzing</p>
              <p className="text-white/70 text-xs font-500 mt-0.5">
                Finding the perfect spot for {product?.name}…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placement dot */}
      <AnimatePresence>
        {!isAnalyzing && dotX !== null && dotY !== null && (
          <motion.div
            key={`dot-${dotX}-${dotY}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'absolute',
              left:     `${dotX}%`,
              top:      `${dotY}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="pointer-events-none"
          >
            {/* Pulsing ring */}
            <span className="absolute inset-0 rounded-full bg-belami-gold animate-ping opacity-75" />
            {/* Core dot */}
            <div className="relative w-5 h-5 rounded-full bg-belami-gold border-2 border-white shadow-gold flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>

            {/* Label callout */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <div className="bg-belami-gold text-white text-[10px] font-700 px-2 py-1 rounded-lg shadow-gold">
                Place here
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function calcAspect(roomImage) {
  if (!roomImage?.width || !roomImage?.height) return '16/9';
  return `${roomImage.width}/${roomImage.height}`;
}
