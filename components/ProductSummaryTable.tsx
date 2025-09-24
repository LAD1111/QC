import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProductSummaryData } from '../types';

interface ProductSummaryTableProps {
  primaryData: ProductSummaryData[];
  comparisonData: ProductSummaryData[];
  isComparing: boolean;
}

type SortKeys = keyof ProductSummaryData;
type SortDirection = 'asc' | 'desc';

// Define column configuration outside the component
const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const formatCurrencyRound = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

const COLUMNS_CONFIG = [
  { label: 'Lợi nhuận', key: 'profit' as SortKeys, isNumeric: true, isPositiveGood: true, bold: true, color: 'text-blue-600', formatter: formatCurrency },
  { label: 'LN/đơn', key: 'profitPerOrder' as SortKeys, isNumeric: true, isPositiveGood: true, bold: true, color: 'text-cyan-600', formatter: formatCurrencyRound },
  { label: 'Doanh thu', key: 'revenue' as SortKeys, isNumeric: true, isPositiveGood: true, color: 'text-green-600', formatter: formatCurrency },
  { label: 'SL đơn', key: 'orders' as SortKeys, isNumeric: true, isPositiveGood: true, color: 'text-purple-600', formatter: formatCurrency },
  { label: 'Chi phí QC', key: 'adCost' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-red-600', formatter: formatCurrency },
  { label: 'QC/đơn', key: 'adCostPerOrder' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-gray-800', formatter: formatCurrencyRound },
  { label: 'Chi phí VH', key: 'operatingCost' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-orange-600', formatter: formatCurrency },
];


const SortIcon = ({ direction }: { direction: SortDirection }) => (
    <span className="ml-1 text-blue-500">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
);

const calculateChange = (current: number, previous?: number) => {
    if (previous === undefined || previous === null) return null;
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
};

const ChangeIndicator: React.FC<{ change: number, isPositiveGood: boolean }> = ({ change, isPositiveGood }) => {
    const isPositive = (isPositiveGood && change > 0) || (!isPositiveGood && change < 0);
    const isNegative = (isPositiveGood && change < 0) || (!isPositiveGood && change > 0);
    const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const arrow = change > 0 ? '▲' : '▼';

    if (!isFinite(change)) {
        return <span className="text-xs font-semibold text-green-600">Mới</span>;
    }
     if (change === 0) {
        return <span className="text-xs font-semibold text-gray-500">-</span>;
    }

    return (
        <span className={`text-xs font-semibold ${color}`}>
            {arrow} {Math.abs(change).toFixed(1)}%
        </span>
    );
};


const ComparisonCell: React.FC<{
    primaryValue: number;
    comparisonValue?: number;
    formatter: (value: number) => string;
    isPositiveGood?: boolean;
    isComparing: boolean;
    boldPrimary?: boolean;
}> = ({ primaryValue, comparisonValue, formatter, isPositiveGood = true, isComparing, boldPrimary = false }) => {
    const change = calculateChange(primaryValue, comparisonValue);
    
    return (
        <div>
            <p className={boldPrimary ? 'font-bold' : ''}>{formatter(primaryValue)}</p>
            {isComparing && change !== null && (
                <div className="flex items-center space-x-1">
                    <ChangeIndicator change={change} isPositiveGood={isPositiveGood} />
                    <span className="text-xs text-gray-500">({formatter(comparisonValue!)})</span>
                </div>
            )}
        </div>
    );
};


const ProductSummaryTable: React.FC<ProductSummaryTableProps> = ({ primaryData, comparisonData, isComparing }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: SortDirection } | null>({ key: 'profit', direction: 'desc' });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [columns, setColumns] = useState(() => COLUMNS_CONFIG.map(c => ({...c, isVisible: true})));

    const settingsRef = useRef<HTMLDivElement>(null);
    const draggedItemIndex = useRef<number | null>(null);
    const dragOverItemIndex = useRef<number | null>(null);
    
    // Close settings panel on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
          if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setIsSettingsOpen(false);
          }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [settingsRef]);


    const combinedData = useMemo(() => {
        const comparisonMap = new Map(comparisonData.map(c => [c.product, c]));
        
        return primaryData.map(primary => ({
            product: primary.product,
            primary,
            comparison: comparisonMap.get(primary.product),
        }));
    }, [primaryData, comparisonData]);


    const sortedData = useMemo(() => {
        let sortableItems = [...combinedData];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a.primary[sortConfig.key];
                const valB = b.primary[sortConfig.key];

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [combinedData, sortConfig]);

    const requestSort = (key: SortKeys) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleVisibilityToggle = (keyToToggle: string) => {
        setColumns(prevColumns =>
            prevColumns.map(col =>
                col.key === keyToToggle ? { ...col, isVisible: !col.isVisible } : col
            )
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        draggedItemIndex.current = index;
        e.currentTarget.classList.add('bg-blue-100', 'opacity-50');
    };

    const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, index: number) => {
        dragOverItemIndex.current = index;
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('bg-blue-100', 'opacity-50');
        draggedItemIndex.current = null;
        dragOverItemIndex.current = null;
    };

    const handleDrop = (e: React.DragEvent<HTMLLIElement>) => {
        e.currentTarget.classList.remove('bg-blue-100', 'opacity-50');
        if (draggedItemIndex.current === null || dragOverItemIndex.current === null || draggedItemIndex.current === dragOverItemIndex.current) {
            return;
        }

        const newColumns = [...columns];
        const [reorderedItem] = newColumns.splice(draggedItemIndex.current, 1);
        newColumns.splice(dragOverItemIndex.current, 0, reorderedItem);

        setColumns(newColumns);
    };
    
    const visibleColumns = columns.filter(c => c.isVisible);

  return (
    <div className="h-96 flex flex-col">
       <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Tổng quan theo sản phẩm</h3>
        <div className="relative" ref={settingsRef}>
            <button
                onClick={() => setIsSettingsOpen(prev => !prev)}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Tùy chỉnh cột"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            {isSettingsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                     <div className="p-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800">Tùy chỉnh cột</p>
                        <p className="text-xs text-gray-500">Kéo thả để sắp xếp.</p>
                    </div>
                    <ul className="max-h-80 overflow-y-auto p-2">
                        {columns.map((col, index) => (
                            <li
                                key={col.key}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnter={(e) => handleDragEnter(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-move"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={col.isVisible}
                                        onChange={() => handleVisibilityToggle(col.key)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3 cursor-pointer"
                                        id={`col-toggle-${col.key}`}
                                    />
                                    <label htmlFor={`col-toggle-${col.key}`} className="text-sm text-gray-800 select-none cursor-pointer flex-grow">{col.label}</label>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-100">
            <tr className="border-b-2 border-gray-200 text-gray-500">
                <th className="p-3 font-semibold cursor-pointer hover:text-gray-900" onClick={() => requestSort('product')}>
                    Sản phẩm
                    {sortConfig?.key === 'product' && <SortIcon direction={sortConfig.direction} />}
                </th>
                {visibleColumns.map(header => (
                     <th key={header.key} className="p-3 font-semibold cursor-pointer hover:text-gray-900" onClick={() => requestSort(header.key)}>
                        {header.label}
                        {sortConfig?.key === header.key && <SortIcon direction={sortConfig.direction} />}
                    </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr key={row.product} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                 <td className="p-3 font-medium">{row.product}</td>
                 {visibleColumns.map(header => (
                    <td key={header.key} className={`p-3 ${header.color}`}>
                       <ComparisonCell 
                         primaryValue={row.primary[header.key as keyof ProductSummaryData] as number}
                         comparisonValue={row.comparison?.[header.key as keyof ProductSummaryData] as number | undefined}
                         formatter={header.formatter}
                         isPositiveGood={header.isPositiveGood}
                         isComparing={isComparing}
                         boldPrimary={header.bold}
                       />
                    </td>
                 ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductSummaryTable;