import React, { useState, useMemo } from 'react';
import { AdData } from '../types';

interface DataTableProps {
  data: AdData[];
}

type SortKeys = keyof AdData;
type SortDirection = 'asc' | 'desc';

const SortIcon = ({ direction }: { direction: SortDirection }) => (
    <span className="ml-1 text-blue-500">
      {direction === 'asc' ? '▲' : '▼'}
    </span>
);

const formatDateForDisplay = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return isoDate;
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: SortDirection } | null>({ key: 'date', direction: 'desc' });

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];
                
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
    }, [data, sortConfig]);

    const requestSort = (key: SortKeys) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('vi-VN').format(value);


  return (
    <div className="h-96 flex flex-col">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Chi tiết dữ liệu</h3>
      <div className="flex-grow overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-gray-100">
            <tr className="border-b-2 border-gray-200 text-gray-500">
              {['Ngày', 'Sản phẩm', 'Chi phí quảng cáo', 'Chi phí vận hành', 'Doanh thu', 'SL đơn', 'QC/đơn', 'Lợi nhuận', 'LN/đơn', 'Tỉ lệ lợi nhuận'].map((header, index) => {
                  const key = ['date', 'product', 'adCost', 'operatingCost', 'revenue', 'orders', 'adCostPerOrder', 'profit', 'profitPerOrder', 'profitMargin'][index] as SortKeys;
                  return (
                    <th key={header} className="p-3 font-semibold cursor-pointer hover:text-gray-900" onClick={() => requestSort(key)}>
                        {header}
                        {sortConfig?.key === key && <SortIcon direction={sortConfig.direction} />}
                    </th>
                  );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                <td className="p-3">{formatDateForDisplay(row.date)}</td>
                <td className="p-3">{row.product}</td>
                <td className="p-3 text-red-600">{formatCurrency(row.adCost)}</td>
                <td className="p-3 text-orange-600">{formatCurrency(row.operatingCost)}</td>
                <td className="p-3 text-green-600">{formatCurrency(row.revenue)}</td>
                <td className="p-3 text-purple-600">{formatCurrency(row.orders)}</td>
                <td className="p-3 text-gray-800">{formatCurrency(Math.round(row.adCostPerOrder))}</td>
                <td className="p-3 text-blue-600">{formatCurrency(row.profit)}</td>
                <td className="p-3 text-cyan-600">{formatCurrency(Math.round(row.profitPerOrder))}</td>
                <td className="p-3 text-yellow-600">{row.profitMargin.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;