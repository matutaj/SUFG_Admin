import axios from 'axios';

const api = axios.create({
  baseURL: 'https://9c02-102-214-36-199.ngrok-free.app', // Sua URL base
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
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
