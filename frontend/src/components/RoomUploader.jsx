/**
 * RoomUploader
 * ------------
 * Large drag-and-drop zone at top.
 * Below: small thumbnail strip of sample rooms from /rooms/ folder.
 * Clicking a thumbnail loads it as the room photo.
 */
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence }        from 'framer-motion';
import { Upload, Check, AlertCircle }     from 'lucide-react';

// Add filenames that exist in frontend/public/rooms/
const SAMPLE_ROOMS = [
  { id: 'lr1', file: 'room 1.jpg',  label: 'Living Room'   },
  { id: 'lr2', file: 'room 2.jpg',  label: 'Living Room 2' },
  { id: 'br1', file: 'room 3.jpg',      label: 'Bedroom'       },
  { id: 'br2', file: 'room 4.jpg',      label: 'Bedroom 2'     },
  { id: 'dr1', file: 'dining-room-1.jpg',  label: 'Dining Room'   },
  { id: 'of1', file: 'home-office-1.jpg',  label: 'Home Office'   },
  { id: 'kt1', file: 'kitchen-1.jpg',      label: 'Kitchen'       },
  { id: 'lo1', file: 'loft-1.jpg',         label: 'Loft'          },
];

export default function RoomUploader({ onFileSelected }) {
  const [dragging,    setDragging]    = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [activeId,    setActiveId]    = useState(null);
  const [loadErrors,  setLoadErrors]  = useState(new Set());
  const [localError,  setLocalError]  = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    if (!file?.type?.startsWith('image/')) {
      setLocalError('Please choose an image file (JPG, PNG or WEBP).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setLocalError('Image must be under 15 MB.');
      return;
    }
    setLocalError(null);
    setUploading(true);
    try {
      await onFileSelected(file);
    } catch (err) {
      setLocalError(err.message || 'Failed to load image.');
    } finally {
      setUploading(false);
      setActiveId(null);
    }
  }, [onFileSelected]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const onInputChange = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleSample = useCallback(async (room) => {
    if (uploading) return;
    setActiveId(room.id);
    setLocalError(null);
    setUploading(true);
    try {
      const resp = await fetch(`/rooms/${room.file}`);
      if (!resp.ok) throw new Error(`Could not load sample: ${room.file}`);
      const blob = await resp.blob();
      const file = new File([blob], room.file, { type: blob.type || 'image/jpeg' });
      await onFileSelected(file);
    } catch (err) {
      setLocalError(err.message);
      setActiveId(null);
    } finally {
      setUploading(false);
    }
  }, [uploading, onFileSelected]);

  const visibleSamples = SAMPLE_ROOMS.filter(r => !loadErrors.has(r.id));

  return (
    <div className="space-y-4">
      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        animate={dragging ? { scale: 1.01 } : { scale: 1 }}
        className={`
          relative rounded-2xl border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center gap-3 p-8
          min-h-[180px] transition-colors duration-200
          ${dragging
            ? 'border-belami-blue bg-belami-blue/6'
            : 'border-belami-navy/20 bg-white hover:border-belami-blue/50 hover:bg-belami-blue/3'
          }
          ${uploading && activeId === null ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onInputChange}
        />

        {uploading && activeId === null ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-belami-blue/20 border-t-belami-blue animate-spin" />
            <p className="text-sm text-belami-navy/50 font-500">Loading…</p>
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
              dragging ? 'bg-belami-blue/15' : 'bg-belami-navy/8'
            }`}>
              <Upload className={`w-5 h-5 ${dragging ? 'text-belami-blue' : 'text-belami-navy/50'}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-600 text-belami-navy">
                {dragging ? 'Drop photo here' : 'Upload your room photo'}
              </p>
              <p className="text-xs text-belami-navy/45 mt-0.5">
                Drag & drop or <span className="text-belami-blue font-600">browse</span>
                {' '}· JPG, PNG, WEBP up to 15 MB
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* ── Error message ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {localError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {localError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sample room thumbnails ─────────────────────────────────────── */}
      {visibleSamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-600 text-belami-navy/50 uppercase tracking-wider">
            Or pick a sample room
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scroll-x">
            {visibleSamples.map((room) => (
              <motion.button
                key={room.id}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSample(room)}
                disabled={uploading}
                title={room.label}
                className={`
                  relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all
                  ${activeId === room.id
                    ? 'border-belami-blue ring-2 ring-belami-blue/25'
                    : 'border-transparent hover:border-belami-blue/40'
                  }
                  ${uploading && activeId !== room.id ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <img
                  src={`/rooms/${room.file}`}
                  alt={room.label}
                  loading="lazy"
                  onError={() => setLoadErrors(prev => new Set([...prev, room.id]))}
                  className="w-full h-full object-cover"
                />

                {/* Hover label */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/25 transition-colors flex items-end">
                  <span className="text-[9px] font-600 text-white px-1 pb-0.5 opacity-0 hover:opacity-100 leading-tight line-clamp-1">
                    {room.label}
                  </span>
                </div>

                {/* Loading/selected indicator */}
                {activeId === room.id && (
                  <div className="absolute inset-0 bg-belami-navy/40 flex items-center justify-center">
                    {uploading
                      ? <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                      : <Check className="w-4 h-4 text-white" />
                    }
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}