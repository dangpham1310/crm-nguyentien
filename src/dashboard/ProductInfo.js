import React, { useState } from 'react';

const ProductInfo = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      networkProvider: 'Viettel',
      service: 'Gói cước di động',
      packageName: 'V90',
      expireDate: '2024-12-31',
      listPrice: 90000,
      invoicePrice: 85000,
      customerPrice: 80000,
      debt: 0
    },
    {
      id: 2,
      networkProvider: 'Mobifone',
      service: 'Internet gia đình',
      packageName: 'Home 100',
      expireDate: '2024-11-30',
      listPrice: 200000,
      invoicePrice: 190000,
      customerPrice: 180000,
      debt: 20000
    },
    {
      id: 3,
      networkProvider: 'Vinaphone',
      service: 'Gói cước di động',
      packageName: 'Max70',
      expireDate: '2024-10-15',
      listPrice: 70000,
      invoicePrice: 65000,
      customerPrice: 60000,
      debt: 10000
    }
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    networkProvider: '',
    service: '',
    packageName: '',
    expireDate: '',
    listPrice: '',
    invoicePrice: '',
    customerPrice: '',
    debt: ''
  });

  const handleAddProduct = () => {
    if (newProduct.networkProvider && newProduct.service && newProduct.packageName) {
      setProducts([...products, { 
        ...newProduct, 
        id: Date.now(),
        listPrice: parseInt(newProduct.listPrice) || 0,
        invoicePrice: parseInt(newProduct.invoicePrice) || 0,
        customerPrice: parseInt(newProduct.customerPrice) || 0,
        debt: parseInt(newProduct.debt) || 0
      }]);
      setNewProduct({
        networkProvider: '',
        service: '',
        packageName: '',
        expireDate: '',
        listPrice: '',
        invoicePrice: '',
        customerPrice: '',
        debt: ''
      });
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const getNetworkColor = (provider) => {
    switch (provider) {
      case 'Viettel': return 'bg-green-100 text-green-800';
      case 'Mobifone': return 'bg-blue-100 text-blue-800';
      case 'Vinaphone': return 'bg-purple-100 text-purple-800';
      case 'Vietnamobile': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceColor = (service) => {
    switch (service) {
      case 'Gói cước di động': return 'bg-blue-100 text-blue-800';
      case 'Internet gia đình': return 'bg-green-100 text-green-800';
      case 'Truyền hình': return 'bg-purple-100 text-purple-800';
      case 'Combo': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDebtColor = (debt) => {
    if (debt > 0) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const isExpiringSoon = (expireDate) => {
    if (!expireDate) return false;
    const today = new Date();
    const expire = new Date(expireDate);
    const diffTime = expire - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expireDate) => {
    if (!expireDate) return false;
    const today = new Date();
    const expire = new Date(expireDate);
    return expire < today;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Thông Tin Sản Phẩm</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => isExpiringSoon(p.expireDate)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Có công nợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.debt > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng công nợ</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(products.reduce((sum, p) => sum + p.debt, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nhà mạng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dịch vụ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gói cước
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hạn dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá niêm yết
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá thu khách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Công nợ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getNetworkColor(product.networkProvider)}`}>
                      {product.networkProvider}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getServiceColor(product.service)}`}>
                      {product.service}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.packageName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className={`
                      ${isExpired(product.expireDate) ? 'text-red-600 font-medium' : 
                        isExpiringSoon(product.expireDate) ? 'text-yellow-600 font-medium' : 
                        'text-gray-900'}
                    `}>
                      {product.expireDate}
                    </div>
                    {isExpired(product.expireDate) && (
                      <div className="text-xs text-red-500">Đã hết hạn</div>
                    )}
                    {isExpiringSoon(product.expireDate) && !isExpired(product.expireDate) && (
                      <div className="text-xs text-yellow-500">Sắp hết hạn</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.listPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.invoicePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.customerPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDebtColor(product.debt)}`}>
                      {product.debt > 0 ? formatCurrency(product.debt) : 'Không'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Thêm sản phẩm mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhà mạng*
                </label>
                <select
                  value={newProduct.networkProvider}
                  onChange={(e) => setNewProduct({...newProduct, networkProvider: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Chọn nhà mạng</option>
                  <option value="Viettel">Viettel</option>
                  <option value="Mobifone">Mobifone</option>
                  <option value="Vinaphone">Vinaphone</option>
                  <option value="Vietnamobile">Vietnamobile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dịch vụ*
                </label>
                <select
                  value={newProduct.service}
                  onChange={(e) => setNewProduct({...newProduct, service: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Chọn dịch vụ</option>
                  <option value="Gói cước di động">Gói cước di động</option>
                  <option value="Internet gia đình">Internet gia đình</option>
                  <option value="Truyền hình">Truyền hình</option>
                  <option value="Combo">Combo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gói cước*
                </label>
                <input
                  type="text"
                  value={newProduct.packageName}
                  onChange={(e) => setNewProduct({...newProduct, packageName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nhập tên gói cước"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hạn dùng
                </label>
                <input
                  type="date"
                  value={newProduct.expireDate}
                  onChange={(e) => setNewProduct({...newProduct, expireDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá niêm yết (VND)
                </label>
                <input
                  type="number"
                  value={newProduct.listPrice}
                  onChange={(e) => setNewProduct({...newProduct, listPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá hóa đơn (VND)
                </label>
                <input
                  type="number"
                  value={newProduct.invoicePrice}
                  onChange={(e) => setNewProduct({...newProduct, invoicePrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thu khách (VND)
                </label>
                <input
                  type="number"
                  value={newProduct.customerPrice}
                  onChange={(e) => setNewProduct({...newProduct, customerPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Công nợ (VND)
                </label>
                <input
                  type="number"
                  value={newProduct.debt}
                  onChange={(e) => setNewProduct({...newProduct, debt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductInfo; 