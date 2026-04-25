import { motion } from 'framer-motion';
import { Wand2 }  from 'lucide-react';

const STAGES = [
  { at:  0, label: 'Loading AI model…'    },
  { at: 15, label: 'Detecting edges…'     },
  { at: 40, label: 'Removing background…' },
  { at: 70, label: 'Refining cutout…'     },
  { at: 92, label: 'Finishing up…'        },
];

export default function BgRemovalProgress({ progress, productName }) {
  const stage = [...STAGES].reverse().find(s => progress >= s.at) ?? STAGES[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="bg-white rounded-2xl border border-belami-blue/15 shadow-sm p-4 space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-belami-navy to-belami-blue flex items-center justify-center flex-shrink-0">
          <Wand2 className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-700 text-belami-navy">Removing Background</p>
          <p className="text-[11px] text-belami-navy/45 truncate">{productName}</p>
        </div>
        <span className="text-sm font-700 text-belami-blue tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-belami-navy/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-belami-blue to-belami-gold"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        />
      </div>

      <p className="text-[11px] text-belami-navy/45 text-center">{stage.label}</p>
    </motion.div>
  );
}
