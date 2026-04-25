/**
 * useTryOn — manages the complete virtual try-on workflow
 *
 * Flow:
 *  IDLE  →  ROOM_READY  →  REMOVING_BG  →  ANALYZING  →  RESULT
 *                                                       ↘  ERROR
 */
import { useState, useCallback, useRef } from 'react';
import { getPlacementSuggestion }        from '../utils/api.js';

export const STEP = {
  IDLE:        'idle',
  ROOM_READY:  'room_ready',
  REMOVING_BG: 'removing_bg',
  ANALYZING:   'analyzing',
  RESULT:      'result',
  ERROR:       'error',
};

export function useTryOn() {
  const [step,             setStep]             = useState(STEP.IDLE);
  const [roomImage,        setRoomImage]        = useState(null);   // { file, dataUrl, width, height }
  const [selectedProduct,  setSelectedProduct]  = useState(null);
  const [productCutoutUrl, setProductCutoutUrl] = useState(null);   // object URL of bg-removed PNG
  const [placement,        setPlacement]        = useState(null);   // Gemini result
  const [error,            setError]            = useState(null);
  const [bgProgress,       setBgProgress]       = useState(0);      // 0-100

  // Cache WASM module — loads once, reused on subsequent calls
  const imglyRef     = useRef(null);
  const prevCutout   = useRef(null); // track object URL for cleanup

  // ── Load room photo ──────────────────────────────────────────────────
  const loadRoom = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file?.type?.startsWith('image/')) {
        return reject(new Error('Please select an image file (JPG, PNG, WEBP).'));
      }
      if (file.size > 15 * 1024 * 1024) {
        return reject(new Error('Image must be under 15 MB.'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const img     = new Image();
        img.onload  = () => {
          if (prevCutout.current) { URL.revokeObjectURL(prevCutout.current); prevCutout.current = null; }
          setRoomImage({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
          setSelectedProduct(null);
          setProductCutoutUrl(null);
          setPlacement(null);
          setError(null);
          setStep(STEP.ROOM_READY);
          resolve();
        };
        img.onerror = () => reject(new Error('Could not read image dimensions.'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });
  }, []);

  // ── Select product: remove bg → call Gemini ──────────────────────────
  const analyzeProduct = useCallback(async (product) => {
    if (!roomImage) throw new Error('No room image loaded.');

    setSelectedProduct(product);
    setPlacement(null);
    setError(null);

    // ─── Phase 1: Background Removal ────────────────────────────────
    setStep(STEP.REMOVING_BG);
    setBgProgress(0);

    let cutoutUrl = product.image; // fallback = original image

    try {
      // Lazy-load heavy WASM once
      if (!imglyRef.current) {
        setBgProgress(5);
        const mod = await import('@imgly/background-removal');
        imglyRef.current = mod;
        setBgProgress(15);
      }

      const { removeBackground } = imglyRef.current;

      // Fetch product image as blob (works for /products/*.jpg paths)
      const resp = await fetch(product.image);
      if (!resp.ok) throw new Error(`Could not fetch product image (HTTP ${resp.status})`);
      const inputBlob = await resp.blob();

      setBgProgress(20);

      const resultBlob = await removeBackground(inputBlob, {
        output: {
          format:  'image/png',
          quality: 1.0,          // full quality — no compression
        },
        progress: (_key, current, total) => {
          if (total > 0) {
            // Map WASM progress 0-1 → 20-95%
            const pct = 20 + Math.round((current / total) * 75);
            setBgProgress(Math.min(95, pct));
          }
        },
      });

      setBgProgress(100);

      // Revoke previous object URL to avoid memory leaks
      if (prevCutout.current) URL.revokeObjectURL(prevCutout.current);
      cutoutUrl = URL.createObjectURL(resultBlob);
      prevCutout.current = cutoutUrl;
      setProductCutoutUrl(cutoutUrl);

    } catch (bgErr) {
      // BG removal failed — silently fall back to original image
      console.warn('[useTryOn] BG removal failed, using original:', bgErr.message);
      setProductCutoutUrl(product.image);
      cutoutUrl = product.image;
    }

    // ─── Phase 2: Gemini Placement ────────────────────────────────────
    setStep(STEP.ANALYZING);

    try {
      const result = await getPlacementSuggestion(
        roomImage.dataUrl,
        roomImage.file?.type || 'image/jpeg',
        {
          name:      product.name,
          width:     product.width,
          height:    product.height,
          depth:     product.depth,
          placement: product.placement,
        }
      );
      setPlacement(result.placement);
      setStep(STEP.RESULT);
      return result.placement;
    } catch (err) {
      setError(err.message || 'AI placement failed. Please try again.');
      setStep(STEP.ERROR);
      throw err;
    }
  }, [roomImage]);

  // ── Reset ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    if (prevCutout.current) { URL.revokeObjectURL(prevCutout.current); prevCutout.current = null; }
    setStep(STEP.IDLE);
    setRoomImage(null);
    setSelectedProduct(null);
    setProductCutoutUrl(null);
    setPlacement(null);
    setError(null);
    setBgProgress(0);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setStep(roomImage ? STEP.ROOM_READY : STEP.IDLE);
  }, [roomImage]);

  const resetToRoom = useCallback(() => {
    if (prevCutout.current) { URL.revokeObjectURL(prevCutout.current); prevCutout.current = null; }
    setStep(STEP.ROOM_READY);
    setSelectedProduct(null);
    setProductCutoutUrl(null);
    setPlacement(null);
    setError(null);
    setBgProgress(0);
  }, []);

  return {
    step, roomImage, selectedProduct, productCutoutUrl,
    placement, error, bgProgress,
    loadRoom, analyzeProduct, reset, resetToRoom, clearError,
  };
}