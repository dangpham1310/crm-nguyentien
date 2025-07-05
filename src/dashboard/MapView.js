import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom driver icon
const driverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      <circle cx="12" cy="9" r="2" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Pickup location icon
const pickupIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f59e0b"/>
      <circle cx="12" cy="9" r="4" fill="white"/>
      <rect x="10" y="7" width="4" height="4" rx="1" fill="#f59e0b"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Delivery location icon  
const deliveryLocationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#16a34a"/>
      <circle cx="12" cy="9" r="4" fill="white"/>
      <circle cx="12" cy="9" r="2" fill="#16a34a"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const MapView = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch drivers from API
  const fetchDrivers = async () => {
    try {
      console.log('🔄 Bước 1: Lấy danh sách driver IDs online');
      
      // Step 1: Get online driver IDs
      const onlineResponse = await fetch('http://localhost:8000/api/order/drivers/online');
      
      console.log('📡 Online drivers response status:', onlineResponse.status);
      
      if (!onlineResponse.ok) {
        throw new Error(`HTTP ${onlineResponse.status}: Không thể lấy danh sách tài xế online`);
      }
      
      const contentType = onlineResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await onlineResponse.text();
        console.log('❌ Online drivers API response (not JSON):', textResponse.substring(0, 200) + '...');
        throw new Error('API online drivers không trả về JSON hợp lệ');
      }
      
      const onlineData = await onlineResponse.json();
      console.log('✅ Online drivers data:', onlineData);
      
      // Validate online drivers response
      if (!onlineData || !onlineData.driver_ids || !Array.isArray(onlineData.driver_ids)) {
        throw new Error('Cấu trúc dữ liệu API online drivers không hợp lệ');
      }
      
      // If no drivers online, set empty array
      if (onlineData.driver_ids.length === 0) {
        console.log('ℹ️ Không có tài xế nào online');
        setDrivers([]);
        setError(null);
        return;
      }
      
      console.log('🔄 Bước 2: Lấy thông tin chi tiết tài xế với IDs:', onlineData.driver_ids);
      
      // Step 2: Get detailed driver locations
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
      }

      const bulkResponse = await fetch('http://localhost:8000/api/order/drivers/bulk-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(onlineData.driver_ids)
      });
      
      console.log('📡 Bulk locations response status:', bulkResponse.status);
      
      if (!bulkResponse.ok) {
        throw new Error(`HTTP ${bulkResponse.status}: Không thể lấy vị trí chi tiết tài xế`);
      }
      
      const bulkContentType = bulkResponse.headers.get('content-type');
      if (!bulkContentType || !bulkContentType.includes('application/json')) {
        const textResponse = await bulkResponse.text();
        console.log('❌ Bulk locations API response (not JSON):', textResponse.substring(0, 200) + '...');
        throw new Error('API bulk locations không trả về JSON hợp lệ');
      }
      
      const bulkData = await bulkResponse.json();
      console.log('✅ Bulk locations data:', bulkData);
      
      // Validate bulk response structure
      if (!bulkData || !bulkData.drivers || !Array.isArray(bulkData.drivers)) {
        throw new Error('Cấu trúc dữ liệu API bulk locations không hợp lệ');
      }
      
      // Transform API data to match component structure
      const transformedDrivers = bulkData.drivers.map(driver => ({
        id: driver.driver_id,
        name: driver.driver_info?.full_name || `Tài xế ${driver.driver_id_short}`,
        phone: driver.driver_info?.phone || 'Chưa có SĐT',
        status: driver.status || 'unknown',
        position: [
          driver.current_location?.lat || 10.762622, 
          driver.current_location?.lon || 106.660172
        ],
        lastUpdate: formatLastUpdate(driver.last_update),
        driver_id_short: driver.driver_id_short,
        tripInfo: driver.trip_info ? {
          tripId: driver.trip_info.trip_id_short,
          tripStatus: driver.trip_info.trip_status,
          orderStatus: driver.trip_info.order_status,
          pickupLocation: driver.trip_info.pickup_location,
          deliveryLocation: driver.trip_info.delivery_location,
          orderDetails: driver.trip_info.order_details
        } : null
      }));
      
      console.log('✅ Transformed drivers:', transformedDrivers);
      setDrivers(transformedDrivers);
      setError(null);
    } catch (err) {
      console.error('❌ Lỗi khi tải dữ liệu tài xế:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Không thể kết nối đến server';
      if (err.message.includes('JSON')) {
        errorMessage = 'API endpoint chưa được cấu hình đúng';
      } else if (err.message.includes('HTTP')) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError') {
        errorMessage = 'Không thể kết nối đến server - kiểm tra backend';
      }
      
      setError(errorMessage);
      
      // Use fallback mock data when API fails
      const fallbackDrivers = [
        {
          id: 'mock_1',
          name: 'Tài xế Demo 1',
          phone: '0901234567',
          status: 'active',
          position: [10.762622, 106.660172],
          lastUpdate: '2 phút trước',
          driver_id_short: 'demo001...',
          tripInfo: {
            tripId: 'demo-trip-1',
            tripStatus: 'in_trip',
            orderStatus: 'pickup',
            pickupLocation: {
              lat: 10.774550,
              lon: 106.704510,
              address: '123 Nguyễn Huệ, Q.1, TP.HCM'
            },
            deliveryLocation: {
              lat: 10.786890,
              lon: 106.692340,
              address: '789 Điện Biên Phủ, Q.3, TP.HCM'
            },
            orderDetails: {
              sender_name: 'Demo Sender',
              recipient_name: 'Demo Recipient',
              distance_km: 5.2,
              shipping_fee: 25000
            }
          }
        },
        {
          id: 'mock_2',
          name: 'Tài xế Demo 2',
          phone: '0907654321',
          status: 'active',
          position: [10.804570, 106.717140],
          lastUpdate: '1 phút trước',
          driver_id_short: 'demo002...',
          tripInfo: {
            tripId: 'demo-trip-2',
            tripStatus: 'in_trip',
            orderStatus: 'delivery',
            pickupLocation: {
              lat: 10.790000,
              lon: 106.720000,
              address: '456 Lê Lợi, Q.1, TP.HCM'
            },
            deliveryLocation: {
              lat: 10.820000,
              lon: 106.740000,
              address: '789 Nguyễn Văn Cừ, Q.5, TP.HCM'
            },
            orderDetails: {
              sender_name: 'Demo Sender 2',
              recipient_name: 'Demo Recipient 2',
              distance_km: 3.8,
              shipping_fee: 18000
            }
          }
        }
      ];
      
      setDrivers(fallbackDrivers);
    } finally {
      setLoading(false);
    }
  };

  // Format last update time
  const formatLastUpdate = (lastUpdate) => {
    if (!lastUpdate) return 'Chưa cập nhật';
    
    try {
      const now = new Date();
      const updateTime = new Date(lastUpdate);
      
      // Check if date is valid
      if (isNaN(updateTime.getTime())) {
        return 'Thời gian không hợp lệ';
      }
      
      const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
      
      if (diffMinutes < 1) return 'Vừa xong';
      if (diffMinutes < 60) return `${diffMinutes} phút trước`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ngày trước`;
    } catch (error) {
      return 'Chưa cập nhật';
    }
  };

  // Load drivers data and set up auto-refresh
  useEffect(() => {
    // Load data immediately
    fetchDrivers();

    // Set up interval to refresh every 10 seconds only if no error
    const interval = setInterval(() => {
      // Only fetch if there's no current error, or retry periodically
      if (!error) {
        fetchDrivers();
      }
    }, 10000); // Changed from 15000 to 10000 (10 seconds)

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Remove error dependency to prevent infinite re-renders

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#16a34a'; // green
      case 'busy': return '#dc2626'; // red
      case 'inactive': return '#6b7280'; // gray
      case 'offline': return '#6b7280'; // gray
      case 'unknown': return '#9ca3af'; // light gray
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'busy': return 'Bận';
      case 'inactive': return 'Không hoạt động';
      case 'offline': return 'Ngoại tuyến';
      case 'unknown': return 'Chưa xác định';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu tài xế...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Error notification bar */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Cảnh báo:</strong> {error}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Đang hiển thị dữ liệu demo. 
                <button 
                  onClick={fetchDrivers}
                  className="ml-2 text-yellow-800 underline hover:text-yellow-900"
                >
                  Thử kết nối lại
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1" style={{ height: error ? 'calc(80vh - 80px)' : '80vh' }}>
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[10.762622, 106.660172]} // Ho Chi Minh City center
            zoom={13}
            style={{ height: error ? 'calc(80vh - 80px)' : '80vh', width: '100%' }}
            className="rounded-lg"
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Driver markers */}
            {drivers.map((driver) => (
              <Marker
                key={driver.id}
                position={driver.position}
                icon={driverIcon}
                eventHandlers={{
                  click: () => setSelectedDriver(driver),
                }}
              >
                <Popup className="driver-popup">
                  <div className="p-2 min-w-[250px]">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-white">
                          {driver.name ? driver.name.charAt(0).toUpperCase() : 'T'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{driver.name || 'Tài xế'}</h3>
                        <p className="text-xs text-gray-500">ID: {driver.driver_id_short}</p>
                        <p className="text-xs text-gray-500">📞 {driver.phone}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Trạng thái:</span>
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getStatusColor(driver.status) }}
                        >
                          {getStatusText(driver.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vị trí:</span>
                        <span className="text-xs font-medium">
                          {driver.position[0].toFixed(6)}, {driver.position[1].toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cập nhật:</span>
                        <span className="text-xs text-gray-500">{driver.lastUpdate}</span>
                      </div>
                      
                      {/* Trip Information */}
                      {driver.tripInfo && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <h4 className="font-medium text-gray-900 mb-1">Thông tin chuyến đi</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mã chuyến:</span>
                              <span className="text-xs font-medium">{driver.tripInfo.tripId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Trạng thái đơn:</span>
                              <span className="text-xs font-medium capitalize">{driver.tripInfo.orderStatus}</span>
                            </div>
                            {driver.tripInfo.orderDetails && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Người gửi:</span>
                                  <span className="text-xs">{driver.tripInfo.orderDetails.sender_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Người nhận:</span>
                                  <span className="text-xs">{driver.tripInfo.orderDetails.recipient_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Khoảng cách:</span>
                                  <span className="text-xs">{driver.tripInfo.orderDetails.distance_km}km</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phí ship:</span>
                                  <span className="text-xs">{driver.tripInfo.orderDetails.shipping_fee?.toLocaleString()}đ</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
                
                {/* Status circle around driver */}
                <Circle
                  center={driver.position}
                  radius={300}
                  pathOptions={{
                    color: getStatusColor(driver.status),
                    fillColor: getStatusColor(driver.status),
                    fillOpacity: 0.1,
                    weight: 2,
                  }}
                />
              </Marker>
            ))}

            {/* Pickup location markers */}
            {drivers.filter(driver => driver.tripInfo?.pickupLocation).map((driver) => (
              <Marker
                key={`pickup-${driver.id}`}
                position={[driver.tripInfo.pickupLocation.lat, driver.tripInfo.pickupLocation.lon]}
                icon={pickupIcon}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-orange-600 mb-2">📦 Điểm lấy hàng</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Tài xế:</span>
                        <p className="font-medium">{driver.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Địa chỉ:</span>
                        <p className="text-gray-800">{driver.tripInfo.pickupLocation.address}</p>
                      </div>
                      {driver.tripInfo.orderDetails && (
                        <div>
                          <span className="text-gray-600">Người gửi:</span>
                          <p className="font-medium">{driver.tripInfo.orderDetails.sender_name}</p>
                          <p className="text-xs text-gray-600">{driver.tripInfo.orderDetails.sender_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Delivery location markers */}
            {drivers.filter(driver => driver.tripInfo?.deliveryLocation).map((driver) => (
              <Marker
                key={`delivery-${driver.id}`}
                position={[driver.tripInfo.deliveryLocation.lat, driver.tripInfo.deliveryLocation.lon]}
                icon={deliveryLocationIcon}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-green-600 mb-2">🚚 Điểm giao hàng</h3>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-gray-600">Tài xế:</span>
                        <p className="font-medium">{driver.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Địa chỉ:</span>
                        <p className="text-gray-800">{driver.tripInfo.deliveryLocation.address}</p>
                      </div>
                      {driver.tripInfo.orderDetails && (
                        <div>
                          <span className="text-gray-600">Người nhận:</span>
                          <p className="font-medium">{driver.tripInfo.orderDetails.recipient_name}</p>
                          <p className="text-xs text-gray-600">{driver.tripInfo.orderDetails.recipient_phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Route Lines */}
            {drivers.filter(driver => driver.tripInfo?.pickupLocation && driver.tripInfo?.deliveryLocation).map((driver) => (
              <React.Fragment key={`routes-${driver.id}`}>
                {/* Line from current position to pickup location */}
                <Polyline
                  positions={[
                    driver.position,
                    [driver.tripInfo.pickupLocation.lat, driver.tripInfo.pickupLocation.lon]
                  ]}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '10, 5'
                  }}
                />
                
                {/* Line from pickup to delivery location */}
                <Polyline
                  positions={[
                    [driver.tripInfo.pickupLocation.lat, driver.tripInfo.pickupLocation.lon],
                    [driver.tripInfo.deliveryLocation.lat, driver.tripInfo.deliveryLocation.lon]
                  ]}
                  pathOptions={{
                    color: '#16a34a',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 10'
                  }}
                />
              </React.Fragment>
            ))}
          </MapContainer>

          {/* Map controls */}
          <div className="absolute top-4 right-4 z-10 space-y-2">
            <div className="bg-white rounded-lg shadow-md p-3">
              <h4 className="font-semibold text-gray-900 mb-2">Chú thích</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full mr-2"></div>
                  <span>Tài xế ({drivers.length})</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
                  <span>Điểm lấy hàng</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded-full mr-2"></div>
                  <span>Điểm giao hàng</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-yellow-500 mr-2" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                  <span>Đường đến lấy hàng</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-1 bg-green-600 mr-2" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                  <span>Đường giao hàng</span>
                </div>
              </div>
            </div>
            
            {/* Auto refresh indicator */}
            <div className="bg-white rounded-lg shadow-md p-2">
              <div className="flex items-center text-xs text-gray-600">
                <div className={`w-2 h-2 rounded-full mr-2 ${error ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`}></div>
                <span>{error ? 'Dữ liệu demo' : 'Tự động cập nhật mỗi 10s'}</span>
              </div>
              {error && (
                <button
                  onClick={fetchDrivers}
                  className="mt-2 w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  Kiểm tra API
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách tài xế ({drivers.length})
            </h3>
          </div>
          
          <div className="p-4 space-y-4">
            {drivers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Không có tài xế nào đang online</p>
              </div>
            ) : (
              drivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedDriver?.id === driver.id
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDriver(driver)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-white">
                          {driver.name ? driver.name.charAt(0).toUpperCase() : 'T'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{driver.name || 'Tài xế'}</h4>
                        <p className="text-sm text-gray-500">ID: {driver.driver_id_short}</p>
                        <p className="text-xs text-gray-500">📞 {driver.phone}</p>
                      </div>
                    </div>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(driver.status) }}
                    >
                      {getStatusText(driver.status)}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Cập nhật:</span>
                      <span>{driver.lastUpdate}</span>
                    </div>
                    
                    {/* Trip information in sidebar */}
                    {driver.tripInfo && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-700">Chuyến đi:</span>
                          <span className="text-blue-600">{driver.tripInfo.tripId}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Trạng thái:</span>
                          <span className="capitalize font-medium">{driver.tripInfo.orderStatus}</span>
                        </div>
                        {driver.tripInfo.orderDetails && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span>Khoảng cách:</span>
                              <span>{driver.tripInfo.orderDetails.distance_km}km</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Phí ship:</span>
                              <span>{driver.tripInfo.orderDetails.shipping_fee?.toLocaleString()}đ</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView; 