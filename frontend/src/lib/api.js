const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const apiUrl = (path) => `${API_BASE_URL}${path}`;

export const apiFetch = (path, options = {}) => (
  fetch(apiUrl(path), {
    credentials: 'include',
    ...options
  })
);

export const assetUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiUrl(normalizedPath);
};
