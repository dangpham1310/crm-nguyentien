import React, { useState, useEffect } from 'react';
import settingsService from '../services/settingsService';

const SettingsView = () => {
  // Mock drivers data for counting
  const mockDrivers = [
    { id: 1, name: 'Nguyễn Văn An' },
    { id: 2, name: 'Trần Minh Tú' },
    { id: 3, name: 'Võ Minh Khang' },
    { id: 4, name: 'Lê Văn Bình' },
    { id: 5, name: 'Phạm Thị Hoa' }
  ];

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load settings từ file JSON khi component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const loadedSettings = await settingsService.loadSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Lỗi tải settings:', error);
        showNotification('Lỗi tải cài đặt từ file!', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const showNotification = (message, type = 'success') => {
    if (message && typeof message === 'string') {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const result = await settingsService.saveSettings(settings);
      
      if (result.success) {
        showNotification(result.message, 'success');
      } else {
        showNotification(result.message, 'error');
      }
    } catch (error) {
      console.error('Lỗi lưu cài đặt:', error);
      showNotification('Có lỗi khi lưu cài đặt vào file!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'Chung', icon: '🏢' },
    { id: 'delivery', name: 'Giao hàng', icon: '🚚' },
    { id: 'notifications', name: 'Thông báo', icon: '🔔' },
    { id: 'drivers', name: 'Tài xế', icon: '👥' },
    { id: 'payment', name: 'Thanh toán', icon: '💳' },
    { id: 'api', name: 'API', icon: '🔗' },
    { id: 'security', name: 'Bảo mật', icon: '🔒' }
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Notification */}
      {notification && notification.message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        } transition-all duration-300 animate-bounce-in`}>
          <div className="flex items-center">
            <span className="mr-2">{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">⚙️ Cài đặt hệ thống</h2>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              if (window.confirm('Bạn có chắc muốn reset tất cả cài đặt về mặc định?')) {
                try {
                  setLoading(true);
                  const result = await settingsService.resetSettings();
                  if (result.success) {
                    const defaultSettings = await settingsService.loadSettings();
                    setSettings(defaultSettings);
                    showNotification('✅ Đã reset cài đặt về mặc định!', 'success');
                  }
                } catch (error) {
                  showNotification('❌ Lỗi reset cài đặt!', 'error');
                } finally {
                  setLoading(false);
                }
              }
            }}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            🔄 Reset mặc định
          </button>
        <button
          onClick={handleSaveSettings}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center"
        >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu...
              </>
            ) : (
              '💾 Lưu cài đặt'
            )}
        </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Thông tin công ty</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên công ty
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={settings.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delivery Settings */}
          {activeTab === 'delivery' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cài đặt giao hàng</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bán kính giao hàng (km)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultDeliveryRadius}
                      onChange={(e) => handleInputChange('defaultDeliveryRadius', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian giao tối đa (phút)
                    </label>
                    <input
                      type="number"
                      value={settings.maxDeliveryTime}
                      onChange={(e) => handleInputChange('maxDeliveryTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phí giao hàng cố định (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={settings.deliveryFee}
                      onChange={(e) => handleInputChange('deliveryFee', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={settings.useCustomFormula}
                    />
                    {settings.useCustomFormula && (
                      <p className="text-xs text-gray-500 mt-1">Đang sử dụng công thức tính giá tự động</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Miễn phí giao từ (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) => handleInputChange('freeDeliveryThreshold', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Formula Section */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">🧮 Công thức tính giá</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.useCustomFormula}
                      onChange={(e) => handleInputChange('useCustomFormula', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">Sử dụng công thức tùy chỉnh</span>
                  </label>
                </div>

                {settings.useCustomFormula && (
                  <div className="space-y-6">
                    {/* Formula Description */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Công thức hiện tại:</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Nếu quãng đường ≤ {settings.distanceThreshold} km:</strong></p>
                        <p className="ml-4 font-mono bg-blue-100 px-2 py-1 rounded">
                          Giá = {settings.baseFee.toLocaleString('vi-VN')} + (Km × {settings.pricePerKmUnder2.toLocaleString('vi-VN')})
                        </p>
                        <p className="mt-2"><strong>Nếu quãng đường > {settings.distanceThreshold} km:</strong></p>
                        <p className="ml-4 font-mono bg-blue-100 px-2 py-1 rounded">
                          Giá = {settings.baseFee.toLocaleString('vi-VN')} + ({settings.distanceThreshold} × {settings.pricePerKmUnder2.toLocaleString('vi-VN')}) + ((Km - {settings.distanceThreshold}) × {settings.pricePerKmOver2.toLocaleString('vi-VN')})
                        </p>
                      </div>
                    </div>

                    {/* Formula Parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phí cơ bản (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={settings.baseFee}
                          onChange={(e) => handleInputChange('baseFee', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="10000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ngưỡng khoảng cách (km)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={settings.distanceThreshold}
                          onChange={(e) => handleInputChange('distanceThreshold', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá/km (≤ {settings.distanceThreshold}km) (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={settings.pricePerKmUnder2}
                          onChange={(e) => handleInputChange('pricePerKmUnder2', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="4000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Giá/km (> {settings.distanceThreshold}km) (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={settings.pricePerKmOver2}
                          onChange={(e) => handleInputChange('pricePerKmOver2', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          placeholder="3500"
                        />
                      </div>
                    </div>

                    {/* Price Calculator Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">🧮 Tính toán mẫu:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {[1, 2.5, 5].map((distance) => {
                          const calculatePrice = (km) => {
                            if (km <= settings.distanceThreshold) {
                              return settings.baseFee + (km * settings.pricePerKmUnder2);
                            } else {
                              return settings.baseFee + (settings.distanceThreshold * settings.pricePerKmUnder2) + ((km - settings.distanceThreshold) * settings.pricePerKmOver2);
                            }
                          };
                          
                          const price = calculatePrice(distance);
                          
                          return (
                            <div key={distance} className="bg-white p-3 rounded border">
                              <div className="font-medium text-gray-900">{distance} km</div>
                              <div className="text-red-600 font-semibold">{price.toLocaleString('vi-VN')} VNĐ</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Excel Formula */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-900 mb-2">📊 Công thức Excel:</h4>
                      <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded block">
                        =IF(A2&lt;={settings.distanceThreshold}, {settings.baseFee} + (A2*{settings.pricePerKmUnder2}), {settings.baseFee} + ({settings.distanceThreshold}*{settings.pricePerKmUnder2}) + ((A2-{settings.distanceThreshold})*{settings.pricePerKmOver2}))
                      </code>
                      <p className="text-xs text-green-600 mt-2">Trong đó A2 là ô chứa khoảng cách (km)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cài đặt thông báo</h3>
                
                <div className="space-y-4 mt-6">
                  {[
                    { key: 'emailNotifications', label: 'Thông báo qua Email', icon: '📧' },
                    { key: 'smsNotifications', label: 'Thông báo qua SMS', icon: '📱' },
                    { key: 'pushNotifications', label: 'Thông báo đẩy', icon: '🔔' },
                    { key: 'orderStatusUpdates', label: 'Cập nhật trạng thái đơn hàng', icon: '📦' }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings[item.key]}
                          onChange={(e) => handleInputChange(item.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broadcast Message Section */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">📢 Gửi thông báo cho tài xế</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiêu đề thông báo
                      </label>
                      <input
                        type="text"
                        value={settings.broadcastTitle || ''}
                        onChange={(e) => handleInputChange('broadcastTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Nhập tiêu đề thông báo..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung thông báo
                      </label>
                      <textarea
                        value={settings.broadcastMessage || ''}
                        onChange={(e) => handleInputChange('broadcastMessage', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        placeholder="Nhập nội dung thông báo cho tất cả tài xế...

Ví dụ:
- Thông báo về chính sách mới
- Hướng dẫn an toàn giao thông
- Thông tin khuyến mãi
- Lịch nghỉ lễ
- Cập nhật ứng dụng"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          {settings.broadcastMessage?.length || 0}/500 ký tự
                        </p>
                        <p className="text-xs text-gray-500">
                          Thông báo sẽ được gửi cho tất cả {mockDrivers.length} tài xế
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loại thông báo
                        </label>
                        <select
                          value={settings.broadcastType || 'info'}
                          onChange={(e) => handleInputChange('broadcastType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="info">📢 Thông tin chung</option>
                          <option value="urgent">🚨 Khẩn cấp</option>
                          <option value="promotion">🎉 Khuyến mãi</option>
                          <option value="warning">⚠️ Cảnh báo</option>
                          <option value="maintenance">🔧 Bảo trì</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phương thức gửi
                        </label>
                        <select
                          value={settings.broadcastMethod || 'all'}
                          onChange={(e) => handleInputChange('broadcastMethod', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                          <option value="all">📱 Tất cả (App + SMS)</option>
                          <option value="app">📲 Chỉ qua App</option>
                          <option value="sms">💬 Chỉ qua SMS</option>
                          <option value="email">📧 Chỉ qua Email</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.broadcastSchedule || false}
                          onChange={(e) => handleInputChange('broadcastSchedule', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Lên lịch gửi</span>
                      </label>
                      
                      {settings.broadcastSchedule && (
                        <input
                          type="datetime-local"
                          value={settings.broadcastTime || ''}
                          onChange={(e) => handleInputChange('broadcastTime', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        />
                      )}
                    </div>

                    {/* Preview */}
                    {(settings.broadcastTitle || settings.broadcastMessage) && (
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">👀 Xem trước thông báo:</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {settings.broadcastType === 'urgent' && <span className="text-red-500">🚨</span>}
                              {settings.broadcastType === 'info' && <span className="text-blue-500">📢</span>}
                              {settings.broadcastType === 'promotion' && <span className="text-green-500">🎉</span>}
                              {settings.broadcastType === 'warning' && <span className="text-yellow-500">⚠️</span>}
                              {settings.broadcastType === 'maintenance' && <span className="text-gray-500">🔧</span>}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 text-sm">
                                {settings.broadcastTitle || 'Tiêu đề thông báo'}
                              </h5>
                              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                {settings.broadcastMessage || 'Nội dung thông báo...'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                Gửi qua: {
                                  settings.broadcastMethod === 'all' ? 'App + SMS + Email' :
                                  settings.broadcastMethod === 'app' ? 'Ứng dụng' :
                                  settings.broadcastMethod === 'sms' ? 'SMS' : 'Email'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Send Button */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange('broadcastTitle', '');
                          handleInputChange('broadcastMessage', '');
                          handleInputChange('broadcastType', 'info');
                          handleInputChange('broadcastMethod', 'all');
                          handleInputChange('broadcastSchedule', false);
                          handleInputChange('broadcastTime', '');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        🗑️ Xóa nội dung
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!settings.broadcastTitle || !settings.broadcastMessage) {
                            showNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo', 'error');
                            return;
                          }
                          
                          const scheduleText = settings.broadcastSchedule ? 
                            ` và đã lên lịch gửi vào ${new Date(settings.broadcastTime).toLocaleString('vi-VN')}` : 
                            '';
                          
                          showNotification(
                            `✅ Đã gửi thông báo "${settings.broadcastTitle}" cho ${mockDrivers.length} tài xế${scheduleText}`, 
                            'success'
                          );
                          
                          // Reset form after sending
                          setTimeout(() => {
                            handleInputChange('broadcastTitle', '');
                            handleInputChange('broadcastMessage', '');
                            handleInputChange('broadcastType', 'info');
                            handleInputChange('broadcastMethod', 'all');
                            handleInputChange('broadcastSchedule', false);
                            handleInputChange('broadcastTime', '');
                          }, 1000);
                        }}
                        disabled={!settings.broadcastTitle || !settings.broadcastMessage}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {settings.broadcastSchedule ? '⏰ Lên lịch gửi' : '📤 Gửi ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Drivers Settings */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cài đặt tài xế</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số đơn tối đa/tài xế
                  </label>
                  <input
                    type="number"
                    value={settings.maxOrdersPerDriver}
                    onChange={(e) => handleInputChange('maxOrdersPerDriver', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout phản hồi (giây)
                  </label>
                  <input
                    type="number"
                    value={settings.driverResponseTimeout}
                    onChange={(e) => handleInputChange('driverResponseTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'autoAssignOrders', label: 'Tự động phân công đơn hàng', icon: '🤖' },
                  { key: 'requireDriverPhoto', label: 'Yêu cầu ảnh xác nhận', icon: '📸' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) => handleInputChange(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cài đặt thanh toán</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'acceptCash', label: 'Chấp nhận tiền mặt', icon: '💵' },
                  { key: 'acceptCard', label: 'Chấp nhận thẻ tín dụng', icon: '💳' },
                  { key: 'acceptEWallet', label: 'Chấp nhận ví điện tử', icon: '📱' },
                  { key: 'autoCalculateFee', label: 'Tự động tính phí', icon: '🧮' }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="mr-3 text-lg">{item.icon}</span>
                      <span className="font-medium text-gray-900">{item.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) => handleInputChange(item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cài đặt API</h3>
              
              {/* Goong Maps API */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-lg">🗺️</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Goong Maps API</h4>
                      <p className="text-sm text-gray-600">API để tìm kiếm địa chỉ và định vị</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.goongApiEnabled}
                      onChange={(e) => handleInputChange('goongApiEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                                         <div className="relative">
                       <input
                         type={showApiKey ? "text" : "password"}
                         value={settings.goongApiKey}
                         onChange={(e) => handleInputChange('goongApiKey', e.target.value)}
                         placeholder="Nhập Goong API Key..."
                         className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         disabled={!settings.goongApiEnabled}
                       />
                       <button
                         type="button"
                         onClick={(e) => {
                           e.preventDefault();
                           setShowApiKey(!showApiKey);
                         }}
                         className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                       >
                         {showApiKey ? '🙈' : '👁️'}
                       </button>
                     </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Lấy API key tại: <a href="https://docs.goong.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://docs.goong.io/</a>
                    </p>
                  </div>

                  {/* API Usage Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Quota hàng tháng</span>
                        <span className="text-lg font-bold text-blue-600">{settings.goongApiQuota.toLocaleString()}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Đã sử dụng: {settings.goongApiUsed}</span>
                          <span>{Math.round((settings.goongApiUsed / settings.goongApiQuota) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((settings.goongApiUsed / settings.goongApiQuota) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Còn lại</span>
                        <span className="text-lg font-bold text-green-600">
                          {(settings.goongApiQuota - settings.goongApiUsed).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="text-xs text-gray-500">
                          Ước tính còn lại: {Math.floor((settings.goongApiQuota - settings.goongApiUsed) / 30)} ngày
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test API Button */}
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!settings.goongApiKey || settings.goongApiKey === 'your-goong-api-key-here') {
                          showNotification('Vui lòng nhập API key hợp lệ', 'error');
                          return;
                        }
                        showNotification('✅ Kết nối API thành công!', 'success');
                      }}
                      disabled={!settings.goongApiEnabled}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      🔍 Test kết nối
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showNotification('✅ Đã làm mới thống kê API', 'success');
                        // Simulate refreshing stats
                        handleInputChange('goongApiUsed', Math.floor(Math.random() * 500) + 200);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      🔄 Làm mới thống kê
                    </button>
                  </div>
                </div>
              </div>

              {/* Future API Integrations */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Tích hợp API khác</h4>
                
                <div className="space-y-4">
                  {[
                    { 
                      name: 'Google Maps API', 
                      icon: '🌍', 
                      description: 'Dự phòng cho định vị và tìm đường',
                      status: 'coming-soon'
                    },
                    { 
                      name: 'ViettelPost API', 
                      icon: '📮', 
                      description: 'Tích hợp với dịch vụ bưu chính',
                      status: 'coming-soon'
                    },
                    { 
                      name: 'Zalo API', 
                      icon: '💬', 
                      description: 'Gửi thông báo qua Zalo',
                      status: 'coming-soon'
                    },
                    { 
                      name: 'Banking API', 
                      icon: '🏦', 
                      description: 'Thanh toán trực tuyến',
                      status: 'coming-soon'
                    }
                  ].map((api, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-lg">{api.icon}</span>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{api.name}</h5>
                          <p className="text-sm text-gray-600">{api.description}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🚧 Sắp có
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* API Guidelines */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 text-xl">💡</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-800 mb-2">
                      Lưu ý quan trọng về API
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                      <li>Bảo mật API key của bạn, không chia sẻ với người khác</li>
                      <li>Theo dõi usage để tránh vượt quota</li>
                      <li>API key sẽ được mã hóa khi lưu trữ</li>
                      <li>Liên hệ admin nếu cần tăng quota hoặc gặp vấn đề</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cài đặt bảo mật</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout phiên (phút)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hết hạn mật khẩu (ngày)
                  </label>
                  <input
                    type="number"
                    value={settings.passwordExpiry}
                    onChange={(e) => handleInputChange('passwordExpiry', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số lần đăng nhập sai tối đa
                  </label>
                  <input
                    type="number"
                    value={settings.loginAttempts}
                    onChange={(e) => handleInputChange('loginAttempts', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">🔐</span>
                    <span className="font-medium text-gray-900">Xác thực 2 yếu tố</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireTwoFactor}
                      onChange={(e) => handleInputChange('requireTwoFactor', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView; 