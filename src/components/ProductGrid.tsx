'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/types/product';
import styles from '@/styles/ProductGrid.module.css';

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        console.log('Fetching products, attempt:', retryCount + 1);
        
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          
          throw new Error(
            errorData.error || `Error: ${response.status}`
          );
        }
        
        const data = await response.json();
        console.log('Products loaded successfully:', data);
        
        setProducts(data.data || []);
        setError(null);
        setErrorDetails(null);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again later.');
        
        // Try to extract more detailed error information
        if (err.message) {
          setErrorDetails(err.message);
        }
        
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorTitle}>{error}</p>
        {errorDetails && (
          <p className={styles.errorDetails}>{errorDetails}</p>
        )}
        <div className={styles.actionContainer}>
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No products found.</p>
        <div className={styles.actionContainer}>
          <button 
            onClick={handleRetry}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {isLoading ? (
        <div className={styles.loading}>Loading products...</div>
      ) : error ? (
        <div className={styles.error}>Error loading products. Please try again.</div>
      ) : products.length === 0 ? (
        <div className={styles.empty}>No products found.</div>
      ) : (
        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
} 