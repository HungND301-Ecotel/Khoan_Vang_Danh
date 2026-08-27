import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_BASE_API || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const handleAuthError = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (!error.response || error.response.status !== 401 || !originalRequest) {
            return Promise.reject(error);
        }

        // Avoid infinite loop for login or refresh token endpoint errors
        const isAuthEndpoint =
            originalRequest.url?.includes('/auths/login') ||
            originalRequest.url?.includes('/auths/refresh-token');

        if (isAuthEndpoint || originalRequest._retry) {
            handleAuthError();
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            handleAuthError();
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({
                    resolve: (token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    },
                    reject: (err: any) => {
                        reject(err);
                    },
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const res = await axios.post(`${API_URL}/auths/refresh-token`, { refreshToken });
            const data = res.data?.data;
            const newToken = data?.token;
            const newRefreshToken = data?.refreshToken;

            if (!newToken) {
                throw new Error('No token returned from refresh token endpoint');
            }

            localStorage.setItem('token', newToken);
            if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
            }

            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            processQueue(null, newToken);
            return api(originalRequest);
        } catch (refreshErr) {
            processQueue(refreshErr, null);
            handleAuthError();
            return Promise.reject(refreshErr);
        } finally {
            isRefreshing = false;
        }
    }
);

export default api; 