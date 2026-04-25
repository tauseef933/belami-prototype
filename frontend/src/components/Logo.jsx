export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative h-9 w-9 rounded-xl bg-belami-navy shadow-premium flex items-center justify-center">
        <span className="font-display font-bold text-white text-lg leading-none tracking-tight">B</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-belami-gold ring-2 ring-white" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-belami-navy text-xl font-bold tracking-tight">Belami</div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-belami-gold font-semibold">Virtual Try-On</div>
      </div>
    </div>
  );
}
