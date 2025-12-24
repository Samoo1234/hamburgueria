import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adicionar token de autenticação se existir no localStorage
const token = localStorage.getItem('garcomToken');
if (token) {
  api.defaults.headers.common['x-auth-token'] = token;
}

// Adicionar interceptor para atualizar o token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('garcomToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('garcomToken');
      localStorage.removeItem('garcomUser');
      // Redirecionar para login se necessário
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;