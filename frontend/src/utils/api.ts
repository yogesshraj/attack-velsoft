const API_BASE_URL = 'http://localhost:3000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  
  let url = endpoint;
  
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

export const api = {
  get: <T>(endpoint: string, options: RequestOptions = {}) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  put: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
  patch: <T>(endpoint: string, data: unknown, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    
  delete: <T>(endpoint: string, options: RequestOptions = {}) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}; 