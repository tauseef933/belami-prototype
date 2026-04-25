import { motion } from 'framer-motion';
import { Upload, LayoutGrid, Sparkles, ArrowRight, Ruler, Wand2, Download } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: '1. Upload your room',
    body: 'Use your own photo or start from one of our curated demo rooms.',
  },
  {
    icon: LayoutGrid,
    title: '2. Pick a product',
    body: 'Browse lighting, fans, furniture and decor from the Belami collection.',
  },
  {
    icon: Sparkles,
    title: '3. Generate the look',
    body: 'See four studio-quality variations at true-to-life dimensions — in seconds.',
  },
];

const trustChips = [
  { icon: Ruler, label: 'Dimension-accurate' },
  { icon: Wand2, label: 'AI-free private compositing' },
  { icon: Download, label: 'Instant HD download' },
];

export default function Hero({ onStart }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background flourish */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-belami-blue/20 via-belami-gold/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-16 h-[460px] w-[460px] rounded-full bg-gradient-to-tr from-belami-navy/20 via-belami-blue/10 to-transparent blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pt-10 pb-20 lg:pt-20 lg:pb-32">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <div className="eyebrow mb-5">Bailey Street Home · Virtual Try-On Studio</div>
            <h1 className="h-display text-4xl sm:text-5xl lg:text-6xl font-bold">
              See it in <span className="text-belami-gold">your room</span>,
              <br />
              at the <span className="italic">exact</span> size it really is.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-belami-navy/75">
              Drop in a photo of your space, choose a Belami piece, and watch it appear
              at true-to-life scale — with daytime, evening and dimension-guided previews
              crafted for confident buying.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button className="btn-gold animate-pulse-gold" onClick={onStart}>
                Start Virtual Try-On <ArrowRight size={16} />
              </button>
              <a href="#how-it-works" className="btn-ghost">
                How it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-2.5">
              {trustChips.map(({ icon: Icon, label }) => (
                <span key={label} className="chip">
                  <Icon size={14} />
                  {label}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5"
          >
            <div className="relative">
              <div className="card overflow-hidden">
                <div className="relative">
                  <img
                    src="/rooms/room1.jpg"
                    alt="Preview of a styled living room"
                    className="h-[420px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-belami-navy/30 via-transparent to-transparent" />
                  <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-belami-navy shadow-md">
                    <span className="h-2 w-2 rounded-full bg-belami-gold animate-pulse" />
                    Live preview · Dimension accurate
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/80">Featured</div>
                      <div className="font-display text-xl font-semibold text-white">
                        Hayley Common Chandelier
                      </div>
                    </div>
                    <div className="rounded-xl bg-belami-gold px-3 py-2 text-xs font-bold text-white shadow-gold">
                      24" × 24"
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-premium">
                <div className="h-9 w-9 rounded-full bg-belami-blue/10 text-belami-blue flex items-center justify-center">
                  <Ruler size={18} />
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-semibold text-belami-navy">True-scale preview</div>
                  <div className="text-belami-navy/60">Calibrated to 80" door / 108" ceiling</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="mt-24">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="h-display text-3xl sm:text-4xl font-bold mt-2">
                Three simple steps to a confident decision
              </h2>
            </div>
            <p className="max-w-md text-belami-navy/70">
              Our compositing engine blends your room photo with Belami's catalog using
              dimension-accurate scaling and studio lighting presets — no cloud AI required.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="card p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="h-12 w-12 rounded-2xl bg-belami-navy text-white flex items-center justify-center shadow-premium">
                  <s.icon size={22} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-belami-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-belami-navy/70 text-sm leading-relaxed">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
