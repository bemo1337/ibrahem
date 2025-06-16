import axios, { AxiosHeaders } from 'axios';

// Configure base Axios settings
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to build API URLs
const buildUrl = (path: string) => {
  // Remove any leading slashes to prevent double slashes
  const cleanPath = path.replace(/^\/+/, '');
  return `/${cleanPath}`;
};

// Add request interceptor to attach token to requests
api.interceptors.request.use(
  (config) => {
    // Only run this in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        // Ensure headers are properly initialized
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        // Add the token to the Authorization header
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// خدمات المصادقة
export const authService = {
  // تسجيل مستخدم جديد
  register: async (userData: any) => {
    return api.post('/users/register', userData);
  },
  
  // تسجيل الدخول للمستخدم
  login: async (credentials: { email: string; password: string }) => {
    return api.post('/auth/login', credentials);
  },
  
  // التحقق من حالة المصادقة
  checkAuth: async () => {
    return api.get('/users/dashboard');
  },
};

// خدمات المستخدم
export const userService = {
  // الحصول على بيانات لوحة المعلومات
  getDashboard: async () => {
    return api.get('/users/dashboard');
  },
  
  // طلب خدمة
  requestService: async (serviceData: { serviceName: string }) => {
    return api.post('/users/request-service', serviceData);
  },
};

// خدمات مشتركة
export const sharedService = {
  // الحصول على جميع الخدمات النشطة
  getServices: async (page = 1, limit = 10) => {
    return api.get(`/shared/show-services?page=${page}&limit=${limit}`);
  },
};

// خدمات النقابة
export const unionService = {
  // الحصول على بيانات لوحة المعلومات للمدير
  getManagerDashboard: async () => {
    return api.get('/shared/dashboard');
  },
  
  // الحصول على طلبات التسجيل المعلقة
  getPendingRegistrations: async () => {
    return api.get('/shared/pending-registrations');
  },
  
  // الحصول على قائمة الخدمات
  getServices: async () => {
    return api.get('/shared/show-services');
  },
  
  // إنشاء خدمة جديدة
  createService: async (serviceData: { serviceName: string; description: string; requirements: string[] }) => {
    return api.post('/union/post-service', serviceData);
  },
  
  // الحصول على طلبات الخدمة
  getServiceRequests: async (status?: string, page = 1, limit = 10) => {
    try {
      let url = `/shared/service-requests?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      console.log('Fetching service requests from:', url);
      const response = await api.get(url);
      console.log('Raw service requests response:', response.data);
      
      // Transform the backend response to match frontend expectations
      const transformedResponse = {
        ...response,
        data: {
          ...response.data,
          // Map the data array to the expected format
          data: Array.isArray(response.data.data) ? 
            response.data.data.map((item: any) => ({
              ...item,
              // Ensure we have the required fields with fallbacks
              service: item.service || { serviceName: 'Unknown Service', description: '' },
              user: item.user || item.requestedBy || { fullName: 'Unknown User', email: '' },
              requestedAt: item.requestedAt || item.createdAt || new Date().toISOString(),
              status: item.status || 'pending'
            })) : []
        }
      };
      
      console.log('Transformed service requests:', transformedResponse.data);
      return transformedResponse;
    } catch (error) {
      console.error('Error in getServiceRequests:', error);
      throw error;
    }
  },
  
  // الموافقة على طلب خدمة
  approveServiceRequest: async (requestId: string) => {
    console.log(`[API] Approving service request with ID: ${requestId}`);
    try {
      const response = await api.patch(`/shared/approve-service-request/${requestId}`);
      console.log('[API] Approve service request response:', response.data);
      return response;
    } catch (error) {
      console.error('[API] Approve service request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      throw error;
    }
  },
  
  // رفض طلب خدمة
  rejectServiceRequest: async (requestId: string, reason?: string) => {
    console.log(`[API] Rejecting service request with ID: ${requestId}`, { reason });
    try {
      const response = await api.patch(`/shared/reject-service-request/${requestId}`, { reason });
      console.log('[API] Reject service request response:', response.data);
      return response;
    } catch (error) {
      console.error('[API] Reject service request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          data: error.config?.data
        }
      });
      throw error;
    }
  },
  
  // الموافقة على تسجيل مهندس
  approveEngineer: async (userId: string) => {
    return api.put(`/shared/approve-engineer/${userId}`);
  },
  
  // رفض تسجيل مهندس
  rejectEngineer: async (userId: string, reason?: string) => {
    return api.put(`/shared/reject-engineer/${userId}`, { reason });
  },
  
  // تفعيل/إلغاء تفعيل خدمة
  toggleServiceActive: async (serviceId: string) => {
    return api.patch(`/shared/services/${serviceId}/toggle-active`);
  },

  // الحصول على إحصائيات
  getStats: async () => {
    return api.get('/shared/stats');
  }
};

export default api;
