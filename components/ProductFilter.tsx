import React, { useState, useEffect, useRef } from 'react';

interface ProductFilterProps {
  products: string[];
  selectedProducts: string[];
  onChange: (selected: string[]) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ products, selectedProducts, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelectAll = () => onChange(products);
  const handleDeselectAll = () => onChange([]);

  const handleProductToggle = (product: string) => {
    const newSelected = selectedProducts.includes(product)
      ? selectedProducts.filter(p => p !== product)
      : [...selectedProducts, product];
    onChange(newSelected);
  };
  
  const isAllSelected = products.length > 0 && selectedProducts.length === products.length;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full sm:w-52 bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>Sản phẩm ({selectedProducts.length}/{products.length})</span>
        <svg className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200" role="listbox">
          <div className="p-2 border-b border-gray-200">
            <button
              onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
              className="w-full text-left px-2 py-1 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded"
            >
              {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <ul className="max-h-60 overflow-y-auto p-1">
            {products.map(product => (
              <li key={product} className="hover:bg-gray-100 rounded">
                <label className="flex items-center w-full px-2 py-2 text-sm text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedProducts.includes(product)}
                    onChange={() => handleProductToggle(product)}
                  />
                  <span className="ml-3">{product}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductFilter;
