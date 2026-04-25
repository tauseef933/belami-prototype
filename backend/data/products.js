/**
 * Backend product catalog — mirrors the Excel data for quick in-memory lookups.
 * The /api/products route reads from Excel; this file is only for tryOn.js
 * which needs SKU → product resolution without reading Excel on every request.
 */
export const PRODUCTS = [
  {
    sku:       '147-BEL-2279195',
    name:      'Hayley Common 6-Light Chandelier',
    category:  'lighting',
    width:     24,
    height:    24,
    placement: 'ceiling',
  },
  {
    sku:       '116-BEL-4412774',
    name:      'Crawford Chase 1-Light Wall Sconce',
    category:  'lighting',
    width:     8,
    height:    11.25,
    placement: 'wall',
  },
  {
    sku:       'SKYX-2118',
    name:      'Altair SkyFan 52" 3-Blade Ceiling Fan',
    category:  'fans',
    width:     52,
    height:    12,
    placement: 'ceiling',
  },
  {
    sku:       '183-BEL-5022980',
    name:      'Ovation 5-Blade Ceiling Fan 52"',
    category:  'fans',
    width:     52,
    height:    13.25,
    placement: 'ceiling',
  },
  {
    sku:       '208-BEL-5125884',
    name:      'Tuskar Street Sofa',
    category:  'furniture',
    width:     96,
    height:    31,
    depth:     38,
    placement: 'floor',
  },
  {
    sku:       '208-BEL-4972035',
    name:      'Brooklands Newydd 2-Door Cabinet',
    category:  'furniture',
    width:     40.25,
    height:    32.5,
    placement: 'floor',
  },
  {
    sku:       '208-BEL-5273571',
    name:      'Framed Abstract Art',
    category:  'decor',
    width:     41.5,
    height:    59.5,
    placement: 'wall',
  },
  {
    sku:       '208-BEL-3383246',
    name:      'Kitchener Pines Dorado Horse Sculpture',
    category:  'decor',
    width:     14,
    height:    16.5,
    depth:     5.125,
    placement: 'tabletop',
  },
];

export const getProductBySku = (sku) =>
  PRODUCTS.find(p => p.sku === sku) ?? null;