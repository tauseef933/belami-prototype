import { useEffect, useMemo, useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';

// Lookup convention: /final result/{SKU}+{roomName}.png
// roomName is extracted from the room filename without extension e.g. room3.jpg → room3
function getResultImagePath(sku, roomName) {
  return `/final result/${sku}+${roomName}.png`;
}

function getResultImageCandidates(sku, roomName) {
  return [
    getResultImagePath(sku, roomName),
    `/final result/${sku}+${roomName}.jpg`,
    `/final-results/${sku}+${roomName}.png`,
    `/final-results/${sku}+${roomName}.jpg`,
  ];
}

export default function ResultPage({ tryOn, onBack }) {
  const {
    selectedRoom,
    selectedProduct,
    resultPath,
    resultMissing,
    setResultMissing,
    resetToSelection,
  } = tryOn;

  const [candidateIndex, setCandidateIndex] = useState(0);

  const imageCandidates = useMemo(() => (
    selectedProduct && selectedRoom
      ? getResultImageCandidates(selectedProduct.sku, selectedRoom.name)
      : []
  ), [selectedProduct, selectedRoom]);

  const imagePath = resultPath && candidateIndex === 0 ? resultPath : imageCandidates[candidateIndex];

  useEffect(() => {
    setCandidateIndex(0);
    setResultMissing(false);
  }, [selectedProduct?.sku, selectedRoom?.name, setResultMissing]);

  const handleImageError = () => {
    if (candidateIndex < imageCandidates.length - 1) {
      setCandidateIndex(index => index + 1);
      return;
    }
    setResultMissing(true);
  };

  const handleDownload = () => {
    if (!imagePath) return;
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = imagePath.split('/').pop();
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleTryAnother = () => {
    resetToSelection();
    onBack();
  };

  useEffect(() => {
    if (!imagePath) setResultMissing(true);
  }, [imagePath, setResultMissing]);

  if (selectedRoom?.isUploaded && selectedProduct && !resultMissing) {
    return (
      <main className="min-h-screen bg-belami-cream px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-screen-xl">
          <div className="overflow-hidden rounded-3xl border border-belami-navy/10 bg-white shadow-premium">
            <div className="bg-belami-navy px-5 py-4">
              <p className="text-xs font-700 uppercase tracking-[0.24em] text-belami-gold">Belami AI Preview</p>
              <h1 className="mt-1 text-2xl font-800 text-white sm:text-3xl">Your Uploaded Room Preview</h1>
            </div>
            <div className="p-4 sm:p-6">
              <div className="relative overflow-hidden rounded-3xl bg-belami-navy/5">
                <img
                  src={selectedRoom.src}
                  alt={selectedRoom.label}
                  className="h-auto w-full object-contain"
                />
                <div className="absolute inset-0 flex items-end justify-center p-6 sm:p-10">
                  <div className="relative w-[34%] min-w-[130px] max-w-[360px] rounded-3xl bg-white/10 p-2 drop-shadow-2xl backdrop-blur-[1px]">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                </div>
                <div className="absolute left-4 top-4 rounded-full bg-belami-gold px-4 py-2 text-xs font-800 text-belami-navy shadow-md">
                  AI Preview Generated
                </div>
              </div>
              <p className="mt-4 text-center text-sm font-700 text-belami-navy">
                {selectedProduct.name} + Uploaded Room
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleTryAnother}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-belami-navy/15 bg-white px-6 py-3 text-sm font-800 text-belami-navy transition-colors duration-200 hover:bg-belami-navy/5"
                >
                  <RotateCcw className="h-4 w-4" />
                  Try Another Combination
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedRoom || !selectedProduct || !imagePath || resultMissing) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-belami-cream px-4 py-10">
        <div className="max-w-md rounded-3xl border border-belami-navy/10 bg-white p-8 text-center shadow-premium">
          <h1 className="text-2xl font-800 text-belami-navy">No preview available for this combination</h1>
          <p className="mt-3 text-sm leading-6 text-belami-navy/60">
            This room and product combination hasn't been generated yet.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 rounded-2xl bg-belami-navy px-6 py-3 text-sm font-800 text-white transition-colors duration-200 hover:bg-belami-blue"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-belami-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-screen-xl">
        <div className="overflow-hidden rounded-3xl border border-belami-navy/10 bg-white shadow-premium">
          <div className="bg-belami-navy px-5 py-4">
            <p className="text-xs font-700 uppercase tracking-[0.24em] text-belami-gold">Belami Preview</p>
            <h1 className="mt-1 text-2xl font-800 text-white sm:text-3xl">Your Room Preview</h1>
          </div>
          <div className="p-4 sm:p-6">
            <img
              src={imagePath}
              alt={`${selectedProduct.name} in ${selectedRoom.label}`}
              onError={handleImageError}
              className="h-auto w-full object-contain"
            />
            <p className="mt-4 text-center text-sm font-700 text-belami-navy">
              {selectedProduct.name} + {selectedRoom.label}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-belami-gold px-6 py-3 text-sm font-800 text-belami-navy transition-transform duration-200 hover:scale-[1.01]"
              >
                <Download className="h-4 w-4" />
                Download Image
              </button>
              <button
                type="button"
                onClick={handleTryAnother}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-belami-navy/15 bg-white px-6 py-3 text-sm font-800 text-belami-navy transition-colors duration-200 hover:bg-belami-navy/5"
              >
                <RotateCcw className="h-4 w-4" />
                Try Another Combination
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
