import React, { useState, useMemo } from 'react';
import { ProductSummaryData } from '../types';

interface ProductSummaryTableProps {
  primaryData: ProductSummaryData[];
  comparisonData: ProductSummaryData[];
  isComparing: boolean;
}

type SortKeys = keyof ProductSummaryData;
type SortDirection = 'asc' | 'desc';

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
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
    const formatCurrencyRound = (value: number) => new Intl.NumberFormat('vi-VN').format(Math.round(value));

    const headers = [
      { label: 'Sản phẩm', key: 'product' as SortKeys, isNumeric: false },
      { label: 'Lợi nhuận', key: 'profit' as SortKeys, isNumeric: true, isPositiveGood: true, bold: true, color: 'text-blue-600' },
      { label: 'LN/đơn', key: 'profitPerOrder' as SortKeys, isNumeric: true, isPositiveGood: true, bold: true, color: 'text-cyan-600', formatter: formatCurrencyRound },
      { label: 'Doanh thu', key: 'revenue' as SortKeys, isNumeric: true, isPositiveGood: true, color: 'text-green-600' },
      { label: 'SL đơn', key: 'orders' as SortKeys, isNumeric: true, isPositiveGood: true, color: 'text-purple-600' },
      { label: 'Chi phí QC', key: 'adCost' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-red-600' },
      { label: 'QC/đơn', key: 'adCostPerOrder' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-gray-800', formatter: formatCurrencyRound },
      { label: 'Chi phí VH', key: 'operatingCost' as SortKeys, isNumeric: true, isPositiveGood: false, color: 'text-orange-600' },
    ];


  return (
    <div className="h-96 flex flex-col">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Tổng quan theo sản phẩm</h3>
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-100">
            <tr className="border-b-2 border-gray-200 text-gray-500">
                {headers.map(header => (
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
                 {headers.slice(1).map(header => (
                    <td key={header.key} className={`p-3 ${header.color}`}>
                       <ComparisonCell 
                         primaryValue={row.primary[header.key as keyof ProductSummaryData] as number}
                         comparisonValue={row.comparison?.[header.key as keyof ProductSummaryData] as number | undefined}
                         formatter={header.formatter || formatCurrency}
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