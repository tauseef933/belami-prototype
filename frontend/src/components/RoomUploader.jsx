import { useEffect, useRef, useState } from 'react';
import { Check, Upload } from 'lucide-react';

const ROOMS = Array.from({ length: 8 }, (_, index) => {
  const number = index + 1;
  return {
    name: `room${number}`,
    file: `room${number}.jpg`,
    label: `Room ${number}`,
  };
});

export default function RoomUploader({ selectedRoom, onSelect }) {
  const [hiddenRooms, setHiddenRooms] = useState(new Set());
  const [uploadedRoom, setUploadedRoom] = useState(null);
  const inputRef = useRef(null);
  const uploadedUrlRef = useRef(null);
  const visibleRooms = ROOMS.filter(room => !hiddenRooms.has(room.file));

  useEffect(() => {
    return () => {
      if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    };
  }, []);

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file?.type?.startsWith('image/')) return;

    if (uploadedUrlRef.current) URL.revokeObjectURL(uploadedUrlRef.current);
    const src = URL.createObjectURL(file);
    uploadedUrlRef.current = src;

    const room = {
      name: file.name.replace(/\.[^/.]+$/, ''),
      file: file.name,
      label: 'Uploaded Room',
      src,
      isUploaded: true,
    };
    setUploadedRoom(room);
    onSelect(room);
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleUpload}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-5 text-sm font-800 transition-all ${
          selectedRoom?.isUploaded
            ? 'border-belami-gold bg-belami-gold/10 text-belami-navy'
            : 'border-belami-navy/15 bg-belami-cream/50 text-belami-navy/70 hover:border-belami-blue hover:bg-belami-blue/5'
        }`}
      >
        <Upload className="h-5 w-5" />
        Upload Your Room Image
      </button>

      {uploadedRoom && (
        <RoomThumb
          room={uploadedRoom}
          src={uploadedRoom.src}
          selected={selectedRoom?.isUploaded && selectedRoom.file === uploadedRoom.file}
          onClick={() => onSelect(uploadedRoom)}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visibleRooms.map((room) => {
          const selected = selectedRoom?.file === room.file;
          return (
            <RoomThumb
              key={room.file}
              room={room}
              src={`/rooms/${room.file}`}
              selected={selected}
              onClick={() => onSelect(room)}
              onError={() => setHiddenRooms(prev => new Set([...prev, room.file]))}
            />
          );
        })}
      </div>
    </div>
  );
}

function RoomThumb({ room, src, selected, onClick, onError }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative aspect-[4/3] overflow-hidden rounded-2xl border-2 bg-white shadow-sm transition-all ${
        selected
          ? 'border-belami-gold ring-2 ring-belami-gold/30'
          : 'border-belami-navy/10 hover:border-belami-blue/40'
      }`}
    >
      <img
        src={src}
        alt={room.label}
        loading="lazy"
        onError={onError}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-belami-navy/70 px-2 py-1 text-left text-xs font-600 text-white">
        {room.label}
      </div>
      {selected && (
        <div className="absolute right-2 top-2 rounded-full bg-belami-gold p-1 text-white shadow-md">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  );
}