import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchAndParseData } from '../services/googleSheetService';
import { AdData, ProductSummaryData } from '../types';
import KPICard from './KPICard';
import MainChart from './MainChart';
import ProductPieChart from './ProductPieChart';
import DataTable from './DataTable';
import ProductSummaryTable from './ProductSummaryTable';
import ProductFilter from './ProductFilter';

const Loader = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-screen bg-red-50 rounded-lg p-8">
    <div className="text-center text-red-700">
      <h2 className="text-2xl font-bold mb-2">Ôi! Đã có lỗi xảy ra.</h2>
      <p>{message}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState<AdData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Primary date range
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Comparison date range
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [comparisonStartDate, setComparisonStartDate] = useState<string>('');
  const [comparisonEndDate, setComparisonEndDate] = useState<string>('');

  const [allProducts, setAllProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);


  const loadData = useCallback(async (isInitialLoad = false) => {
    setError(null);
    try {
        const fetchedData = await fetchAndParseData();
        setData(fetchedData);
        if (fetchedData.length > 0 && isInitialLoad) {
            const dates = fetchedData.map(d => d.date).sort();
            const minDate = dates[0];
            const maxDate = dates[dates.length - 1];
            setStartDate(minDate);
            setEndDate(maxDate);
            
            const products = [...new Set(fetchedData.map(d => d.product))].sort();
            setAllProducts(products);
            setSelectedProducts(products);
        }
    } catch (err) {
        setError('Không thể tải dữ liệu từ Google Sheet. Vui lòng kiểm tra console để biết thêm chi tiết.');
    }
  }, []);

  useEffect(() => {
    const initialLoad = async () => {
        setLoading(true);
        await loadData(true);
        setLoading(false);
    };
    initialLoad();
  }, [loadData]);

    // Effect to auto-populate comparison dates
    useEffect(() => {
        if (isComparing && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const prevEnd = new Date(start);
            prevEnd.setDate(prevEnd.getDate() - 1);

            const prevStart = new Date(prevEnd);
            prevStart.setDate(prevEnd.getDate() - diffDays + 1);

            const formatDate = (d: Date) => d.toISOString().split('T')[0];

            setComparisonStartDate(formatDate(prevStart));
            setComparisonEndDate(formatDate(prevEnd));
        }
    }, [isComparing, startDate, endDate]);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(false);
    setIsRefreshing(false);
  };
  
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    if (newStartDate && endDate && newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (newEndDate && startDate && newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
        const isAfterStartDate = !startDate || item.date >= startDate;
        const isBeforeEndDate = !endDate || item.date <= endDate;
        const isProductSelected = selectedProducts.length === 0 || selectedProducts.includes(item.product);
        return isAfterStartDate && isBeforeEndDate && isProductSelected;
    });
  }, [data, startDate, endDate, selectedProducts]);

  const filteredComparisonData = useMemo(() => {
    if (!isComparing) return [];
    return data.filter(item => {
        const isAfterStartDate = !comparisonStartDate || item.date >= comparisonStartDate;
        const isBeforeEndDate = !comparisonEndDate || item.date <= comparisonEndDate;
        const isProductSelected = selectedProducts.length === 0 || selectedProducts.includes(item.product);
        return isAfterStartDate && isBeforeEndDate && isProductSelected;
    });
  }, [data, isComparing, comparisonStartDate, comparisonEndDate, selectedProducts]);


  const calculateTotals = (d: AdData[]) => d.reduce(
      (acc, item) => {
        acc.totalRevenue += item.revenue;
        acc.totalAdCost += item.adCost;
        acc.totalOperatingCost += item.operatingCost;
        acc.totalProfit += item.profit;
        acc.totalOrders += item.orders;
        return acc;
      },
      { totalRevenue: 0, totalAdCost: 0, totalOperatingCost: 0, totalProfit: 0, totalOrders: 0 }
    );

  const primaryTotals = useMemo(() => calculateTotals(filteredData), [filteredData]);
  const comparisonTotals = useMemo(() => calculateTotals(filteredComparisonData), [filteredComparisonData]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
  }
  
  const getProductSummary = (d: AdData[]): ProductSummaryData[] => {
    const summaryMap = new Map<string, { adCost: number; revenue: number; profit: number; orders: number; operatingCost: number }>();

    d.forEach(item => {
      const existing = summaryMap.get(item.product) || { adCost: 0, revenue: 0, profit: 0, orders: 0, operatingCost: 0 };
      summaryMap.set(item.product, {
        adCost: existing.adCost + item.adCost,
        revenue: existing.revenue + item.revenue,
        profit: existing.profit + item.profit,
        orders: existing.orders + item.orders,
        operatingCost: existing.operatingCost + item.operatingCost,
      });
    });

    return Array.from(summaryMap.entries()).map(([product, totals]) => ({
      product,
      ...totals,
      adCostPerOrder: totals.orders > 0 ? totals.adCost / totals.orders : 0,
      profitPerOrder: totals.orders > 0 ? totals.profit / totals.orders : 0,
    }));
  };

  const productSummaryData = useMemo(() => getProductSummary(filteredData), [filteredData]);
  const productSummaryComparisonData = useMemo(() => getProductSummary(filteredComparisonData), [filteredComparisonData]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    
  const { minDateAvailable, maxDateAvailable } = useMemo(() => {
    if (data.length === 0) return { minDateAvailable: '', maxDateAvailable: ''};
    const dates = data.map(d => d.date).sort();
    return {
        minDateAvailable: dates[0],
        maxDateAvailable: dates[dates.length - 1],
    }
  }, [data]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bảng điều khiển chi phí quảng cáo</h1>
          <p className="text-gray-600 mt-1">Dữ liệu thời gian thực từ Google Sheet.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          aria-label="Cập nhật dữ liệu"
        >
          {isRefreshing ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566z" clipRule="evenodd" />
              </svg>
          )}
          <span>{isRefreshing ? 'Đang cập nhật...' : 'Cập nhật'}</span>
        </button>
      </header>
      
      {/* Filters */}
       <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            {/* Primary Period */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-r-0 md:border-r md:pr-4 border-gray-200">
                <div className="flex items-center gap-2">
                    <label htmlFor="startDate" className="text-gray-600 font-medium whitespace-nowrap">Từ ngày:</label>
                    <input type="date" id="startDate" value={startDate} min={minDateAvailable} max={maxDateAvailable} onChange={handleStartDateChange} className="w-full bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500" aria-label="Start Date" />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="endDate" className="text-gray-600 font-medium whitespace-nowrap">Đến ngày:</label>
                    <input type="date" id="endDate" value={endDate} min={startDate || minDateAvailable} max={maxDateAvailable} onChange={handleEndDateChange} className="w-full bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500" aria-label="End Date" />
                </div>
            </div>

            {/* Comparison Period */}
            <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:pl-4">
                <div className="flex items-center gap-2 col-span-full sm:col-span-2">
                    <input type="checkbox" id="compare-toggle" checked={isComparing} onChange={e => setIsComparing(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="compare-toggle" className="text-gray-600 font-medium">So sánh kỳ</label>
                </div>
                {isComparing && (
                    <>
                        <div className="flex items-center gap-2">
                            <label htmlFor="comparisonStartDate" className="text-gray-600 font-medium whitespace-nowrap">Từ:</label>
                            <input type="date" id="comparisonStartDate" value={comparisonStartDate} min={minDateAvailable} max={maxDateAvailable} onChange={e => setComparisonStartDate(e.target.value)} className="w-full bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500" aria-label="Comparison Start Date" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="comparisonEndDate" className="text-gray-600 font-medium whitespace-nowrap">Đến:</label>
                            <input type="date" id="comparisonEndDate" value={comparisonEndDate} min={comparisonStartDate || minDateAvailable} max={maxDateAvailable} onChange={e => setComparisonEndDate(e.target.value)} className="w-full bg-gray-100 text-gray-900 rounded-md p-2 border border-gray-300 focus:ring-2 focus:ring-blue-500" aria-label="Comparison End Date" />
                        </div>
                    </>
                )}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
            <ProductFilter products={allProducts} selectedProducts={selectedProducts} onChange={setSelectedProducts} />
        </div>
    </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <KPICard title="Tổng doanh thu" value={formatCurrency(primaryTotals.totalRevenue)} icon="revenue" comparisonValue={isComparing ? formatCurrency(comparisonTotals.totalRevenue) : undefined} percentageChange={isComparing ? calculatePercentageChange(primaryTotals.totalRevenue, comparisonTotals.totalRevenue) : undefined} changeIsPositive={true} />
        <KPICard title="Tổng chi phí QC" value={formatCurrency(primaryTotals.totalAdCost)} icon="adCost" comparisonValue={isComparing ? formatCurrency(comparisonTotals.totalAdCost) : undefined} percentageChange={isComparing ? calculatePercentageChange(primaryTotals.totalAdCost, comparisonTotals.totalAdCost) : undefined} changeIsPositive={false} />
        <KPICard title="Tổng chi phí VH" value={formatCurrency(primaryTotals.totalOperatingCost)} icon="operatingCost" comparisonValue={isComparing ? formatCurrency(comparisonTotals.totalOperatingCost) : undefined} percentageChange={isComparing ? calculatePercentageChange(primaryTotals.totalOperatingCost, comparisonTotals.totalOperatingCost) : undefined} changeIsPositive={false} />
        <KPICard title="Tổng lợi nhuận" value={formatCurrency(primaryTotals.totalProfit)} icon="profit" comparisonValue={isComparing ? formatCurrency(comparisonTotals.totalProfit) : undefined} percentageChange={isComparing ? calculatePercentageChange(primaryTotals.totalProfit, comparisonTotals.totalProfit) : undefined} changeIsPositive={true} />
        <KPICard title="Tổng SL đơn" value={new Intl.NumberFormat('vi-VN').format(primaryTotals.totalOrders)} icon="orders" comparisonValue={isComparing ? new Intl.NumberFormat('vi-VN').format(comparisonTotals.totalOrders) : undefined} percentageChange={isComparing ? calculatePercentageChange(primaryTotals.totalOrders, comparisonTotals.totalOrders) : undefined} changeIsPositive={true}/>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <MainChart data={filteredData} isComparing={isComparing} />
          </div>
          <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <ProductPieChart data={filteredData} isComparing={isComparing} />
          </div>
           <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <ProductSummaryTable primaryData={productSummaryData} comparisonData={productSummaryComparisonData} isComparing={isComparing} />
          </div>
          <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <DataTable data={filteredData} />
          </div>
      </div>
    </div>
  );
};

export default Dashboard;