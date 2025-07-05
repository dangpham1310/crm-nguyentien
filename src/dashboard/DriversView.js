import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';

const DriversView = () => {
  const { user } = useAuth();
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list' hoặc 'verification'
  const [showBanModal, setShowBanModal] = useState(false);
  const [banAction, setBanAction] = useState(null); // { driverId, banStatus, driverName }
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch drivers when component mounts
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/admin/drivers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể lấy danh sách tài xế');
      }

      const data = await response.json();
      setDrivers(data.drivers || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Có lỗi xảy ra khi tải danh sách tài xế');
      showNotification('Có lỗi xảy ra khi tải danh sách tài xế', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '⚫';
      case 'busy': return '🟡';
      default: return '⚫';
    }
  };

  const getDocumentStatus = (status) => {
    switch (status) {
      case 'verified': return { color: 'text-green-600', icon: '✅', text: 'Đã xác minh' };
      case 'pending': return { color: 'text-yellow-600', icon: '⏳', text: 'Chờ xác minh' };
      case 'expired': return { color: 'text-red-600', icon: '❌', text: 'Hết hạn' };
      default: return { color: 'text-gray-600', icon: '❓', text: 'Chưa có' };
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = (driver.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (driver.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'online' && driver.is_available && driver.is_active) ||
                         (statusFilter === 'offline' && !driver.is_active) ||
                         (statusFilter === 'busy' && !driver.is_available && driver.is_active);
    return matchesSearch && matchesStatus;
  });

  // Lọc tài xế cần xác minh và có giấy tờ hết hạn
  const pendingVerificationDrivers = drivers.filter(driver => 
    driver.documents && Object.values(driver.documents).some(status => status === 'pending')
  );

  const expiredDocumentDrivers = drivers.filter(driver => 
    driver.documents && Object.values(driver.documents).some(status => status === 'expired')
  );

  const handleStatusChange = (driverId, newStatus) => {
    setDrivers(drivers.map(driver => 
      driver.id === driverId ? { ...driver, status: newStatus } : driver
    ));
    showNotification(`Đã cập nhật trạng thái tài xế thành ${newStatus}`, 'success');
  };

  const handleDeleteDriver = (driverId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài xế này?')) {
      setDrivers(drivers.filter(driver => driver.id !== driverId));
      setSelectedDriver(null);
      showNotification('Đã xóa tài xế thành công', 'success');
    }
  };

  const handleBanDriver = async (driverId, shouldBan) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/admin/drivers/${driverId}/${shouldBan ? 'ban' : 'unban'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Không thể ${shouldBan ? 'khóa' : 'mở khóa'} tài xế`);
      }

      // Cập nhật trạng thái tài xế trong state
    setDrivers(drivers.map(driver => 
        driver.id === driverId ? { ...driver, is_active: !shouldBan } : driver
      ));
      
      showNotification(`Đã ${shouldBan ? 'khóa' : 'mở khóa'} tài xế thành công`, 'success');
    } catch (err) {
      console.error('Error banning/unbanning driver:', err);
      showNotification(`Có lỗi xảy ra khi ${shouldBan ? 'khóa' : 'mở khóa'} tài xế`, 'error');
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver({...driver});
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingDriver.name || !editingDriver.phone || !editingDriver.email || !editingDriver.vehicleNumber) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    setDrivers(drivers.map(driver => 
      driver.id === editingDriver.id ? editingDriver : driver
    ));
    
    if (selectedDriver?.id === editingDriver.id) {
      setSelectedDriver(editingDriver);
    }
    
    setShowEditModal(false);
    setEditingDriver(null);
    showNotification(`Đã cập nhật thông tin tài xế ${editingDriver.name}`, 'success');
  };

  const handleAddDriver = (newDriverData) => {
    const newDriver = {
      id: Math.max(...drivers.map(d => d.id)) + 1,
      ...newDriverData,
      rating: 0,
      totalOrders: 0,
      completedOrders: 0,
      status: 'offline',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      earnings: 0,
      avatar: null,
      documents: {
        license: 'pending',
        registration: 'pending',
        insurance: 'pending'
      },
      documentImages: {
        license: 'https://via.placeholder.com/400x250/f59e0b/ffffff?text=Bằng+lái+mới+nộp',
        registration: 'https://via.placeholder.com/400x250/f59e0b/ffffff?text=Đăng+ký+mới+nộp',
        insurance: 'https://via.placeholder.com/400x250/f59e0b/ffffff?text=Bảo+hiểm+mới+nộp'
      }
    };
    
    setDrivers([...drivers, newDriver]);
    showNotification(`Đã thêm tài xế ${newDriver.name} thành công`, 'success');
  };

  const handleVerifyDocument = (driverId, documentType, status) => {
    setDrivers(drivers.map(driver => 
      driver.id === driverId 
        ? { 
            ...driver, 
            documents: { 
              ...driver.documents, 
              [documentType]: status 
            } 
          } 
        : driver
    ));
    
    if (selectedDriver?.id === driverId) {
      setSelectedDriver(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [documentType]: status
        }
      }));
    }
    
    const statusText = status === 'verified' ? 'đã xác minh' : status === 'expired' ? 'hết hạn' : 'chờ xác minh';
    const docText = documentType === 'license' ? 'bằng lái' : documentType === 'registration' ? 'đăng ký xe' : 'bảo hiểm';
    showNotification(`Đã cập nhật trạng thái ${docText} thành ${statusText}`, 'success');
  };

  const handleApproveDriver = async (driverId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/admin/drivers/${driverId}/approve?is_approved=true`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể duyệt tài xế');
      }

      // Cập nhật trạng thái tài xế trong state
      setDrivers(drivers.map(driver => 
        driver.id === driverId ? { ...driver, is_approved: true } : driver
      ));
      
      showNotification('Đã duyệt tài xế thành công', 'success');
    } catch (err) {
      console.error('Error approving driver:', err);
      showNotification('Có lỗi xảy ra khi duyệt tài xế', 'error');
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/admin/drivers/${driverId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể từ chối tài xế');
      }

      // Xóa tài xế khỏi danh sách
      setDrivers(drivers.filter(driver => driver.id !== driverId));
      
      showNotification('Đã từ chối tài xế thành công', 'success');
    } catch (err) {
      console.error('Error rejecting driver:', err);
      showNotification('Có lỗi xảy ra khi từ chối tài xế', 'error');
    }
  };

  const handleViewDriverDetail = async (driverId) => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:8000/admin/drivers/${driverId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể lấy thông tin chi tiết tài xế');
      }

      const data = await response.json();
      setSelectedDriver(data.driver);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error fetching driver detail:', err);
      showNotification('Có lỗi xảy ra khi lấy thông tin chi tiết tài xế', 'error');
    }
  };

  const renderDrivers = () => {
    const filteredDrivers = drivers.filter(driver => {
      // Lọc theo trạng thái phê duyệt
      if (activeTab === 'pending' && driver.is_approved) return false;
      if (activeTab === 'approved' && !driver.is_approved) return false;
      
      // Lọc theo từ khóa tìm kiếm
      if (searchTerm) {
        const keyword = searchTerm.toLowerCase();
        return (
          driver.full_name?.toLowerCase().includes(keyword) ||
          driver.phone?.toLowerCase().includes(keyword)
        );
      }
      return true;
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài xế</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thông tin liên hệ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDrivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-white">
                        {driver.full_name?.charAt(0) || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{driver.full_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{driver.gender || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{driver.phone || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{driver.email || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    driver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Tạo: {new Date(driver.created_at).toLocaleString('vi-VN')}</div>
                  <div>Cập nhật: {new Date(driver.updated_at).toLocaleString('vi-VN')}</div>
                  {driver.last_login && (
                    <div>Đăng nhập: {new Date(driver.last_login).toLocaleString('vi-VN')}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleViewDriverDetail(driver.id)}
                      className="text-blue-600 hover:text-blue-900 focus:outline-none focus:underline"
                    >
                      Chi tiết
                    </button>
                    {!driver.is_approved && (
                      <>
                        <button
                          onClick={() => handleApproveDriver(driver.id)}
                          className="text-green-600 hover:text-green-900 focus:outline-none focus:underline"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectDriver(driver.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none focus:underline"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    {driver.is_approved && (
                      <button
                        onClick={() => handleBanDriver(driver.id, driver.is_active)}
                        className={`${
                          driver.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        } focus:outline-none focus:underline`}
                      >
                        {driver.is_active ? 'Khóa' : 'Mở khóa'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">{error}</p>
          <button
            onClick={fetchDrivers}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg animate-bounce ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 
          notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        } text-white`}>
          <div className="flex items-center space-x-2">
            <span>
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'warning' && '⚠️'}
              {notification.type === 'info' && 'ℹ️'}
            </span>
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý tài xế</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Thêm tài xế mới
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            📋 Danh sách tài xế
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            ⏳ Chờ duyệt
            {drivers.filter(d => !d.is_approved).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {drivers.filter(d => !d.is_approved).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
              <div className="flex-1">
                  <input
                    type="text"
                placeholder="Tìm kiếm theo tên, số điện thoại..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="online">Đang hoạt động</option>
                  <option value="offline">Ngoại tuyến</option>
              <option value="busy">Đang bận</option>
                </select>
          </div>

          {renderDrivers()}
        </>
      ) : (
        /* Pending Approval List */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài xế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CCCD
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đăng ký
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.filter(d => !d.is_approved).map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-yellow-600">
                            {driver.full_name ? driver.full_name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                        </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.full_name || 'Chưa cập nhật'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {driver.id}
                      </div>
                    </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.phone || 'Chưa cập nhật'}</div>
                    <div className="text-sm text-gray-500">{driver.email || 'Chưa cập nhật'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.cccd_number || 'Chưa cập nhật'}</div>
                    <div className="text-sm text-gray-500">{driver.date_of_birth || 'Chưa cập nhật'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(driver.created_at).toLocaleDateString('vi-VN')}
                  </div>
                    <div className="text-sm text-gray-500">
                      {new Date(driver.created_at).toLocaleTimeString('vi-VN')}
                </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleApproveDriver(driver.id)}
                      className="text-green-600 hover:text-green-900 mr-4"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleRejectDriver(driver.id)}
                      className="text-red-600 hover:text-red-900 mr-4"
                    >
                      Từ chối
                    </button>
                    <button
                      onClick={() => handleViewDriverDetail(driver.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
      )}

      {/* Driver Detail Modal */}
      {showDetailModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Thông tin chi tiết tài xế</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDriver(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
              </div>
            
              <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin cơ bản</h4>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Họ tên:</span> {selectedDriver.full_name}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {selectedDriver.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Số điện thoại:</span> {selectedDriver.phone}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Giới tính:</span> {selectedDriver.gender}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Ngày sinh:</span> {selectedDriver.date_of_birth}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">CCCD:</span> {selectedDriver.cccd_number}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Địa chỉ thường trú:</span> {selectedDriver.permanent_address}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Trạng thái hoạt động:</span>{' '}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedDriver.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedDriver.is_active ? '✅ Đang hoạt động' : '❌ Ngừng hoạt động'}
                    </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Trạng thái duyệt:</span>{' '}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedDriver.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDriver.is_approved ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                    </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Trạng thái làm việc:</span>{' '}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedDriver.is_available ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedDriver.is_available ? '✅ Sẵn sàng' : '⏸️ Đang bận'}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Giấy tờ tùy thân</h4>
                <div className="space-y-4">
                  <div>
                      <p className="text-sm font-medium mb-2">CCCD mặt trước</p>
                      {selectedDriver.cccd_front_image_url && (
                        <img
                          src={`http://localhost:8000/${selectedDriver.cccd_front_image_url}`}
                          alt="CCCD mặt trước"
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                  </div>
                  <div>
                      <p className="text-sm font-medium mb-2">CCCD mặt sau</p>
                      {selectedDriver.cccd_back_image_url && (
                        <img
                          src={`http://localhost:8000/${selectedDriver.cccd_back_image_url}`}
                          alt="CCCD mặt sau"
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                      )}
                    </div>
                  </div>
                  </div>
                </div>

              {/* Statistics */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Thống kê</h4>
                  <div className="grid grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedDriver.total_deliveries || 0}</p>
                    <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                    </div>
                  <div className="border border-gray-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-gray-900">{selectedDriver.rating || 0}</p>
                    <p className="text-sm text-gray-500">Đánh giá</p>
                    </div>
                  </div>
                </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Thông tin bổ sung</h4>
                  <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Ngày tạo tài khoản:</span>{' '}
                    {new Date(selectedDriver.created_at).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Cập nhật lần cuối:</span>{' '}
                    {new Date(selectedDriver.updated_at).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Đăng nhập lần cuối:</span>{' '}
                    {selectedDriver.last_login ? new Date(selectedDriver.last_login).toLocaleString('vi-VN') : 'Chưa đăng nhập'}
                  </p>
                        </div>
                  </div>
                </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDriver(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Đóng
                    </button>
              {!selectedDriver.is_approved && (
                <>
                    <button
                    onClick={() => {
                      handleApproveDriver(selectedDriver.id);
                      setShowDetailModal(false);
                      setSelectedDriver(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Duyệt
                    </button>
                  <button
                    onClick={() => {
                      handleRejectDriver(selectedDriver.id);
                      setShowDetailModal(false);
                      setSelectedDriver(null);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Từ chối
                  </button>
                </>
              )}
                </div>
              </div>
            </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddDriverModal 
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDriver}
          showNotification={showNotification}
        />
      )}

      {showEditModal && editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          onClose={() => {
            setShowEditModal(false);
            setEditingDriver(null);
          }}
          onSave={handleSaveEdit}
          onChange={(field, value) => setEditingDriver({ ...editingDriver, [field]: value })}
          showNotification={showNotification}
        />
      )}

      {showBanModal && banAction && (
        <BanConfirmationModal
          driverName={banAction.driverName}
          banStatus={banAction.banStatus}
          onConfirm={() => handleBanDriver(banAction.driverId, banAction.banStatus)}
          onCancel={() => {
            setShowBanModal(false);
            setBanAction(null);
          }}
        />
      )}
    </div>
  );
};

// Add Driver Modal Component
const AddDriverModal = ({ onClose, onAdd, showNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'Xe máy',
    vehicleNumber: '',
    location: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.vehicleNumber) {
      showNotification('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Thêm tài xế mới
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Nhập họ và tên..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Nhập số điện thoại..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Nhập email..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện</label>
                <select 
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Xe máy">Xe máy</option>
                  <option value="Ô tô">Ô tô</option>
                  <option value="Xe tải nhỏ">Xe tải nhỏ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biển số xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  placeholder="Nhập biển số xe..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Nhập địa chỉ..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thêm tài xế
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Driver Modal Component
const EditDriverModal = ({ driver, onClose, onSave, onChange, showNotification }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Sửa thông tin tài xế
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={driver.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={driver.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={driver.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại phương tiện</label>
                <select 
                  value={driver.vehicleType}
                  onChange={(e) => onChange('vehicleType', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="Xe máy">Xe máy</option>
                  <option value="Ô tô">Ô tô</option>
                  <option value="Xe tải nhỏ">Xe tải nhỏ</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biển số xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={driver.vehicleNumber}
                  onChange={(e) => onChange('vehicleNumber', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={driver.location}
                  onChange={(e) => onChange('location', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Document Status Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái giấy tờ</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Bằng lái xe</span>
                    <select
                      value={driver.documents.license}
                      onChange={(e) => onChange('documents.license', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="pending">Chờ xác minh</option>
                      <option value="verified">Đã xác minh</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Đăng ký xe</span>
                    <select
                      value={driver.documents.registration}
                      onChange={(e) => onChange('documents.registration', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="pending">Chờ xác minh</option>
                      <option value="verified">Đã xác minh</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Bảo hiểm</span>
                    <select
                      value={driver.documents.insurance}
                      onChange={(e) => onChange('documents.insurance', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="pending">Chờ xác minh</option>
                      <option value="verified">Đã xác minh</option>
                      <option value="expired">Hết hạn</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ban Confirmation Modal Component
const BanConfirmationModal = ({ driverName, banStatus, onConfirm, onCancel }) => {
  const action = banStatus ? 'cấm' : 'bỏ cấm';
  const actionTitle = banStatus ? 'Cấm tài xế nhận cuốc' : 'Bỏ cấm tài xế nhận cuốc';
  const actionDescription = banStatus 
    ? 'Tài xế sẽ không thể nhận đơn hàng mới cho đến khi được bỏ cấm.'
    : 'Tài xế sẽ có thể nhận đơn hàng mới trở lại.';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              banStatus ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <span className={`text-xl ${banStatus ? 'text-red-600' : 'text-green-600'}`}>
                {banStatus ? '🚫' : '✅'}
              </span>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {actionTitle}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn <strong>{action}</strong> tài xế{' '}
                  <strong className="text-gray-900">{driverName}</strong> nhận cuốc không?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {actionDescription}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${
                banStatus 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              }`}
            >
              {banStatus ? '🚫 Xác nhận cấm' : '✅ Xác nhận bỏ cấm'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversView; 