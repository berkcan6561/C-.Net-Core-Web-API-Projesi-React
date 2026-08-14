import axios from 'axios';
import toast from 'react-hot-toast';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // HttpOnly Cookie (refresh token) için 
});

// ─── Request Interceptor: Her isteğe JWT token ve CSRF token ekle ────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CSRF token'ı cookie'den oku ve header'a ekle
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    if (csrfToken) {
      config.headers['X-CSRF-TOKEN'] = decodeURIComponent(csrfToken);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Refresh Token mekanizması ────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Response Interceptor ────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 geldi ve bu istek daha önce retry edilmedi ve refresh isteğinin kendisi değil
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/Auth/refresh-token')
    ) {
      if (isRefreshing) {
        // Başka bir istek zaten refresh yapıyor, sıraya al
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token HttpOnly Cookie üzerinden otomatik gönderiliyor
        const response = await axiosInstance.post('/Auth/refresh-token');
        const newToken = response.data.token;

        // Yeni token'ı kaydet
        sessionStorage.setItem('token', newToken);

        // Kullanıcı bilgilerini güncelle
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
          user.role = response.data.role;
          user.fullName = response.data.fullName;
          sessionStorage.setItem('user', JSON.stringify(user));
        }

        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh de başarısız olduysa oturumu sonlandır
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 429) {
      toast.error('Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.', {
        duration: 5000,
      });
      error.response.data =
        'Çok fazla işlem yaptınız. Güvenlik nedeniyle lütfen biraz bekleyip daha sonra tekrar deneyin.';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;