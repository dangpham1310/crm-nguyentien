import React, { useState, useEffect, useRef, useCallback } from 'react';
import settingsService from '../services/settingsService';

const OrdersView = () => {
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    receiverName: '',
    receiverPhone: '',
    pickupAddress: '',
    address: '',
    notes: '',
    enableCOD: false,
    codAmount: 0
  });
  
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDriver, setSearchingDriver] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [assigningOrder, setAssigningOrder] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [driverResponseTimeout, setDriverResponseTimeout] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // API Orders State
  const [apiOrders, setApiOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStats, setOrderStats] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(15);
  const [totalOrders, setTotalOrders] = useState(0);
  
  const [orders, setOrders] = useState([]);
  const [distance, setDistance] = useState(null);
  const [deliveryPrice, setDeliveryPrice] = useState(null);
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  
  const addressInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const pickupInputRef = useRef(null);
  const pickupSuggestionsRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const pickupSearchTimeoutRef = useRef(null);

  // Fetch orders from API
  const fetchOrdersFromAPI = useCallback(async (showSuccessNotification = true, isBackground = false) => {
    if (isBackground) {
      setBackgroundLoading(true);
    } else {
      setLoadingOrders(true);
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/api/order/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Orders Response:', data);
        
        // Sắp xếp orders theo created_at mới nhất
        const sortedOrders = data.orders.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        // Smooth update với transition
        setApiOrders(prevOrders => {
          // Kiểm tra nếu có thay đổi thực sự
          if (JSON.stringify(prevOrders) !== JSON.stringify(sortedOrders)) {
            console.log('🔄 Cập nhật danh sách đơn hàng (có thay đổi)');
            return sortedOrders;
          }
          return prevOrders; // Không thay đổi state nếu data giống hệt
        });
        
        setTotalOrders(data.total_count);
        setOrderStats(data.status_summary);
        setLastFetchTime(new Date());
        
        if (showSuccessNotification) {
          showNotification(`✅ Đã tải ${data.total_count} đơn hàng từ database`, 'success');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Lỗi fetch orders:', error);
      if (showSuccessNotification) { // Chỉ hiển thị lỗi khi manual fetch
        showNotification(`Lỗi tải đơn hàng: ${error.message}`, 'error');
      }
    } finally {
      if (isBackground) {
        setBackgroundLoading(false);
      } else {
        setLoadingOrders(false);
      }
    }
  }, []);

  // WebSocket connection cho real-time updates
  const setupWebSocket = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return null;

    try {
      // Thử kết nối WebSocket (nếu backend support)
      const ws = new WebSocket(`ws://localhost:8000/ws/orders?token=${token}`);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Received WebSocket update:', data);
          
          if (data.type === 'order_update') {
            // Cập nhật real-time cho đơn hàng cụ thể
            setApiOrders(prevOrders => 
              prevOrders.map(order => 
                order.id === data.order.id 
                  ? { 
                      ...order, 
                      ...data.order, 
                      updated_at: new Date().toISOString(),
                      isUpdated: true // Flag để trigger animation
                    }
                  : order
              )
            );
            
            // Reset update flag sau 2 giây
            setTimeout(() => {
              setApiOrders(prevOrders => 
                prevOrders.map(order => ({ ...order, isUpdated: false }))
              );
            }, 2000);
          } else if (data.type === 'new_order') {
            // Thêm đơn hàng mới
            setApiOrders(prevOrders => [data.order, ...prevOrders]);
            setTotalOrders(prev => prev + 1);
          }
        } catch (error) {
          console.error('❌ Lỗi parse WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };
      
      return ws;
    } catch (error) {
      console.error('❌ Không thể kết nối WebSocket:', error);
      return null;
    }
  }, []);

  // Load orders when component mounts và setup real-time updates
  useEffect(() => {
    fetchOrdersFromAPI();
    
    // Thử setup WebSocket trước
    const ws = setupWebSocket();
    
    // Fallback: Background fetch mỗi 30 giây (thay vì 10 giây)
    const intervalId = setInterval(() => {
      if (!isConnected) { // Chỉ fetch khi không có WebSocket
        console.log('🔄 Background fetching orders...');
        fetchOrdersFromAPI(false, true); // Background mode
      }
    }, 30000); // 30 giây để ít annoying hơn
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      if (ws) {
        ws.close();
      }
    };
  }, [fetchOrdersFromAPI, setupWebSocket, isConnected]);

  // Pagination calculations
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = apiOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(apiOrders.length / ordersPerPage);

  // Change page
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Hiển thị thông báo
  const showNotification = (message, type = 'info', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, duration);
  };

  // Load cài đặt tính giá từ file JSON
  const [pricingSettings, setPricingSettings] = useState({
    baseFee: 10000,
    distanceThreshold: 2,
    pricePerKmUnder2: 4000,
    pricePerKmOver2: 3500,
    useCustomFormula: true
  });

  // Load pricing settings từ file JSON khi component mount
  useEffect(() => {
    const loadPricingSettings = async () => {
      try {
        const settings = await settingsService.getPricingSettings();
        setPricingSettings(settings);
        console.log('📊 Đã load pricing settings từ file:', settings);
      } catch (error) {
        console.error('❌ Lỗi load pricing settings:', error);
      }
    };

    loadPricingSettings();
  }, []);

  // Hàm tính giá theo công thức
  const calculateDeliveryPrice = (distanceKm) => {
    if (!pricingSettings.useCustomFormula) {
      return 25000; // Giá cố định
    }

    if (distanceKm <= pricingSettings.distanceThreshold) {
      return pricingSettings.baseFee + (distanceKm * pricingSettings.pricePerKmUnder2);
    } else {
      return pricingSettings.baseFee + 
             (pricingSettings.distanceThreshold * pricingSettings.pricePerKmUnder2) + 
             ((distanceKm - pricingSettings.distanceThreshold) * pricingSettings.pricePerKmOver2);
    }
  };

  // Mock địa chỉ Việt Nam cho autocomplete (TP.HCM và Hà Nội)
  const vietnamAddresses = [
    // TP. Hồ Chí Minh
    '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    '456 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh', 
    '789 Điện Biên Phủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    '321 Võ Văn Tần, Phường 6, Quận 3, TP. Hồ Chí Minh',
    '654 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
    '987 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    '147 Pasteur, Phường 6, Quận 3, TP. Hồ Chí Minh',
    '258 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    '369 Trần Hưng Đạo, Phường Cầu Kho, Quận 1, TP. Hồ Chí Minh',
    '159 Nguyễn Văn Cừ, Phường 3, Quận 5, TP. Hồ Chí Minh',
    '753 Lý Thái Tổ, Phường 9, Quận 10, TP. Hồ Chí Minh',
    '207 Độc Lập, Phường Tân Thành, Quận Tân Phú, TP. Hồ Chí Minh',
    
    // Hà Nội
    '36 Hoàn Kiếm, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội',
    '54 Nguyễn Du, Phường Nguyễn Du, Quận Hai Bà Trưng, Hà Nội',
    '88 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
    '123 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    '456 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội',
    '789 Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội',
    '321 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
    '654 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội'
  ];

  // Mock tài xế có sẵn (sắp xếp theo khoảng cách từ gần đến xa)
  const mockDrivers = [
    {
      id: 3,
      name: 'Võ Minh Khang',
      phone: '0945123789',
      vehicle: 'Honda Winner',
      rating: 4.9,
      distance: 0.8,
      estimatedTime: '5 phút',
      status: 'available',
      currentOrders: 0
    },
    {
      id: 1,
      name: 'Nguyễn Văn An',
      phone: '0901234567',
      vehicle: 'Honda Wave',
      rating: 4.8,
      distance: 1.2,
      estimatedTime: '8 phút',
      status: 'available',
      currentOrders: 1
    },
    {
      id: 2,
      name: 'Trần Minh Tú', 
      phone: '0907654321',
      vehicle: 'Yamaha Exciter',
      rating: 4.9,
      distance: 2.1,
      estimatedTime: '12 phút',
      status: 'available',
      currentOrders: 0
    },
    {
      id: 4,
      name: 'Lê Văn Bình',
      phone: '0912345678',
      vehicle: 'Honda Lead',
      rating: 4.7,
      distance: 2.5,
      estimatedTime: '15 phút',
      status: 'available',
      currentOrders: 2
    },
    {
      id: 5,
      name: 'Phạm Thị Hoa',
      phone: '0987654321',
      vehicle: 'Yamaha Sirius',
      rating: 4.6,
      distance: 3.2,
      estimatedTime: '18 phút',
      status: 'available',
      currentOrders: 1
    }
  ];

  // API tìm kiếm địa chỉ thực tế với Goong Maps
  const searchAddressAPI = useCallback(async (query) => {
    if (!query || query.length < 2) return [];
    
    try {
      // Sử dụng Goong Maps API
      const GOONG_API_KEY = process.env.REACT_APP_GOONG_API_KEY || '1lFpdLwtqDptWEatprlXxKKd9MrmZoOqZ48ZizOz';
      
      const response = await fetch(
        `https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(query)}&limit=8&location=10.762622,106.660172&radius=50000`
      );
      
      if (!response.ok) {
        throw new Error('Goong API request failed');
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
        return data.predictions.map(prediction => ({
          display_name: prediction.description,
          place_id: prediction.place_id,
          structured_formatting: prediction.structured_formatting,
          lat: null,
          lon: null
        }));
      }
      
      // Nếu không có kết quả từ API, fallback về mock data
      throw new Error('No results from Goong API');
      
    } catch (error) {
      console.error('Lỗi tìm kiếm địa chỉ Goong:', error);
      
      // Fallback về mock data với dữ liệu thực tế
      const mockGoongData = [
        // TP.HCM
        '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
        '456 Lê Lợi, Phường Bến Thành, Quận 1, Thành phố Hồ Chí Minh',
        '789 Điện Biên Phủ, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
        '207 Độc Lập, Phường Tân Thành, Quận Tân Phú, Thành phố Hồ Chí Minh',
        '321 Võ Văn Tần, Phường 6, Quận 3, Thành phố Hồ Chí Minh',
        '654 Cộng Hòa, Phường 13, Quận Tân Bình, Thành phố Hồ Chí Minh',
        '987 Nguyễn Thị Minh Khai, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
        '147 Pasteur, Phường 6, Quận 3, Thành phố Hồ Chí Minh',
        '258 Hai Bà Trưng, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
        '369 Trần Hưng Đạo, Phường Cầu Kho, Quận 1, Thành phố Hồ Chí Minh',
        '159 Nguyễn Văn Cừ, Phường 3, Quận 5, Thành phố Hồ Chí Minh',
        '753 Lý Thái Tổ, Phường 9, Quận 10, Thành phố Hồ Chí Minh',
        '101 Trần Phú, Phường 4, Quận 5, Thành phố Hồ Chí Minh',
        '555 Sư Vạn Hạnh, Phường 12, Quận 10, Thành phố Hồ Chí Minh',
        '888 Cách Mạng Tháng 8, Phường 5, Quận 3, Thành phố Hồ Chí Minh',
        '777 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, Thành phố Hồ Chí Minh',
        '999 Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, Thành phố Hồ Chí Minh',
        '111 Nguyễn Du, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
        '222 Đinh Tiên Hoàng, Phường 1, Quận Bình Thạnh, Thành phố Hồ Chí Minh',
        '333 Xô Viết Nghệ Tĩnh, Phường 17, Quận Bình Thạnh, Thành phố Hồ Chí Minh',
        
        // Hà Nội
        '36 Hoàn Kiếm, Phường Hàng Trống, Quận Hoàn Kiếm, Hà Nội',
        '54 Nguyễn Du, Phường Nguyễn Du, Quận Hai Bà Trưng, Hà Nội',
        '88 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội',
        '123 Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
        '456 Đại Cồ Việt, Phường Bách Khoa, Quận Hai Bà Trưng, Hà Nội',
        '789 Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội',
        '321 Thái Hà, Phường Trung Liệt, Quận Đống Đa, Hà Nội',
        '654 Kim Mã, Phường Kim Mã, Quận Ba Đình, Hà Nội',
        '207 Đội Cấn, Phường Đội Cấn, Quận Ba Đình, Hà Nội',
        '999 Trần Duy Hưng, Phường Trung Hòa, Quận Cầu Giấy, Hà Nội',
        '555 Nguyễn Chí Thanh, Phường Láng Thượng, Quận Đống Đa, Hà Nội',
        '777 Tô Hiệu, Phường Nghĩa Đô, Quận Cầu Giấy, Hà Nội'
      ];

      // Tìm kiếm trong mock data
      const filtered = mockGoongData.filter(addr =>
        addr.toLowerCase().includes(query.toLowerCase())
      );

      // Format giống Goong API response
      return filtered.slice(0, 8).map((addr, index) => ({
        display_name: addr,
        place_id: `mock_${index}_${Date.now()}`,
        structured_formatting: {
          main_text: addr.split(',')[0] + ',' + addr.split(',')[1],
          secondary_text: addr.split(',').slice(2).join(',')
        },
        lat: null,
        lon: null
      }));
    }
  }, []);

  // API tính khoảng cách với Goong Maps
  const calculateDistanceAPI = useCallback(async (pickupAddress, deliveryAddress) => {
    if (!pickupAddress || !deliveryAddress) return null;
    
    try {
      const GOONG_API_KEY = process.env.REACT_APP_GOONG_API_KEY || '1lFpdLwtqDptWEatprlXxKKd9MrmZoOqZ48ZizOz';
      
      // Bước 1: Lấy tọa độ của địa chỉ lấy hàng
      const pickupGeocode = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(pickupAddress)}&api_key=${GOONG_API_KEY}`
      );
      const pickupData = await pickupGeocode.json();
      
      // Bước 2: Lấy tọa độ của địa chỉ giao hàng  
      const deliveryGeocode = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(deliveryAddress)}&api_key=${GOONG_API_KEY}`
      );
      const deliveryData = await deliveryGeocode.json();
      
      if (pickupData.results?.length > 0 && deliveryData.results?.length > 0) {
        const pickupLocation = pickupData.results[0].geometry.location;
        const deliveryLocation = deliveryData.results[0].geometry.location;
        
        // Bước 3: Tính khoảng cách và thời gian
        const distanceMatrix = await fetch(
          `https://rsapi.goong.io/DistanceMatrix?origins=${pickupLocation.lat},${pickupLocation.lng}&destinations=${deliveryLocation.lat},${deliveryLocation.lng}&vehicle=bike&api_key=${GOONG_API_KEY}`
        );
        const distanceData = await distanceMatrix.json();
        
        if (distanceData.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = distanceData.rows[0].elements[0];
          return {
            distance: element.distance.value / 1000, // Convert to km
            duration: element.duration.value / 60,   // Convert to minutes
            distanceText: element.distance.text,
            durationText: element.duration.text
          };
        }
      }
      
      // Fallback: Tính khoảng cách đường chim bay
      throw new Error('No route found, using fallback calculation');
      
    } catch (error) {
      console.error('Lỗi tính khoảng cách Goong:', error);
      
      // Fallback: Tính khoảng cách ước lượng dựa trên từ khóa
      const pickupLower = pickupAddress.toLowerCase();
      const deliveryLower = deliveryAddress.toLowerCase();
      
      // Simple heuristic based on districts
      let estimatedDistance = 5; // Default 5km
      
      if (pickupLower.includes('quận 1') && deliveryLower.includes('quận 1')) {
        estimatedDistance = 2;
      } else if (pickupLower.includes('tp.') && deliveryLower.includes('tp.')) {
        estimatedDistance = 8;
      } else if (pickupLower.includes('hà nội') && deliveryLower.includes('hà nội')) {
        estimatedDistance = 12;
      } else if (
        (pickupLower.includes('hcm') || pickupLower.includes('hồ chí minh')) && 
        (deliveryLower.includes('hcm') || deliveryLower.includes('hồ chí minh'))
      ) {
        estimatedDistance = 15;
      } else {
        estimatedDistance = 25; // Inter-city
      }
      
      return {
        distance: estimatedDistance,
        duration: estimatedDistance * 3, // Estimate 3 minutes per km
        distanceText: `${estimatedDistance} km`,
        durationText: `${estimatedDistance * 3} phút`,
        isEstimate: true
      };
    }
  }, []);

  // Debounced search for delivery address
  const debouncedAddressSearch = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      if (query.length >= 2) {
        setSearchingAddress(true);
        try {
          const results = await searchAddressAPI(query);
          setAddressSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch (error) {
          console.error('Lỗi tìm kiếm:', error);
        } finally {
          setSearchingAddress(false);
        }
      } else if (query.length === 0) {
        // Hiển thị gợi ý mặc định
        setAddressSuggestions(vietnamAddresses.slice(0, 8).map(addr => ({ display_name: addr })));
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 1000); // Chờ 1 giây sau khi ngừng gõ mới gọi Goong API
  }, [searchAddressAPI]);

  // Debounced search for pickup address
  const debouncedPickupSearch = useCallback((query) => {
    if (pickupSearchTimeoutRef.current) {
      clearTimeout(pickupSearchTimeoutRef.current);
    }

    pickupSearchTimeoutRef.current = setTimeout(async () => {
      if (query.length >= 2) {
        setSearchingPickup(true);
        try {
          const results = await searchAddressAPI(query);
          setPickupSuggestions(results);
          setShowPickupSuggestions(results.length > 0);
        } catch (error) {
          console.error('Lỗi tìm kiếm:', error);
        } finally {
          setSearchingPickup(false);
        }
      } else if (query.length === 0) {
        // Hiển thị gợi ý mặc định
        setPickupSuggestions(vietnamAddresses.slice(0, 8).map(addr => ({ display_name: addr })));
        setShowPickupSuggestions(true);
      } else {
        setShowPickupSuggestions(false);
      }
    }, 1000); // Chờ 1 giây sau khi ngừng gõ mới gọi Goong API
  }, [searchAddressAPI]);

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setOrderForm({ ...orderForm, address: value });
    
    // Sử dụng debounced search với API
    debouncedAddressSearch(value);
    
    // Reset distance nếu địa chỉ thay đổi
    if (distance) {
      setDistance(null);
      setDeliveryPrice(null);
    }
  };

  const handleAddressFocus = () => {
    if (orderForm.address.length === 0) {
      setAddressSuggestions(vietnamAddresses.slice(0, 8).map(addr => ({ display_name: addr })));
      setShowSuggestions(true);
    } else if (orderForm.address.length >= 2) {
      debouncedAddressSearch(orderForm.address);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const addressText = typeof suggestion === 'string' ? suggestion : suggestion.display_name;
    setOrderForm({ ...orderForm, address: addressText });
    setShowSuggestions(false);
    
    // Tính khoảng cách nếu đã có địa chỉ lấy hàng
    if (orderForm.pickupAddress) {
      calculateDistance(orderForm.pickupAddress, addressText);
    }
  };

  const handlePickupChange = (e) => {
    const value = e.target.value;
    setOrderForm({ ...orderForm, pickupAddress: value });
    
    // Sử dụng debounced search với API
    debouncedPickupSearch(value);
    
    // Reset distance nếu địa chỉ thay đổi
    if (distance) {
      setDistance(null);
      setDeliveryPrice(null);
    }
  };

  const handlePickupFocus = () => {
    if (orderForm.pickupAddress.length === 0) {
      setPickupSuggestions(vietnamAddresses.slice(0, 8).map(addr => ({ display_name: addr })));
      setShowPickupSuggestions(true);
    } else if (orderForm.pickupAddress.length >= 2) {
      debouncedPickupSearch(orderForm.pickupAddress);
    }
  };

  const handlePickupSuggestionClick = (suggestion) => {
    const addressText = typeof suggestion === 'string' ? suggestion : suggestion.display_name;
    setOrderForm({ ...orderForm, pickupAddress: addressText });
    setShowPickupSuggestions(false);
    
    // Tính khoảng cách nếu đã có địa chỉ giao hàng
    if (orderForm.address) {
      calculateDistance(addressText, orderForm.address);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm({ ...orderForm, [name]: value });
  };

  // Hàm tính khoảng cách và giá tiền
  const calculateDistance = async (pickupAddr, deliveryAddr) => {
    if (!pickupAddr || !deliveryAddr) {
      setDistance(null);
      setDeliveryPrice(null);
      return;
    }

    setCalculatingDistance(true);
    try {
      const result = await calculateDistanceAPI(pickupAddr, deliveryAddr);
      if (result) {
        setDistance(result);
        
        // Tính giá theo công thức
        const price = calculateDeliveryPrice(result.distance);
        setDeliveryPrice(price);
        
        console.log('Distance calculation result:', result);
        console.log('Calculated price:', price);
      }
    } catch (error) {
      console.error('Error calculating distance:', error);
      showNotification('Không thể tính khoảng cách. Vui lòng thử lại.', 'warning');
    } finally {
      setCalculatingDistance(false);
    }
  };

  const handleCreateOrder = async () => {
    // Validate form
    if (!orderForm.customerName || !orderForm.phone || !orderForm.receiverName || !orderForm.receiverPhone || !orderForm.pickupAddress || !orderForm.address) {
      showNotification('Vui lòng điền đầy đủ tất cả thông tin bắt buộc', 'warning');
      return;
    }

    // Validate COD
    if (orderForm.enableCOD && orderForm.codAmount <= 0) {
      showNotification('Vui lòng nhập số tiền COD hợp lệ (lớn hơn 0)', 'warning');
      return;
    }

    try {
      // Lấy tọa độ của địa chỉ lấy hàng và giao hàng
      const GOONG_API_KEY = process.env.REACT_APP_GOONG_API_KEY || '1lFpdLwtqDptWEatprlXxKKd9MrmZoOqZ48ZizOz';
      
      // Lấy tọa độ địa chỉ lấy hàng
      const pickupGeocode = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(orderForm.pickupAddress)}&api_key=${GOONG_API_KEY}`
      );
      const pickupData = await pickupGeocode.json();
      
      // Lấy tọa độ địa chỉ giao hàng
      const deliveryGeocode = await fetch(
        `https://rsapi.goong.io/geocode?address=${encodeURIComponent(orderForm.address)}&api_key=${GOONG_API_KEY}`
      );
      const deliveryData = await deliveryGeocode.json();
      
      let pickupCoords = null;
      let deliveryCoords = null;
      
      if (pickupData.results?.length > 0) {
        const location = pickupData.results[0].geometry.location;
        pickupCoords = {
          lat: location.lat,
          lon: location.lng
        };
      }
      
      if (deliveryData.results?.length > 0) {
        const location = deliveryData.results[0].geometry.location;
        deliveryCoords = {
          lat: location.lat,
          lon: location.lng
        };
      }

      // Tạo dữ liệu đơn hàng để gửi theo đúng API schema
      const orderData = {
        sender_name: orderForm.customerName,
        sender_phone: orderForm.phone,
        recipient_name: orderForm.receiverName,
        recipient_phone: orderForm.receiverPhone,
        pickup_address: orderForm.pickupAddress,
        pickup_location: pickupCoords,
        destination_address: orderForm.address,
        destination_location: deliveryCoords,
        distance_km: distance ? distance.distance : null,
        shipping_fee: deliveryPrice || 0,
        cod_amount: orderForm.enableCOD ? orderForm.codAmount : 0,
        notes: orderForm.notes || "",
        total_amount: (deliveryPrice || 0) + (orderForm.enableCOD ? orderForm.codAmount : 0)
      };

      // Gửi dữ liệu tới API endpoint
      console.log('📦 Dữ liệu đơn hàng sẽ gửi tới API:', orderData);
      
      // Gửi tới API endpoint tạo đơn hàng
      const response = await fetch('http://localhost:8000/api/order/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        showNotification('✅ Đơn hàng đã được tạo thành công!', 'success');
        console.log('✅ API Response:', result);
        
        // Tạo đơn hàng mới để thêm vào danh sách
        const newOrder = {
          id: result.order_id || `temp_${Date.now()}`, // Sử dụng ID từ API hoặc tạm thời
          trip_id: result.trip_id || `trip_${Date.now()}`,
          trip_id_short: result.trip_id ? result.trip_id.substring(0, 8) + '...' : 'temp...',
          status: 'searching', // Trạng thái ban đầu
          sender_name: orderForm.customerName,
          sender_phone: orderForm.phone,
          recipient_name: orderForm.receiverName,
          recipient_phone: orderForm.receiverPhone,
          pickup_address: orderForm.pickupAddress,
          destination_address: orderForm.address,
          pickup_location: pickupCoords,
          destination_location: deliveryCoords,
          distance_km: distance ? distance.distance : null,
          shipping_fee: deliveryPrice || 0,
          cod_amount: orderForm.enableCOD ? orderForm.codAmount : 0,
          notes: orderForm.notes || "",
          driver_id: null,
          driver_id_short: null,
          created_at: new Date().toISOString(),
          completed_at: null,
          updated_at: new Date().toISOString()
        };

        // Thêm đơn hàng mới vào đầu danh sách
        setApiOrders(prevOrders => [newOrder, ...prevOrders]);
        setTotalOrders(prev => prev + 1);
        
        // Reset current page về 1 để hiển thị đơn hàng mới
        setCurrentPage(1);
        
        // Reset form sau khi tạo thành công
        setOrderForm({
          customerName: '',
          phone: '',
          receiverName: '',
          receiverPhone: '',
          pickupAddress: '',
          address: '',
          notes: '',
          enableCOD: false,
          codAmount: 0
        });
        setDistance(null);
        setDeliveryPrice(null);
        
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('❌ Lỗi tạo đơn hàng:', error);
      showNotification(`Lỗi tạo đơn hàng: ${error.message}`, 'error');
    }
  };

  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
  };

  const sendOrderToDriver = (driver) => {
    if (!driver) return;
    
    console.log('Sending order to driver:', driver.name);
    setWaitingForResponse(true);
    setAssigningOrder(true);
    
    // Simulate gửi đơn đến app tài xế và chờ phản hồi (30 giây timeout)
    const timeout = setTimeout(() => {
      console.log('Driver timeout:', driver.name);
      handleDriverReject(driver, 'timeout');
    }, 30000); // 30 giây timeout
    
    setDriverResponseTimeout(timeout);
    
    // Simulate phản hồi từ tài xế (random accept/reject sau 3-8 giây)
    const responseTime = Math.random() * 5000 + 3000; // 3-8 giây
    const willAccept = Math.random() > 0.3; // 70% chance accept
    
    setTimeout(() => {
      if (driverResponseTimeout) {
        clearTimeout(driverResponseTimeout);
        setDriverResponseTimeout(null);
      }
      
      if (willAccept) {
        handleDriverAccept(driver);
      } else {
        handleDriverReject(driver, 'rejected');
      }
    }, responseTime);
  };

  const handleDriverReject = (driver, reason = 'rejected') => {
    if (!driver) return;
    
    setWaitingForResponse(false);
    setAssigningOrder(false);
    
    if (driverResponseTimeout) {
      clearTimeout(driverResponseTimeout);
      setDriverResponseTimeout(null);
    }
    
    const reasonText = reason === 'timeout' ? 'không phản hồi' : 'từ chối';
    
    // Reset tất cả khi tài xế từ chối
    setSelectedDriver(null);
    setAvailableDrivers([]);
    
    showNotification(`Tài xế ${driver.name} ${reasonText}. Vui lòng thử tạo đơn hàng lại.`, 'error');
  };

  const handleDriverAccept = (driver) => {
    if (!driver) return;
    
    setWaitingForResponse(false);
    setAssigningOrder(true); // Giữ loading khi đang tạo đơn
    
    if (driverResponseTimeout) {
      clearTimeout(driverResponseTimeout);
      setDriverResponseTimeout(null);
    }
    
    showNotification(`🎉 Tài xế ${driver.name} đã chấp nhận! Đang tạo đơn hàng...`, 'success');
    
    // Tự động tạo đơn hàng sau khi tài xế chấp nhận
    setTimeout(() => {
      finalizeOrder(driver); // Truyền driver vào để đảm bảo
    }, 1000);
  };

  const finalizeOrder = (driver = null) => {
    // Sử dụng driver từ parameter hoặc selectedDriver
    const currentDriver = driver || selectedDriver;
    
    if (!currentDriver) {
      showNotification('Lỗi hệ thống: Không tìm thấy thông tin tài xế', 'error');
      return;
    }

    // Lưu thông tin tài xế trước khi reset
    const driverName = currentDriver.name;

    // Reset form
    setOrderForm({
      customerName: '',
      phone: '',
      receiverName: '',
      receiverPhone: '',
      pickupAddress: '',
      address: '',
      notes: '',
      enableCOD: false,
      codAmount: 0
    });
    setSelectedDriver(null);
    setAvailableDrivers([]);
    setAssigningOrder(false);
    setWaitingForResponse(false);
    setDistance(null);
    setDeliveryPrice(null);
    setCalculatingDistance(false);
    
    showNotification(`✅ Đơn hàng đã được tạo thành công! Tài xế ${driverName} sẽ đến lấy hàng.`, 'success');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'searching': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pickup': return 'bg-indigo-100 text-indigo-800';
      case 'delivery': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800'; // Mặc định là tìm tài xế
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'searching': return 'Tìm tài xế';
      case 'completed': return 'Hoàn thành';
      case 'pickup': return 'Đang lấy hàng';
      case 'delivery': return 'Đang giao';
      case 'cancelled': return 'Hủy';
      default: return 'Tìm tài xế'; // Mặc định là tìm tài xế
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };



  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          addressInputRef.current && !addressInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (pickupSuggestionsRef.current && !pickupSuggestionsRef.current.contains(event.target) &&
          pickupInputRef.current && !pickupInputRef.current.contains(event.target)) {
        setShowPickupSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

    // Listen cho settings updates từ SettingsService
  useEffect(() => {
    const handleSettingsUpdate = (newSettings) => {
      const pricing = {
        baseFee: newSettings.baseFee || 10000,
        distanceThreshold: newSettings.distanceThreshold || 2,
        pricePerKmUnder2: newSettings.pricePerKmUnder2 || 4000,
        pricePerKmOver2: newSettings.pricePerKmOver2 || 3500,
        useCustomFormula: newSettings.useCustomFormula || true
      };
      
      setPricingSettings(pricing);
      
      // Recalculate price nếu đã có distance
      if (distance) {
        // Tính lại giá với settings mới
        const newPrice = (() => {
          if (!pricing.useCustomFormula) {
            return 25000; // Giá cố định
          }
        
          if (distance.distance <= pricing.distanceThreshold) {
            return pricing.baseFee + (distance.distance * pricing.pricePerKmUnder2);
          } else {
            return pricing.baseFee + 
                   (pricing.distanceThreshold * pricing.pricePerKmUnder2) + 
                   ((distance.distance - pricing.distanceThreshold) * pricing.pricePerKmOver2);
          }
        })();
        
        setDeliveryPrice(newPrice);
        showNotification('✅ Đã cập nhật giá theo cài đặt mới từ file!', 'success');
      }
    };

    // Đăng ký listener với settingsService
    settingsService.addListener(handleSettingsUpdate);
    
    return () => {
      // Hủy đăng ký listener
      settingsService.removeListener(handleSettingsUpdate);
    };
  }, [distance]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (pickupSearchTimeoutRef.current) {
        clearTimeout(pickupSearchTimeoutRef.current);
      }
      if (driverResponseTimeout) {
        clearTimeout(driverResponseTimeout);
      }
    };
  }, [driverResponseTimeout]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Create Order Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Tạo đơn hàng mới</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="font-medium text-gray-900">Thông tin người gửi</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người gửi *
              </label>
              <input
                type="text"
                name="customerName"
                value={orderForm.customerName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập tên người gửi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại người gửi *
              </label>
              <input
                type="tel"
                name="phone"
                value={orderForm.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên người nhận *
              </label>
              <input
                type="text"
                name="receiverName"
                value={orderForm.receiverName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập tên người nhận"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại người nhận *
              </label>
              <input
                type="tel"
                name="receiverPhone"
                value={orderForm.receiverPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          {/* Address & Driver Search */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-medium text-gray-900">Địa chỉ lấy hàng & giao hàng</h4>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ lấy hàng *
              </label>
              <input
                ref={pickupInputRef}
                type="text"
                name="pickupAddress"
                value={orderForm.pickupAddress}
                onChange={handlePickupChange}
                onFocus={handlePickupFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập địa chỉ lấy hàng hoặc chọn từ danh sách..."
                autoComplete="off"
              />
              
              {/* Pickup Address Suggestions */}
              {(showPickupSuggestions || searchingPickup) && (
                <div
                  ref={pickupSuggestionsRef}
                  className="absolute z-[9999] w-full mt-1 bg-white border-2 border-red-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
                  style={{ 
                    top: '100%',
                    left: 0,
                    right: 0,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {searchingPickup ? (
                    <div className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Đang tìm kiếm địa chỉ...</span>
                      </div>
                    </div>
                  ) : pickupSuggestions.length > 0 ? (
                    <>
                      <div className="py-1">
                        {pickupSuggestions.map((suggestion, index) => {
                          const displayText = typeof suggestion === 'string' ? suggestion : suggestion.display_name;
                          const mainText = suggestion.structured_formatting?.main_text;
                          const secondaryText = suggestion.structured_formatting?.secondary_text;
                          
                          return (
                            <div
                              key={index}
                              className="px-4 py-3 cursor-pointer hover:bg-red-50 hover:text-red-700 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                              onClick={() => handlePickupSuggestionClick(suggestion)}
                            >
                              <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1">
                                  {mainText && secondaryText ? (
                                    <>
                                      <div className="text-sm text-gray-900 font-medium">{mainText}</div>
                                      <div className="text-xs text-gray-500 mt-1">{secondaryText}</div>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-800 font-medium">{displayText}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Footer info */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Tìm thấy {pickupSuggestions.length} kết quả</span>
                          <span>Click để chọn</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 px-4 text-center text-sm text-gray-500">
                      Không tìm thấy địa chỉ phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ giao hàng *
              </label>
              <input
                ref={addressInputRef}
                type="text"
                name="address"
                value={orderForm.address}
                onChange={handleAddressChange}
                onFocus={handleAddressFocus}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Nhập địa chỉ giao hàng hoặc chọn từ danh sách..."
                autoComplete="off"
              />
              
              {/* Address Suggestions */}
              {(showSuggestions || searchingAddress) && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-[9999] w-full mt-1 bg-white border-2 border-red-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
                  style={{ 
                    top: '100%',
                    left: 0,
                    right: 0,
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  {searchingAddress ? (
                    <div className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-red-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm text-gray-600">Đang tìm kiếm địa chỉ...</span>
                      </div>
                    </div>
                  ) : addressSuggestions.length > 0 ? (
                    <>
                      <div className="py-1">
                        {addressSuggestions.map((suggestion, index) => {
                          const displayText = typeof suggestion === 'string' ? suggestion : suggestion.display_name;
                          const mainText = suggestion.structured_formatting?.main_text;
                          const secondaryText = suggestion.structured_formatting?.secondary_text;
                          
                          return (
                            <div
                              key={index}
                              className="px-4 py-3 cursor-pointer hover:bg-red-50 hover:text-red-700 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <div className="flex items-start">
                                <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <div className="flex-1">
                                  {mainText && secondaryText ? (
                                    <>
                                      <div className="text-sm text-gray-900 font-medium">{mainText}</div>
                                      <div className="text-xs text-gray-500 mt-1">{secondaryText}</div>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-800 font-medium">{displayText}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Footer info */}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Tìm thấy {addressSuggestions.length} kết quả</span>
                          <span>Click để chọn</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 px-4 text-center text-sm text-gray-500">
                      Không tìm thấy địa chỉ phù hợp
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Distance & Price Calculation */}
            {(orderForm.pickupAddress && orderForm.address) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-blue-900 mb-3">📊 Thông tin vận chuyển</h5>
                
                {calculatingDistance ? (
                  <div className="flex items-center justify-center py-4">
                    <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-blue-700">Đang tính toán khoảng cách và giá tiền...</span>
                  </div>
                ) : distance && deliveryPrice ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">Khoảng cách</div>
                      <div className="text-lg font-bold text-blue-900">
                        {distance.distanceText}
                        {distance.isEstimate && <span className="text-xs text-blue-500 ml-1">(ước tính)</span>}
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">Thời gian dự kiến</div>
                      <div className="text-lg font-bold text-blue-900">{distance.durationText}</div>
                    </div>
                    
                                         <div className="bg-white rounded-lg p-3 border border-green-200 bg-green-50">
                       <div className="text-xs text-green-600 font-medium">Phí vận chuyển</div>
                       <div className="text-xl font-bold text-green-700">
                         {deliveryPrice.toLocaleString('vi-VN')} ₫
                       </div>
                     </div>
                     
                     {/* COD Amount Display */}
                     {orderForm.enableCOD && orderForm.codAmount > 0 && (
                       <div className="bg-white rounded-lg p-3 border border-orange-200 bg-orange-50">
                         <div className="text-xs text-orange-600 font-medium">Tiền thu hộ (COD)</div>
                         <div className="text-xl font-bold text-orange-700">
                           {orderForm.codAmount.toLocaleString('vi-VN')} ₫
                         </div>
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                                         <div className="text-center">
                       <div className="text-blue-600 text-sm mb-3">
                         💡 Nhập đầy đủ địa chỉ lấy hàng và giao hàng để tính toán phí vận chuyển
                       </div>
                       {(orderForm.pickupAddress && orderForm.address) && (
                         <div className="space-x-2">
                           <button
                             type="button"
                             onClick={() => calculateDistance(orderForm.pickupAddress, orderForm.address)}
                             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                           >
                             🧮 Tính toán phí vận chuyển
                           </button>
                           <button
                             type="button"
                             onClick={async () => {
                               try {
                                 const settings = await settingsService.getPricingSettings();
                                 setPricingSettings(settings);
                                 
                                 // Tính lại giá nếu có distance
                                 if (distance) {
                                   const newPrice = calculateDeliveryPrice(distance.distance);
                                   setDeliveryPrice(newPrice);
                                 }
                                 
                                 showNotification('✅ Đã tải lại cài đặt giá từ file!', 'success');
                               } catch (error) {
                                 console.error('Lỗi tải cài đặt:', error);
                                 showNotification('❌ Lỗi tải cài đặt từ file!', 'error');
                               }
                             }}
                             className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                           >
                             🔄 Làm mới giá
                           </button>
                         </div>
                       )}
                     </div>
                  </div>
                )}

                                 {/* Total Amount */}
                 {distance && deliveryPrice && orderForm.enableCOD && orderForm.codAmount > 0 && (
                   <div className="mt-4 pt-3 border-t border-blue-200">
                     <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                       <div className="text-sm font-semibold text-yellow-800">
                         💰 Tổng tiền tài xế thu:
                       </div>
                       <div className="text-xl font-bold text-yellow-900">
                         {(deliveryPrice + orderForm.codAmount).toLocaleString('vi-VN')} ₫
                       </div>
                     </div>
                     <div className="text-xs text-yellow-600 mt-1">
                       = Phí vận chuyển ({deliveryPrice.toLocaleString('vi-VN')} ₫) + COD ({orderForm.codAmount.toLocaleString('vi-VN')} ₫)
                     </div>
                   </div>
                 )}

                 {/* Pricing Formula Info */}
                 {distance && deliveryPrice && (
                   <div className="mt-4 pt-3 border-t border-blue-200">
                     <div className="text-xs text-blue-600">
                       <strong>Công thức tính giá:</strong> 
                       {distance.distance <= pricingSettings.distanceThreshold ? (
                         <span className="ml-1">
                           {pricingSettings.baseFee.toLocaleString('vi-VN')} + ({distance.distance.toFixed(1)} km × {pricingSettings.pricePerKmUnder2.toLocaleString('vi-VN')}) = {deliveryPrice.toLocaleString('vi-VN')} ₫
                         </span>
                       ) : (
                         <span className="ml-1">
                           {pricingSettings.baseFee.toLocaleString('vi-VN')} + ({pricingSettings.distanceThreshold} km × {pricingSettings.pricePerKmUnder2.toLocaleString('vi-VN')}) + ({(distance.distance - pricingSettings.distanceThreshold).toFixed(1)} km × {pricingSettings.pricePerKmOver2.toLocaleString('vi-VN')}) = {deliveryPrice.toLocaleString('vi-VN')} ₫
                         </span>
                       )}
                     </div>
                   </div>
                 )}
              </div>
            )}

            {/* COD Section */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-semibold text-orange-900">💵 Thu tiền hộ (COD)</h5>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="enableCOD"
                    checked={orderForm.enableCOD}
                    onChange={(e) => {
                      setOrderForm({ 
                        ...orderForm, 
                        enableCOD: e.target.checked,
                        codAmount: e.target.checked ? orderForm.codAmount : 0
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {orderForm.enableCOD ? 'Có thu tiền hộ' : 'Không thu tiền hộ'}
                  </span>
                </label>
              </div>

              {orderForm.enableCOD && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền COD (VNĐ) *
                    </label>
                    <input
                      type="number"
                      name="codAmount"
                      value={orderForm.codAmount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setOrderForm({ ...orderForm, codAmount: value });
                      }}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nhập số tiền cần thu hộ..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Số tiền tài xế sẽ thu từ người nhận
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền (định dạng)
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                      {orderForm.codAmount > 0 ? orderForm.codAmount.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Hiển thị định dạng tiền tệ
                    </p>
                  </div>
                </div>
              )}

              {/* COD Warning */}
              {orderForm.enableCOD && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">
                        Lưu ý quan trọng về COD:
                      </h4>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1 list-disc list-inside">
                        <li>Tài xế sẽ thu đúng số tiền COD từ người nhận</li>
                        <li>Kiểm tra kỹ thông tin số tiền trước khi tạo đơn</li>
                        <li>COD + phí vận chuyển = tổng tiền tài xế thu</li>
                        <li>Tài xế sẽ nộp lại tiền COD cho công ty</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                name="notes"
                value={orderForm.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ghi chú thêm cho đơn hàng..."
              />
            </div>

            {/* Create Order Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCreateOrder}
                disabled={searchingDriver || !orderForm.customerName || !orderForm.phone || !orderForm.receiverName || !orderForm.receiverPhone || !orderForm.pickupAddress || !orderForm.address}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {searchingDriver ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tìm tài xế...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Tạo đơn hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Available Drivers */}
        {availableDrivers.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">
                🚚 Tài xế gần nhất
              </h4>
            </div>

            {/* Current Selected Driver (Priority) */}
            {selectedDriver && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-semibold text-blue-900">
                    🎯 Tài xế gần nhất
                  </h5>
                  <div className="flex items-center space-x-2">
                    {waitingForResponse ? (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full animate-pulse">
                        📱 Chờ phản hồi...
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Gần nhất
                      </span>
                    )}
                    {selectedDriver.currentOrders > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {selectedDriver.currentOrders} đơn
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-lg font-medium text-white">
                        {selectedDriver.name.split(' ').pop()[0]}
                      </span>
                    </div>
                    <div>
                      <h6 className="font-semibold text-gray-900 text-lg">{selectedDriver.name}</h6>
                      <p className="text-sm text-gray-600">{selectedDriver.vehicle} • {selectedDriver.phone}</p>
                      <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                        <span>📍 {selectedDriver.distance} km</span>
                        <span>⏱️ {selectedDriver.estimatedTime}</span>
                        <span>⭐ {selectedDriver.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Status */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                  {waitingForResponse ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-orange-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          📱 Đã gửi đơn hàng đến tài xế
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đang chờ tài xế phản hồi... (timeout 30s)
                        </p>
                      </div>
                    </div>
                  ) : assigningOrder ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-green-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                          ✅ Tài xế đã chấp nhận! Đang tạo đơn hàng...
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Đang lưu thông tin đơn hàng vào hệ thống
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-medium text-green-600">
                        ✅ Đã tìm thấy tài xế gần nhất
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Đang gửi đơn hàng đến tài xế
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                📋 Danh sách đơn hàng từ Database ({totalOrders} đơn)
              </h3>
              {orderStats && (
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="text-blue-600">🔍 Đang tìm tài xế: {orderStats.searching || 0}</span>
                  <span className="text-green-600">✅ Hoàn thành: {orderStats.completed || 0}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchOrdersFromAPI(true, false)}
                disabled={loadingOrders || backgroundLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center"
              >
                {loadingOrders ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Làm mới
                  </>
                )}
              </button>
              
              {/* Connection Status */}
              <div className="text-xs text-gray-500">
                <div className="flex items-center">
                  {isConnected ? (
                    <>
                      <span className="animate-pulse text-green-500 mr-1">●</span>
                      <span className="text-green-600 font-medium">Real-time</span>
                    </>
                  ) : loadingOrders ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-blue-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang tải...</span>
                    </>
                  ) : backgroundLoading ? (
                    <>
                      <span className="animate-pulse text-blue-400 mr-1">●</span>
                      <span className="text-blue-600">Đang đồng bộ...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-yellow-500 mr-1">●</span>
                      <span>Auto-sync 30s</span>
                    </>
                  )}
                </div>
                {lastFetchTime && (
                  <div>Cập nhật: {lastFetchTime.toLocaleTimeString('vi-VN')}</div>
                )}
              </div>
              
              {/* Pagination Info */}
              <div className="text-sm text-gray-500">
                Trang {currentPage} / {totalPages} (Hiển thị {currentOrders.length}/{apiOrders.length})
              </div>
            </div>
          </div>
        </div>
        
        {loadingOrders ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg text-gray-600">Đang tải danh sách đơn hàng từ database...</span>
          </div>
        ) : apiOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">📭 Chưa có đơn hàng nào trong database</div>
            <p className="text-sm text-gray-400 mt-2">Tạo đơn hàng đầu tiên để bắt đầu!</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người gửi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người nhận</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khoảng cách</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phí vận chuyển</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">COD</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài xế</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order, index) => (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${
                        order.isUpdated ? 'updated-row' : ''
                      }`}
                      style={{
                        animation: order.id.startsWith('temp_') ? 'slideInFromTop 0.5s ease-out' : 'none',
                        animationDelay: `${index * 0.05}s`
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-mono text-xs text-blue-600">#{order.id.slice(-6)}</div>
                          <div className="text-xs text-gray-500">Trip: {order.trip_id_short}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.sender_name}</div>
                          <div className="text-sm text-gray-500">{order.sender_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.recipient_name}</div>
                          <div className="text-sm text-gray-500">{order.recipient_phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 truncate" title={order.pickup_address}>
                            📦 {order.pickup_address}
                          </div>
                          <div className="text-xs text-gray-700 truncate" title={order.destination_address}>
                            🏠 {order.destination_address}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-blue-600">
                          {order.distance_km ? `${order.distance_km.toFixed(1)} km` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(order.shipping_fee)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.cod_amount > 0 ? (
                          <div>
                            <span className="font-semibold text-orange-600">
                              {formatCurrency(order.cod_amount)}
                            </span>
                            <div className="text-xs text-orange-500">Thu hộ</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Không COD</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.driver_id ? (
                          <div>
                            <div className="text-xs text-blue-600">ID: {order.driver_id_short}</div>
                            <div className="text-xs text-gray-500">Đã phân công</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Chưa có</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="text-xs">Tạo: {formatDate(order.created_at)}</div>
                          {order.completed_at && (
                            <div className="text-xs text-green-600">Hoàn thành: {formatDate(order.completed_at)}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{indexOfFirstOrder + 1}</span> đến{' '}
                    <span className="font-medium">{Math.min(indexOfLastOrder, apiOrders.length)}</span> trong tổng số{' '}
                    <span className="font-medium">{apiOrders.length}</span> đơn hàng
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                              currentPage === pageNum
                                ? 'bg-red-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Notification */}
      {notification && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto animate-bounce-in">
            <div className={`
              max-w-md mx-auto p-6 rounded-xl shadow-2xl border-2 transform transition-all duration-300
              ${notification.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : notification.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : notification.type === 'warning'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
              }
            `}>
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-4">
                  {notification.type === 'success' && (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {notification.type === 'error' && (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {notification.type === 'warning' && (
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  )}
                  {notification.type === 'info' && (
                    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-semibold leading-tight">
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideInFromTop {
          0% {
            transform: translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes highlightUpdate {
          0% {
            background-color: #dbeafe;
            border-left: 4px solid #3b82f6;
          }
          100% {
            background-color: transparent;
            border-left: none;
          }
        }
        
        .updated-row {
          animation: highlightUpdate 2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OrdersView; 