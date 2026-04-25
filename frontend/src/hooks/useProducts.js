import { useState, useEffect } from 'react';
import { fetchProducts } from '../utils/api.js';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchProducts()
      .then(data => {
        if (!cancelled) {
          setProducts(data.products || []);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load products');
          setProducts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { products, loading, error };
}
