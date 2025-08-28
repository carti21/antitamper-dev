import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { UserSearchParams, FactorySearchParams, DeviceDataSearchParams, DeviceData } from './types/search';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() < expirationTime;
  } catch {
    return false;
  }
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      if (isTokenValid(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token is invalid or expired
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('auth-error'));
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as any;
    if (
      data?.success === false &&
      data?.message === "Could not verify user" &&
      data?.results?.force_logout === true
    ) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth-error'));
    }

    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token && isTokenValid(token)) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }
};

// Initialize token from localStorage
const token = localStorage.getItem('authToken');
if (token && isTokenValid(token)) {
  setAuthToken(token);
} else if (token) {
  localStorage.removeItem('authToken');
}

// Search functions
export const searchUsers = async (params: UserSearchParams) => {
  const response = await apiClient.get('/users/search', { params });
  return response.data;
};

export const searchFactories = async (params: FactorySearchParams) => {
  const response = await apiClient.get('/factories/search', { params });
  return response.data;
};

export const searchDeviceData = async (params: DeviceDataSearchParams) => {
  const response = await apiClient.get<{
    docs: DeviceData[];
    totalDocs: number;
    offset: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
  }>('/data/search', { params });
  return response.data;
};

export default apiClient;