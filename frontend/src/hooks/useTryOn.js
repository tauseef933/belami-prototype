import { useCallback, useState } from 'react';

function roomNameFromFile(file) {
  return file.replace(/\.[^/.]+$/, '');
}

function resultPathFor(product, room) {
  if (!product || !room) return null;
  return `/final result/${product.sku}+${room.name}.png`;
}

export function useTryOn() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [resultPath, setResultPath] = useState(null);
  const [resultMissing, setResultMissing] = useState(false);

  const selectRoom = useCallback((room) => {
    const nextRoom = {
      ...room,
      name: room.name || roomNameFromFile(room.file),
    };

    setSelectedRoom(nextRoom);
    setResultMissing(false);
    setResultPath(resultPathFor(selectedProduct, nextRoom));
  }, [selectedProduct]);

  const selectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setResultMissing(false);
    setResultPath(resultPathFor(product, selectedRoom));
  }, [selectedRoom]);

  const clearAll = useCallback(() => {
    setSelectedRoom(null);
    setSelectedProduct(null);
    setResultPath(null);
    setResultMissing(false);
  }, []);

  const resetToSelection = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return {
    selectedRoom,
    selectedProduct,
    resultPath,
    resultMissing,
    selectRoom,
    selectProduct,
    clearAll,
    resetToSelection,
    setResultMissing,
  };
}