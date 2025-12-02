import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Productos
export const getProductos = () => api.get('/productos/');
export const getProducto = (id) => api.get(`/productos/${id}`);
export const createProducto = (data) => api.post('/productos/', data);
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProducto = (id) => api.delete(`/productos/${id}`);
export const getProductosStockBajo = () => api.get('/productos/stock/bajo');

// Ventas
export const getVentas = () => api.get('/ventas/');
export const getVenta = (id) => api.get(`/ventas/${id}`);
export const createVenta = (data) => api.post('/ventas/', data);

// Reportes
export const getDashboard = () => api.get('/reportes/dashboard');
export const getVentasMensuales = () => api.get('/reportes/ventas/mensuales');

export default api;