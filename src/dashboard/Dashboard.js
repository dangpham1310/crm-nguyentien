import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import ContactInfo from './ContactInfo';
import CustomerInfo from './CustomerInfo';
import ProductInfo from './ProductInfo';
import HandoverInfo from './HandoverInfo';
import InvoiceInfo from './InvoiceInfo';
import ReportsView from './ReportsView';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('contact');

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleKeyDown = (e, action) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const menuItems = [
    { id: 'contact', name: 'Thông Tin Liên Hệ', icon: 'phone' },
    { id: 'customer', name: 'Thông Tin Khách Hàng', icon: 'user-group' },
    { id: 'product', name: 'Thông tin sản phẩm', icon: 'cube' },
    { id: 'handover', name: 'Thông tin bàn giao', icon: 'clipboard' },
    { id: 'invoice', name: 'Thông tin hóa đơn', icon: 'document' },
    { id: 'reports', name: 'Báo Cáo', icon: 'bar-chart' },
  ];



  const getIcon = (iconName) => {
    const icons = {
      phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
      'user-group': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      cube: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      'bar-chart': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    };
    return icons[iconName] || icons.phone;
  };



  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:fixed`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-red-600 to-red-700 flex-shrink-0">
            <h1 className="text-xl font-bold text-white">App CRM</h1>
          </div>

          {/* Sidebar Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                onKeyDown={(e) => handleKeyDown(e, () => setActiveTab(item.id))}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-red-50 text-red-700 border-r-4 border-red-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                tabIndex={0}
                aria-label={`Chuyển đến ${item.name}`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {getIcon(item.icon)}
                </svg>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
            
            {/* Additional menu items for demonstration */}


            {/* Sidebar Footer */}
            <div className="mt-auto px-6 py-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user?.fullName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={handleToggleSidebar}
          onKeyDown={(e) => handleKeyDown(e, handleToggleSidebar)}
          tabIndex={0}
          aria-label="Đóng sidebar"
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={handleToggleSidebar}
                  onKeyDown={(e) => handleKeyDown(e, handleToggleSidebar)}
                  tabIndex={0}
                  aria-label="Mở menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h2 className="ml-4 text-2xl font-semibold text-gray-900 capitalize">
                  {menuItems.find(item => item.id === activeTab)?.name || 'Thông Tin Liên Hệ'}
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                {/* Search Bar */}
                <div className="hidden md:block relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Notifications */}
                <button
                  type="button"
                  className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-md"
                  tabIndex={0}
                  aria-label="Thông báo"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-0 right-0 block h-2 w-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </button>

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.fullName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.fullName || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.phone || 'Chưa cập nhật SĐT'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    onKeyDown={(e) => handleKeyDown(e, logout)}
                    className="text-sm text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1 transition-colors"
                    tabIndex={0}
                    aria-label="Đăng xuất"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard content - Scrollable */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'contact' && (
            <div className="animate-slide-up">
              <ContactInfo />
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="animate-slide-up">
              <CustomerInfo />
            </div>
          )}

          {activeTab === 'product' && (
            <div className="animate-slide-up">
              <ProductInfo />
            </div>
          )}

          {activeTab === 'handover' && (
            <div className="animate-slide-up">
              <HandoverInfo />
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="animate-slide-up">
              <InvoiceInfo />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-slide-up">
              <ReportsView />
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard; 