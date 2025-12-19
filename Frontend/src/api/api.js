import axios from 'axios';
import { isOnline } from '../utils/connectionDetector';
import { 
  getAllProductos, 
  searchProductos, 
  getProductoByCodigo,
  saveProductos,
  // eslint-disable-next-line no-unused-vars
  updateProductoStock
} from '../utils/indexedDB';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Configuración base de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de autenticación y redirigir al login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Sesión expirada o no autorizado');
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTENTICACIÓN ====================

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');

// ==================== PRODUCTOS ====================

// Obtiene lista de productos con soporte offline, paginación y filtros
export const getProductos = async (params = {}) => {
  // Modo offline: usar IndexedDB
  if (!isOnline()) {
    try {
      const productos = params.busqueda 
        ? await searchProductos(params.busqueda)
        : await getAllProductos();
      
      const skip = params.skip || 0;
      const limit = params.limit || 50;
      const productosPaginados = productos.slice(skip, skip + limit);
      
      return {
        data: {
          productos: productosPaginados,
          total: productos.length,
          has_more: (skip + limit) < productos.length
        }
      };
    } catch (error) {
      console.error('Error obteniendo productos offline:', error);
      throw error;
    }
  }
  
  // Modo online: consultar API
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params.limit !== undefined) queryParams.append('limit', params.limit);
  if (params.busqueda) queryParams.append('busqueda', params.busqueda);
  if (params.categoria && params.categoria !== 'todas') queryParams.append('categoria', params.categoria);
  if (params.estado_stock && params.estado_stock !== 'todos') queryParams.append('estado_stock', params.estado_stock);
  
  const response = await api.get(`/productos/?${queryParams.toString()}`);
  
  // Guardar productos en cache local
  if (response.data.productos) {
    await saveProductos(response.data.productos);
  }
  
  return response;
};

export const getCategorias = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params.limit !== undefined) queryParams.append('limit', params.limit);
  if (params.busqueda) queryParams.append('busqueda', params.busqueda);
  return api.get(`/productos/categorias?${queryParams.toString()}`);
};

export const getProducto = (id) => api.get(`/productos/${id}`);
export const createProducto = (data) => api.post('/productos/', data);
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProducto = (id) => api.delete(`/productos/${id}`);

export const getProductosStockBajo = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params.limit !== undefined) queryParams.append('limit', params.limit);
  return api.get(`/productos/stock/bajo?${queryParams.toString()}`);
};

export const getProductosStockCritico = (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.skip !== undefined) queryParams.append('skip', params.skip);
  if (params.limit !== undefined) queryParams.append('limit', params.limit);
  return api.get(`/productos/stock/critico?${queryParams.toString()}`);
};

// Busca un producto por código de barras con soporte offline
export const buscarPorCodigo = async (codigo) => {
  // Modo offline: buscar en IndexedDB
  if (!isOnline()) {
    const producto = await getProductoByCodigo(codigo);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }
    return { data: producto };
  }
  
  // Modo online: consultar API
  return api.get(`/productos/buscar-codigo?codigo=${codigo}`);
};

// ==================== VENTAS ====================

export const getVentas = () => api.get('/ventas/');
export const getVenta = (id) => api.get(`/ventas/${id}`);
export const createVenta = (data) => api.post('/ventas/', data);

// ==================== REPORTES ====================

export const getDashboard = () => api.get('/reportes/dashboard');
export const getDashboardHoy = () => api.get('/reportes/dashboard-hoy');
export const getVentasMensuales = () => api.get('/reportes/ventas/mensuales');
export const getProductosRentabilidad = () => api.get('/reportes/productos/rentabilidad');

export const getVentasPorPeriodo = (periodo) => 
  api.get(`/reportes/ventas-por-periodo?periodo=${periodo}`);

export const getCategoriasVendidas = (limite = 10) => 
  api.get(`/reportes/categorias-mas-vendidas?limite=${limite}`);

export const getProductosVendidos = (limite = 10) => 
  api.get(`/reportes/productos-mas-vendidos?limite=${limite}`);

export const getVentasPorHorario = () => api.get('/reportes/ventas-por-horario');

export const getVentasPorHorarioFecha = (fecha) => 
  api.get(`/reportes/ventas-por-horario-fecha?fecha=${fecha}`);

export const getGanancias = (periodo) => 
  api.get(`/reportes/ganancias?periodo=${periodo}`);

export const getMetodosPago = () => api.get('/reportes/metodos-pago');

// ==================== PERFIL DE USUARIO ====================

export const getUserProfile = () => api.get('/user/profile');
export const updateUserProfile = (data) => api.put('/user/profile', data);

// ==================== ADMINISTRACIÓN DE USUARIOS (SUPERADMIN) ====================

export const getAllUsers = (params) => api.get('/users/', { params });
export const getUserById = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users/', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// ==================== COTIZACIONES ====================

// Obtiene cotizaciones de USD y BRL con cache de 30 minutos
export const getCotizaciones = async () => {
  const CACHE_KEY = 'cotizaciones_oficial';
  const CACHE_TIME_KEY = 'cotizaciones_oficial_time';
  const CACHE_DURATION = 30 * 60 * 1000;

  try {
    // Verificar si hay datos en cache válidos
    const cachedRates = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedRates && cachedTime) {
      const timeSinceCache = Date.now() - parseInt(cachedTime);
      if (timeSinceCache < CACHE_DURATION) {
        return JSON.parse(cachedRates);
      }
    }

    // Obtener cotizaciones actualizadas en paralelo
    const [dolarData, realData] = await Promise.all([
      axios.get('https://dolarapi.com/v1/dolares/oficial'),
      axios.get('https://dolarapi.com/v1/cotizaciones/brl')
    ]);

    // Calcular promedios de compra y venta
    const dolarCompra = parseFloat(dolarData.data.compra);
    const dolarVenta = parseFloat(dolarData.data.venta);
    const dolarPromedio = (dolarCompra + dolarVenta) / 2;

    const realCompra = parseFloat(realData.data.compra);
    const realVenta = parseFloat(realData.data.venta);
    const realPromedio = (realCompra + realVenta) / 2;

    // Construir objeto de respuesta
    const rates = {
      USD: 1 / dolarPromedio,
      BRL: 1 / realPromedio,
      dolarCompra,
      dolarVenta,
      dolarPromedio,
      realCompra,
      realVenta,
      realPromedio,
      timestamp: Date.now(),
      fecha: new Date().toLocaleString('es-AR')
    };

    // Guardar en cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    
    return rates;

  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error.message);
    
    // Intentar usar cache expirado como fallback
    const cachedRates = localStorage.getItem(CACHE_KEY);
    if (cachedRates) {
      return JSON.parse(cachedRates);
    }
    
    // Último recurso: valores por defecto
    return { 
      USD: 1 / 1050,
      BRL: 1 / 210,
      dolarPromedio: 1050,
      realPromedio: 210,
      timestamp: Date.now(),
      error: true
    };
  }
};

export default api;