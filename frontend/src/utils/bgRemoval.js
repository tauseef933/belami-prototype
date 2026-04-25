async function loadImage(src, timeoutMs = 20000) {
  return await new Promise((resolve, reject) => {
    if (!src) return reject(new Error('Missing image source'));
    const img = new Image();
    img.decoding = 'async';
    let done = false;
    const to = setTimeout(() => {
      if (done) return;
      done = true;
      reject(new Error('Image load timed out'));
    }, timeoutMs);
    img.onload = () => {
      if (done) return;
      done = true;
      clearTimeout(to);
      resolve(img);
    };
    img.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(to);
      reject(new Error('Image failed to load'));
    };
    img.src = src;
  });
}

export async function removeProductBackgroundHighRes(productSrc) {
  const img = await loadImage(productSrc);

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

