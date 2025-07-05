import React, { useState } from 'react';

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      customerName: 'Nguyễn Văn A',
      customerPhone: '0912345678',
      orderCode: '#ĐH001',
      feedbackType: 'complaint',
      content: 'Đơn hàng giao chậm hơn dự kiến 2 ngày, ảnh hưởng đến công việc của tôi.',
      priority: 'high',
      status: 'pending',
      createdAt: '2024-12-25T10:30:00',
      resolvedAt: null
    },
    {
      id: 2,
      customerName: 'Trần Thị B',
      customerPhone: '0987654321',
      orderCode: '#ĐH002',
      feedbackType: 'compliment',
      content: 'Tài xế rất lịch sự và chuyên nghiệp. Hàng hóa được đóng gói cẩn thận.',
      priority: 'low',
      status: 'resolved',
      createdAt: '2024-12-24T14:20:00',
      resolvedAt: '2024-12-24T15:00:00'
    },
    {
      id: 3,
      customerName: 'Lê Văn C',
      customerPhone: '0909123456',
      orderCode: '#ĐH003',
      feedbackType: 'suggestion',
      content: 'Đề xuất thêm tính năng theo dõi đơn hàng real-time qua ứng dụng di động.',
      priority: 'medium',
      status: 'in-progress',
      createdAt: '2024-12-23T09:15:00',
      resolvedAt: null
    }
  ]);

  const [newFeedback, setNewFeedback] = useState({
    customerName: '',
    customerPhone: '',
    orderCode: '',
    feedbackType: 'complaint',
    content: '',
    priority: 'medium'
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFeedback(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const feedback = {
      id: feedbacks.length + 1,
      ...newFeedback,
      status: 'pending',
      createdAt: new Date().toISOString(),
      resolvedAt: null
    };
    
    setFeedbacks(prev => [feedback, ...prev]);
    setNewFeedback({
      customerName: '',
      customerPhone: '',
      orderCode: '',
      feedbackType: 'complaint',
      content: '',
      priority: 'medium'
    });
    setShowAddForm(false);
  };

  const handleStatusChange = (feedbackId, newStatus) => {
    setFeedbacks(prev => 
      prev.map(feedback => 
        feedback.id === feedbackId 
          ? { 
              ...feedback, 
              status: newStatus,
              resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : null
            }
          : feedback
      )
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'in-progress': return 'Đang xử lý';
      case 'resolved': return 'Đã giải quyết';
      default: return 'Không xác định';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Không xác định';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'complaint': return 'Khiếu nại';
      case 'compliment': return 'Khen ngợi';
      case 'suggestion': return 'Đề xuất';
      default: return 'Khác';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'complaint': return 'bg-red-100 text-red-800';
      case 'compliment': return 'bg-green-100 text-green-800';
      case 'suggestion': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const statusMatch = filterStatus === 'all' || feedback.status === filterStatus;
    const typeMatch = filterType === 'all' || feedback.feedbackType === filterType;
    return statusMatch && typeMatch;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Phản ánh của khách hàng</h2>
          <p className="mt-1 text-sm text-gray-600">
            Quản lý và theo dõi các phản ánh từ khách hàng
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm phản ánh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo trạng thái
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="in-progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Lọc theo loại
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="complaint">Khiếu nại</option>
              <option value="compliment">Khen ngợi</option>
              <option value="suggestion">Đề xuất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Feedback Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Thêm phản ánh mới</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    required
                    value={newFeedback.customerName}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={newFeedback.customerPhone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="orderCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Mã đơn hàng
                  </label>
                  <input
                    type="text"
                    id="orderCode"
                    name="orderCode"
                    value={newFeedback.orderCode}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="#ĐH001"
                  />
                </div>
                <div>
                  <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại phản ánh *
                  </label>
                  <select
                    id="feedbackType"
                    name="feedbackType"
                    required
                    value={newFeedback.feedbackType}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="complaint">Khiếu nại</option>
                    <option value="compliment">Khen ngợi</option>
                    <option value="suggestion">Đề xuất</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Mức độ ưu tiên *
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    required
                    value={newFeedback.priority}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung phản ánh *
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={4}
                  value={newFeedback.content}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập nội dung phản ánh của khách hàng..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Thêm phản ánh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedbacks List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Danh sách phản ánh ({filteredFeedbacks.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredFeedbacks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500">Không có phản ánh nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <div key={feedback.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{feedback.customerName}</h4>
                      {feedback.customerPhone && (
                        <span className="text-sm text-gray-500">• {feedback.customerPhone}</span>
                      )}
                      {feedback.orderCode && (
                        <span className="text-sm text-gray-500">• {feedback.orderCode}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(feedback.feedbackType)}`}>
                        {getTypeText(feedback.feedbackType)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(feedback.priority)}`}>
                        Ưu tiên: {getPriorityText(feedback.priority)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                        {getStatusText(feedback.status)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{feedback.content}</p>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Tạo: {formatDate(feedback.createdAt)}
                        {feedback.resolvedAt && (
                          <span> • Giải quyết: {formatDate(feedback.resolvedAt)}</span>
                        )}
                      </p>

                      {feedback.status !== 'resolved' && (
                        <div className="flex items-center space-x-2">
                          <select
                            value={feedback.status}
                            onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                          >
                            <option value="pending">Chờ xử lý</option>
                            <option value="in-progress">Đang xử lý</option>
                            <option value="resolved">Đã giải quyết</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerFeedback; 