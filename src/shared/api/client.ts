'use client';

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Inject auth token from cookie on every request
apiClient.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
    if (match) {
      config.headers['Authorization'] = `Bearer ${decodeURIComponent(match[1])}`;
    }
  }
  return config;
});

// Normalise error shape
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ??
      err.response?.data?.message ??
      err.message ??
      'Request failed';
    return Promise.reject(new ApiError(err.response?.status ?? 0, message, err.response?.data));
  }
);

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
