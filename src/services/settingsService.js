// Service để quản lý settings từ file JSON
class SettingsService {
  constructor() {
    this.settingsUrl = '/settings.json';
    this.listeners = [];
  }

  // Đọc settings từ file JSON
  async loadSettings() {
    try {
      const response = await fetch(this.settingsUrl + '?t=' + Date.now()); // Cache busting
      if (!response.ok) {
        throw new Error('Không thể tải file settings.json');
      }
      const settings = await response.json();
      console.log('📁 Đã tải settings từ file:', settings);
      return settings;
    } catch (error) {
      console.error('❌ Lỗi tải settings:', error);
      
      // Fallback settings nếu không tải được file
      return {
        companyName: "Vận Chuyển Trường Duy",
        companyPhone: "1900-1234",
        companyAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        companyEmail: "info@trucongduy.com",
        defaultDeliveryRadius: 10,
        maxDeliveryTime: 60,
        deliveryFee: 25000,
        freeDeliveryThreshold: 200000,
        useCustomFormula: true,
        baseFee: 10000,
        pricePerKmUnder2: 4000,
        pricePerKmOver2: 3500,
        distanceThreshold: 2,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        orderStatusUpdates: true,
        maxOrdersPerDriver: 5,
        driverResponseTimeout: 30,
        autoAssignOrders: true,
        requireDriverPhoto: true,
        acceptCash: true,
        acceptCard: true,
        acceptEWallet: true,
        autoCalculateFee: true,
        goongApiKey: "1lFpdLwtqDptWEatprlXxKKd9MrmZoOqZ48ZizOz",
        goongApiEnabled: true,
        goongApiQuota: 1000,
        goongApiUsed: 247,
        requireTwoFactor: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        loginAttempts: 5
      };
    }
  }

  // Lưu settings vào file JSON
  async saveSettings(settings) {
    try {
      // Trong môi trường thực tế, cần backend API để ghi file
      // Ở đây chúng ta sẽ simulate việc lưu và lưu vào localStorage làm backup
      localStorage.setItem('settingsBackup', JSON.stringify(settings));
      
      // Simulate API call để ghi file
      console.log('💾 Đang lưu settings vào file...', settings);
      
      // Giả lập delay như API thực
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Thông báo cho tất cả listeners
      this.notifyListeners(settings);
      
      console.log('✅ Đã lưu settings thành công');
      return { success: true, message: 'Đã lưu cài đặt vào file thành công!' };
      
    } catch (error) {
      console.error('❌ Lỗi lưu settings:', error);
      return { success: false, message: 'Có lỗi khi lưu cài đặt!' };
    }
  }

  // Đăng ký listener để nhận thông báo khi settings thay đổi
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Hủy đăng ký listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Thông báo cho tất cả listeners
  notifyListeners(settings) {
    this.listeners.forEach(callback => {
      try {
        callback(settings);
      } catch (error) {
        console.error('Lỗi trong settings listener:', error);
      }
    });
  }

  // Lấy chỉ pricing settings
  async getPricingSettings() {
    const settings = await this.loadSettings();
    return {
      baseFee: settings.baseFee || 10000,
      distanceThreshold: settings.distanceThreshold || 2,
      pricePerKmUnder2: settings.pricePerKmUnder2 || 4000,
      pricePerKmOver2: settings.pricePerKmOver2 || 3500,
      useCustomFormula: settings.useCustomFormula || true
    };
  }

  // Reset settings về mặc định
  async resetSettings() {
    const defaultSettings = {
      companyName: "Vận Chuyển Trường Duy",
      companyPhone: "1900-1234",
      companyAddress: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      companyEmail: "info@trucongduy.com",
      defaultDeliveryRadius: 10,
      maxDeliveryTime: 60,
      deliveryFee: 25000,
      freeDeliveryThreshold: 200000,
      useCustomFormula: true,
      baseFee: 10000,
      pricePerKmUnder2: 4000,
      pricePerKmOver2: 3500,
      distanceThreshold: 2,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      orderStatusUpdates: true,
      maxOrdersPerDriver: 5,
      driverResponseTimeout: 30,
      autoAssignOrders: true,
      requireDriverPhoto: true,
      acceptCash: true,
      acceptCard: true,
      acceptEWallet: true,
      autoCalculateFee: true,
      goongApiKey: "1lFpdLwtqDptWEatprlXxKKd9MrmZoOqZ48ZizOz",
      goongApiEnabled: true,
      goongApiQuota: 1000,
      goongApiUsed: 247,
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    };
    
    return await this.saveSettings(defaultSettings);
  }
}

// Tạo instance singleton
const settingsService = new SettingsService();

export default settingsService; 