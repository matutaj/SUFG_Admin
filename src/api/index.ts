import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333', // Sua URL base
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor para tratar erros de autenticação e permissão
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login'; // Redirecionar para a página de login
      return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
    } else if (error.response?.status === 403) {
      // Permissão ou função negada
      return Promise.reject(
        new Error('Você não tem permissão ou função necessária para realizar esta ação.'),
      );
    }
    return Promise.reject(error);
  },
);

export default api;
