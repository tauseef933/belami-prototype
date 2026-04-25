export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden bg-white border border-belami-navy/10 shadow-sm animate-pulse">
          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded-full w-4/5" />
            <div className="h-3 bg-gray-100 rounded-full w-2/5" />
            <div className="h-4 bg-gray-100 rounded-full w-1/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
