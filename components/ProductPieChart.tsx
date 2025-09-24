import React, { useMemo } from 'react';
import { AdData } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ProductPieChartProps {
  data: AdData[];
  isComparing: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#FBBF24', '#8B5CF6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
     const format = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    return (
      <div className="bg-white/80 backdrop-blur-sm p-3 border border-gray-200 rounded-lg shadow-lg text-gray-800">
        <p className="font-bold">{`${payload[0].name}`}</p>
        <p>{`Chi phí quảng cáo : ${format(payload[0].value)} (${payload[0].payload.percent}%)`}</p>
      </div>
    );
  }

  return null;
};


const ProductPieChart: React.FC<ProductPieChartProps> = ({ data, isComparing }) => {
  const productAdCostData = useMemo(() => {
    // FIX: Replaced .reduce() with for...of loops to avoid a subtle type inference issue
    // where TypeScript was incorrectly inferring 'unknown' for aggregated values.
    // This more explicit approach ensures type correctness.
    const productMap: Map<string, number> = new Map();
    for (const item of data) {
      const currentCost = productMap.get(item.product) || 0;
      productMap.set(item.product, currentCost + item.adCost);
    }
    
    let totalAdCost = 0;
    for (const cost of productMap.values()) {
        totalAdCost += cost;
    }

    return Array.from(productMap.entries()).map(([name, value]) => ({
      name,
      value,
      percent: totalAdCost > 0 ? ((value / totalAdCost) * 100).toFixed(2) : '0.00'
    }));
  }, [data]);

  return (
    <div className="h-96 w-full flex flex-col">
       <div>
         <h3 className="text-xl font-semibold text-gray-900">Phân bổ chi phí quảng cáo theo sản phẩm</h3>
         {isComparing && <p className="text-sm text-gray-500">Hiển thị dữ liệu cho kỳ chính</p>}
       </div>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={productAdCostData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {productAdCostData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: '#374151', paddingTop: '20px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProductPieChart;