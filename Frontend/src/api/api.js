import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
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

// Auth
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getCurrentUser = () => api.get('/auth/me');

// Productos
export const getProductos = () => api.get('/productos/');
export const getProducto = (id) => api.get(`/productos/${id}`);
export const createProducto = (data) => api.post('/productos/', data);
export const updateProducto = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProducto = (id) => api.delete(`/productos/${id}`);
export const getProductosStockBajo = () => api.get('/productos/stock/bajo');
export const getProductosStockCritico = () => api.get('/productos/stock/critico');
export const buscarPorCodigo = (codigo) => api.get(`/productos/buscar-codigo?codigo=${codigo}`);

// Ventas
export const getVentas = () => api.get('/ventas/');
export const getVenta = (id) => api.get(`/ventas/${id}`);
export const createVenta = (data) => api.post('/ventas/', data);

// Reportes
export const getDashboard = () => api.get('/reportes/dashboard'); // Endpoint original (para otros usos)
export const getDashboardHoy = () => api.get('/reportes/dashboard-hoy'); // NUEVO: Solo datos de hoy
export const getVentasMensuales = () => api.get('/reportes/ventas/mensuales');
export const getProductosRentabilidad = () => api.get('/reportes/productos/rentabilidad');

// Cotizaciones desde APIs oficiales con cache de 30 minutos
export const getCotizaciones = async () => {
  const CACHE_KEY = 'cotizaciones_oficial';
  const CACHE_TIME_KEY = 'cotizaciones_oficial_time';
  const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

  try {
    // Verificar cache
    const cachedRates = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedRates && cachedTime) {
      const timeSinceCache = Date.now() - parseInt(cachedTime);
      if (timeSinceCache < CACHE_DURATION) {
        console.log('✅ Usando cotizaciones en cache');
        return JSON.parse(cachedRates);
      }
    }

    console.log('🔄 Actualizando cotizaciones...');

    // Obtener cotizaciones en paralelo
    const [dolarData, realData] = await Promise.all([
      // Dólar oficial de DolarAPI (más confiable que BCRA API)
      axios.get('https://dolarapi.com/v1/dolares/oficial'),
      // Real brasileño
      axios.get('https://dolarapi.com/v1/cotizaciones/brl')
    ]);

    // Calcular promedio entre compra y venta para dólar
    const dolarCompra = parseFloat(dolarData.data.compra);
    const dolarVenta = parseFloat(dolarData.data.venta);
    const dolarPromedio = (dolarCompra + dolarVenta) / 2;

    // Calcular promedio para real
    const realCompra = parseFloat(realData.data.compra);
    const realVenta = parseFloat(realData.data.venta);
    const realPromedio = (realCompra + realVenta) / 2;

    // Como los precios están en ARS, necesitamos la tasa de conversión
    // 1 ARS = X USD (invertimos el valor)
    const rates = {
      USD: 1 / dolarPromedio, // Cuántos USD por 1 ARS
      BRL: 1 / realPromedio,  // Cuántos BRL por 1 ARS
      dolarCompra: dolarCompra,
      dolarVenta: dolarVenta,
      dolarPromedio: dolarPromedio,
      realCompra: realCompra,
      realVenta: realVenta,
      realPromedio: realPromedio,
      timestamp: Date.now(),
      fecha: new Date().toLocaleString('es-AR')
    };

    // Guardar en cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

    console.log('✅ Cotizaciones actualizadas:', {
      'Dólar Promedio': `$${dolarPromedio.toFixed(2)}`,
      'Real Promedio': `$${realPromedio.toFixed(2)}`
    });

    return rates;

  } catch (error) {
    console.error('❌ Error obteniendo cotizaciones:', error.message);
    
    // Intentar usar cache aunque haya expirado
    const cachedRates = localStorage.getItem(CACHE_KEY);
    if (cachedRates) {
      console.log('⚠️ Usando cotizaciones en cache (expiradas)');
      return JSON.parse(cachedRates);
    }
    
    // Valores por defecto (aproximados a diciembre 2024)
    console.log('⚠️ Usando valores por defecto');
    return { 
      USD: 1 / 1050,  // ~$1050 por dólar
      BRL: 1 / 210,   // ~$210 por real
      dolarPromedio: 1050,
      realPromedio: 210,
      timestamp: Date.now(),
      error: true
    };
  }
};

export const getVentasPorPeriodo = (periodo) => api.get(`/reportes/ventas-por-periodo?periodo=${periodo}`);
export const getCategoriasVendidas = (limite = 10) => api.get(`/reportes/categorias-mas-vendidas?limite=${limite}`);
export const getProductosVendidos = (limite = 10) => api.get(`/reportes/productos-mas-vendidos?limite=${limite}`);
export const getVentasPorHorario = () => api.get('/reportes/ventas-por-horario');
export const getVentasPorHorarioFecha = (fecha) => api.get(`/reportes/ventas-por-horario-fecha${fecha ? `?fecha=${fecha}` : ''}`);
export const getGanancias = (periodo) => api.get(`/reportes/ganancias?periodo=${periodo}`);
export const getMetodosPago = () => api.get('/reportes/metodos-pago');

export default api;