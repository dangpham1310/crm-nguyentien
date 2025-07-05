import React, { useState, useEffect } from 'react';

const ReportsView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [reportData, setReportData] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageDeliveryTime: 0,
    topCustomers: [],
    ordersByHour: [],
    ordersByStatus: [],
    revenueByMonth: [],
    ordersByCategory: []
  });

  // Mock data cho báo cáo
  useEffect(() => {
    const mockReportData = {
      totalOrders: 1256,
      completedOrders: 1142,
      pendingOrders: 78,
      cancelledOrders: 36,
      totalRevenue: 46800000,
      averageDeliveryTime: 32,
      topCustomers: [
        { name: 'Công ty TNHH ABC', orders: 128, totalSpent: 8400000, loyaltyPoints: 2500 },
        { name: 'Văn phòng XYZ', orders: 115, totalSpent: 7500000, loyaltyPoints: 2100 },
        { name: 'Siêu thị MNP', orders: 103, totalSpent: 6900000, loyaltyPoints: 1800 },
        { name: 'Nhà hàng DEF', orders: 98, totalSpent: 6000000, loyaltyPoints: 1600 },
        { name: 'Cửa hàng GHI', orders: 88, totalSpent: 5400000, loyaltyPoints: 1400 }
      ],
      ordersByHour: [
        { hour: '6h', orders: 12 },
        { hour: '7h', orders: 25 },
        { hour: '8h', orders: 45 },
        { hour: '9h', orders: 68 },
        { hour: '10h', orders: 85 },
        { hour: '11h', orders: 92 },
        { hour: '12h', orders: 78 },
        { hour: '13h', orders: 65 },
        { hour: '14h', orders: 59 },
        { hour: '15h', orders: 48 },
        { hour: '16h', orders: 42 },
        { hour: '17h', orders: 38 },
        { hour: '18h', orders: 26 },
        { hour: '19h', orders: 18 },
        { hour: '20h', orders: 12 }
      ],
      ordersByStatus: [
        { status: 'Hoàn thành', count: 1142, percentage: 90.9, color: '#10b981' },
        { status: 'Chờ xử lý', count: 78, percentage: 6.2, color: '#f59e0b' },
        { status: 'Đã hủy', count: 36, percentage: 2.9, color: '#ef4444' }
      ],
      revenueByMonth: [
        { month: 'T1', revenue: 38000000 },
        { month: 'T2', revenue: 42000000 },
        { month: 'T3', revenue: 45000000 },
        { month: 'T4', revenue: 48000000 },
        { month: 'T5', revenue: 44000000 },
        { month: 'T6', revenue: 50000000 },
        { month: 'T7', revenue: 52000000 },
        { month: 'T8', revenue: 49000000 },
        { month: 'T9', revenue: 46000000 },
        { month: 'T10', revenue: 48000000 },
        { month: 'T11', revenue: 51000000 },
        { month: 'T12', revenue: 46800000 }
      ],
      ordersByCategory: [
        { category: 'Điện tử', orders: 385, percentage: 30.7, color: '#3b82f6' },
        { category: 'Thời trang', orders: 314, percentage: 25.0, color: '#8b5cf6' },
        { category: 'Gia dụng', orders: 251, percentage: 20.0, color: '#06b6d4' },
        { category: 'Thực phẩm', orders: 188, percentage: 15.0, color: '#10b981' },
        { category: 'Khác', orders: 118, percentage: 9.3, color: '#f59e0b' }
      ]
    };
    
    setReportData(mockReportData);
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-100 text-green-800';
      case 'Chờ xử lý': return 'bg-yellow-100 text-yellow-800';
      case 'Đã hủy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const maxOrders = Math.max(...reportData.ordersByHour.map(item => item.orders));
  const maxRevenue = Math.max(...reportData.revenueByMonth.map(item => item.revenue));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📊 Báo cáo thống kê</h2>
        
        {/* Period Filter */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Thời gian:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm này</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalOrders.toLocaleString()}</p>
              <p className="text-xs text-green-600">+12.5% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đơn hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.completedOrders.toLocaleString()}</p>
              <p className="text-xs text-green-600">Tỷ lệ {((reportData.completedOrders / reportData.totalOrders) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-sm border border-yellow-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalRevenue)}</p>
              <p className="text-xs text-green-600">+8.3% so với tháng trước</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Thời gian TB</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.averageDeliveryTime} phút</p>
              <p className="text-xs text-red-600">+2.1% so với tháng trước</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Orders by Hour */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Đơn hàng theo giờ
          </h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {reportData.ordersByHour?.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full bg-gray-200 rounded-t-lg relative overflow-hidden" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ 
                      height: `${(item.orders / maxOrders) * 100}%`,
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white text-xs font-medium">
                      {item.orders > 20 ? item.orders : ''}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600 font-medium">{item.hour}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart - Orders by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Trạng thái đơn hàng
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Pie Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {reportData.ordersByStatus?.map((item, index) => {
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const previousPercentage = reportData.ordersByStatus?.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) || 0;
                  const strokeDashoffset = -((previousPercentage / 100) * circumference);
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="10"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                      style={{ animationDelay: `${index * 200}ms` }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{reportData.totalOrders}</div>
                  <div className="text-sm text-gray-500">Tổng đơn</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {reportData.ordersByStatus?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.count.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Revenue by Month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Doanh thu theo tháng
          </h3>
          <div className="h-64 relative">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.1 }} />
                </linearGradient>
              </defs>
              
              {/* Horizontal grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line key={i} x1="30" y1={30 + i * 35} x2="370" y2={30 + i * 35} stroke="#e5e7eb" strokeWidth="1" />
              ))}
              
              {/* Data points and line */}
              {reportData.revenueByMonth?.map((item, index) => {
                const x = 30 + (index * (340 / 11));
                const y = 170 - ((item.revenue / maxRevenue) * 140);
                const nextItem = reportData.revenueByMonth[index + 1];
                const nextX = nextItem ? 30 + ((index + 1) * (340 / 11)) : x;
                const nextY = nextItem ? 170 - ((nextItem.revenue / maxRevenue) * 140) : y;
                
                return (
                  <g key={index}>
                    {/* Line to next point */}
                    {nextItem && (
                      <line
                        x1={x}
                        y1={y}
                        x2={nextX}
                        y2={nextY}
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        className="animate-pulse"
                      />
                    )}
                    
                    {/* Data point */}
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#8b5cf6"
                      className="hover:r-6 transition-all duration-200"
                    />
                    
                    {/* Month label */}
                    <text
                      x={x}
                      y={190}
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                    >
                      {item.month}
                    </text>
                  </g>
                );
              })}
              
              {/* Area fill */}
              <path
                d={`M 30 170 ${reportData.revenueByMonth?.map((item, index) => {
                  const x = 30 + (index * (340 / 11));
                  const y = 170 - ((item.revenue / maxRevenue) * 140);
                  return `L ${x} ${y}`;
                }).join(' ')} L 370 170 Z`}
                fill="url(#gradient)"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* Donut Chart - Orders by Category */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Đơn hàng theo danh mục
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Donut Chart */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="35" fill="none" stroke="#e5e7eb" strokeWidth="15" />
                {reportData.ordersByCategory?.map((item, index) => {
                  const circumference = 2 * Math.PI * 35;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const previousPercentage = reportData.ordersByCategory?.slice(0, index).reduce((sum, prev) => sum + prev.percentage, 0) || 0;
                  const strokeDashoffset = -((previousPercentage / 100) * circumference);
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="15"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out hover:stroke-opacity-80"
                      style={{ animationDelay: `${index * 200}ms` }}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {reportData.ordersByCategory?.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Tổng đơn</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {reportData.ordersByCategory?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{item.orders.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Top khách hàng xuất sắc
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {reportData.topCustomers?.map((customer, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                <div className="relative mb-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-lg">{customer.name.charAt(0)}</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-yellow-800 font-bold text-sm">#{index + 1}</span>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{customer.name}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn hàng:</span>
                    <span className="font-medium">{customer.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng chi tiêu:</span>
                    <span className="font-medium text-green-600">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điểm thưởng:</span>
                    <span className="font-medium text-blue-600">{customer.loyaltyPoints} điểm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView; 