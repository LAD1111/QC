import React, { useState } from 'react';
import { AdData } from '../types';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Line,
} from 'recharts';

interface MainChartProps {
  data: AdData[];
  isComparing: boolean;
}

const formatYAxisCurrency = (value: number) => {
    if(value >= 1000000) return `${(value / 1000000).toFixed(1)}Tr`;
    if(value >= 1000) return `${(value / 1000).toFixed(0)}N`;
    return value.toString();
}

const formatYAxisOrders = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
}

const formatDateForDisplay = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return isoDate;
}

const formatDateForAxis = (isoDate: string): string => {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
      const [_, month, day] = parts;
      return `${day}/${month}`;
  }
  return isoDate;
}


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    const formatNumber = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
    
    const data = payload[0].payload;

    return (
      <div className="bg-white/80 backdrop-blur-sm p-4 border border-gray-200 rounded-lg shadow-lg text-gray-800">
        <p className="label font-bold text-lg">{formatDateForDisplay(label)}</p>
        {payload.find(p => p.dataKey === 'revenue') && <p className="text-green-600">{`Doanh thu : ${formatCurrency(data.revenue)}`}</p>}
        {payload.find(p => p.dataKey === 'adCost') && <p className="text-red-600">{`Chi phí QC : ${formatCurrency(data.adCost)}`}</p>}
        {payload.find(p => p.dataKey === 'operatingCost') && <p className="text-orange-600">{`Chi phí VH : ${formatCurrency(data.operatingCost)}`}</p>}
        {payload.find(p => p.dataKey === 'profit') && <p className="text-blue-600">{`Lợi nhuận : ${formatCurrency(data.profit)}`}</p>}
        {payload.find(p => p.dataKey === 'orders') && <p className="text-purple-600">{`SL đơn : ${formatNumber(data.orders)}`}</p>}
      </div>
    );
  }

  return null;
};

const MainChart: React.FC<MainChartProps> = ({ data, isComparing }) => {
  const [visibility, setVisibility] = useState({
    revenue: true,
    adCost: true,
    operatingCost: false,
    profit: true,
    orders: false,
  });

  const handleLegendClick = (e: any) => {
    const { dataKey } = e;
    if (dataKey in visibility) {
        setVisibility(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey as keyof typeof prev]
        }));
    }
  };

  const renderLegendText = (value: string, entry: any) => {
    const { dataKey } = entry;
    const isVisible = visibility[dataKey as keyof typeof visibility];
    return (
      <span className={`transition-colors ${isVisible ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
        {value}
      </span>
    );
  };
  
  return (
    <div className="h-96 w-full">
        <div>
            <h3 className="text-xl font-semibold text-gray-900">Tổng quan hiệu suất kinh doanh</h3>
            {isComparing && <p className="text-sm text-gray-500">Hiển thị dữ liệu cho kỳ chính</p>}
        </div>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 5, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 12 }} tickFormatter={formatDateForAxis} />
          <YAxis yAxisId="left" stroke="#4b5563" tickFormatter={formatYAxisCurrency} tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tickFormatter={formatYAxisOrders} tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px', cursor: 'pointer' }}
            onClick={handleLegendClick}
            formatter={renderLegendText}
          />
          <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#10B981" barSize={20} hide={!visibility.revenue} />
          <Bar yAxisId="left" dataKey="adCost" name="Chi phí QC" fill="#EF4444" barSize={20} hide={!visibility.adCost} />
          <Bar yAxisId="left" dataKey="operatingCost" name="Chi phí VH" fill="#F97316" barSize={20} hide={!visibility.operatingCost} />
          <Line yAxisId="left" type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#3B82F6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} hide={!visibility.profit} />
          <Line yAxisId="right" type="monotone" dataKey="orders" name="SL đơn" stroke="#8B5CF6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} hide={!visibility.orders} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MainChart;