// src/lib/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiResponse<unknown>;
    if (envelope && typeof envelope === "object" && "success" in envelope) {
      if (!envelope.success) {
        return Promise.reject(envelope.error || new Error("API request failed"));
      }
      return envelope.data as any;
    }
    return response.data;
  },
  async (error: AxiosError<ApiResponse<null>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<ApiResponse<{ access_token: string; refresh_token: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        if (data.success && data.data) {
          const { access_token, refresh_token: newRefreshToken } = data.data;
          useAuthStore.getState().setTokens(access_token, newRefreshToken);

          processQueue(null, access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError = error.response?.data?.error;
    if (apiError) {
      return Promise.reject(new Error(apiError.message || "An unexpected error occurred"));
    }

    return Promise.reject(error);
  }
);