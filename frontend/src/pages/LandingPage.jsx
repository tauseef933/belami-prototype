import { motion } from 'framer-motion';

export default function LandingPage({ onStart }) {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-belami-navy px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(46,134,171,0.55),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(241,143,1,0.35),_transparent_32%)]" />
      <div className="absolute inset-x-8 top-8 h-32 rounded-full bg-white/10 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2"
      >
        <div className="text-center lg:text-left">
          <div className="mb-6 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-700 uppercase tracking-[0.28em] text-belami-gold">
            Belami Virtual Try-On
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-800 leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            See It In Your Room Before You Buy
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-500 leading-8 text-belami-cream/85 sm:text-xl">
            Visualize premium Belami furnishings in your space with AI-powered room preview
          </p>
          <button
            type="button"
            onClick={onStart}
            className="mt-10 rounded-2xl bg-belami-gold px-8 py-4 text-base font-800 text-belami-navy shadow-premium transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Visualizing →
          </button>
          <div className="mt-12 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm font-600 text-belami-cream/80">
            Powered by Gemini AI · Belami Premium Collection
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-belami-gold/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-premium backdrop-blur">
            <img
              src="/final result/208-BEL-1046230+room3.png"
              alt="Belami product preview in a room"
              className="h-auto w-full rounded-[1.5rem] object-contain"
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/15 bg-belami-navy/80 p-4 backdrop-blur">
              <p className="text-xs font-700 uppercase tracking-[0.22em] text-belami-gold">Preview Ready</p>
              <p className="mt-1 text-sm font-600 text-belami-cream">Generated room visualization for fast client demos</p>
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  );
}
