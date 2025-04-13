import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ProductBoardClient } from '../../lib/api/productboard';
import { Select } from '../ui/Select';

interface ProductSelectorProps {
  apiKey: string;
  value: string;
  onChange: (productId: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
}

/**
 * A component that displays a dropdown of ProductBoard products.
 * 
 * This component fetches products from ProductBoard and displays them in a dropdown.
 * When a product is selected, it triggers the onChange callback with the product ID.
 */
export function ProductSelector({
  apiKey,
  value,
  onChange,
  error,
  label = 'ProductBoard Product',
  required = false
}: ProductSelectorProps) {
  const [products, setProducts] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!apiKey) return;
    
    const loadProducts = async () => {
      setLoading(true);
      try {
        const client = new ProductBoardClient(apiKey);
        const productsData = await client.getProducts();
        
        // Transform to format expected by Select component
        const options = productsData.map(product => ({
          value: product.id,
          label: product.name
        }));
        
        setProducts(options);
      } catch (error) {
        console.error('Error loading ProductBoard products:', error);
        toast.error('Failed to load ProductBoard products');
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [apiKey]);

  return (
    <Select
      label={label}
      value={value}
      onChange={e => {
        console.log('ProductSelector onChange called with value:', e.target.value);
        onChange(e.target.value);
      }}
      error={error}
      required={required}
      disabled={loading || products.length === 0}
      options={products.length > 0 ? products : [{ value: '', label: loading ? 'Loading products...' : 'No products available' }]}
    />
  );
}
