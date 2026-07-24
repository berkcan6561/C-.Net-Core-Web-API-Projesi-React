import axios from 'axios';

const axiosInstance = axios.create({
 baseURL: 'http://localhost:5184/api',
  headers:{
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');

  if(token){
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
  }, (error) => {
    return Promise.reject(error);
  });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      error.response.data = 'Çok fazla işlem yaptınız. Güvenlik nedeniyle lütfen biraz bekleyip daha sonra tekrar deneyin.';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;