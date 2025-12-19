/* eslint-disable import/no-anonymous-default-export */
import { 
  getVentasPendientes, 
  markVentaSincronizada, 
  getAllProductos, 
  saveProductos,
} from './indexedDB';
import api from '../api/api';

const BATCH_SIZE = 500; 
const MAX_PARALLEL_BATCHES = 3; 

export const syncPendingData = async () => {
  const result = {
    success: false,
    ventasSincronizadas: 0,
    errores: [],
    productosSincronizados: false
  };

  try {
    //  Obtener ventas pendientes
    const ventasPendientes = await getVentasPendientes();

    if (ventasPendientes.length === 0) {
      result.success = true;
      return result;
    }

    //  Sincronizar cada venta
    for (const venta of ventasPendientes) {
      try {
        // Preparar datos de venta para el servidor
        const ventaData = {
          items: venta.items,
          metodo_pago: venta.metodo_pago,
          observaciones: `Venta offline - Sincronizada el ${new Date().toLocaleString()}`
        };

        // Enviar al servidor
        const response = await api.post('/ventas/', ventaData);
        
        if (response.status === 200 || response.status === 201) {
          //  Marcar como sincronizada usando TU función
          await markVentaSincronizada(venta.id);
          result.ventasSincronizadas++;
        } else {
          throw new Error(`Status ${response.status}`);
        }
        
      } catch (error) {
        console.error(` Error sincronizando venta ${venta.id}:`, error);
        result.errores.push({
          ventaId: venta.id,
          error: error.message
        });
      }
    }

    //  Evaluar resultado
    if (result.errores.length === 0) {
      result.success = true;
    } else {
      result.success = result.ventasSincronizadas > 0;
    }

  } catch (error) {
    console.error(' Error general en sincronización:', error);
    result.error = error.message;
  }

  return result;
};

export const syncProductos = async (onProgress = null) => {
  
  try {
    // eslint-disable-next-line no-unused-vars
    const startTime = Date.now();
    let allProductos = [];
    let skip = 0;
    let hasMore = true;
    let totalSincronizados = 0;
    
    while (hasMore) {
      // Crear array de promesas para peticiones paralelas
      const batchPromises = [];
      
      for (let i = 0; i < MAX_PARALLEL_BATCHES; i++) {
        const currentSkip = skip + (i * BATCH_SIZE);
        
        batchPromises.push(
          api.get('/productos/', {
            params: {
              skip: currentSkip,
              limit: BATCH_SIZE
            }
          })
          .then(response => {
            const { productos, has_more } = response.data;
            return {
              productos: productos || [],
              hasMore: has_more,
              skip: currentSkip
            };
          })
          .catch(error => {
            console.error(`Error en batch ${currentSkip}:`, error);
            return { productos: [], hasMore: false, skip: currentSkip };
          })
        );
      }
      
      // Esperar a que todas las peticiones paralelas terminen
      const results = await Promise.all(batchPromises);
      
      // Procesar resultados
      let batchProductos = [];
      let anyHasMore = false;
      
      for (const result of results) {
        if (result.productos.length > 0) {
          batchProductos = batchProductos.concat(result.productos);
        }
        if (result.hasMore) {
          anyHasMore = true;
        }
      }
      
      // Si no hay más productos, salir
      if (batchProductos.length === 0) {
        hasMore = false;
        break;
      }
      
      // Agregar a la lista total
      allProductos = allProductos.concat(batchProductos);
      totalSincronizados = allProductos.length;
      skip += (MAX_PARALLEL_BATCHES * BATCH_SIZE);
      
      // Callback de progreso
      if (onProgress) {
        const estimatedTotal = anyHasMore ? totalSincronizados + BATCH_SIZE : totalSincronizados;
        onProgress(totalSincronizados, estimatedTotal);
      }
      
      // Si ningún batch tiene más datos, terminar
      if (!anyHasMore) {
        hasMore = false;
      }
      
      // Si el último batch tenía menos productos que el límite, no hay más
      if (batchProductos.length < (MAX_PARALLEL_BATCHES * BATCH_SIZE)) {
        hasMore = false;
      }
    }
    
    if (allProductos.length === 0) {
      console.warn(' No se recibieron productos del servidor');
      return false;
    }
    
    await saveProductos(allProductos); 
    
    // Callback final con total exacto
    if (onProgress) {
      onProgress(allProductos.length, allProductos.length);
    }
    
    return true;
  } catch (error) {
    console.error(' Error sincronizando productos:', error);
    throw error;
  }
};

/**
 * Forzar sincronización completa (manual)
 */
export const forceFullSync = async () => {
  
  try {
    // 1. Sincronizar ventas pendientes
    const ventasResult = await syncPendingData();
    
    // 2. Sincronizar productos frescos
    await syncProductos();
    
    return {
      success: true,
      ...ventasResult
    };
  } catch (error) {
    console.error(' Error en sincronización completa:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verificar si hay sincronización pendiente
 */
export const hasPendingSync = async () => {
  try {
    const ventasPendientes = await getVentasPendientes();
    return ventasPendientes.length > 0;
  } catch (error) {
    console.error('Error verificando sync pendiente:', error);
    return false;
  }
};

/**
 * Obtener estadísticas de sincronización
 */
export const getSyncStats = async () => {
  try {
    const ventasPendientes = await getVentasPendientes();
    const productos = await getAllProductos();
    
    return {
      ventasPendientes: ventasPendientes.length,
      productosEnCache: productos.length,
      ultimoProducto: productos[productos.length - 1]?.nombre || 'N/A'
    };
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    return {
      ventasPendientes: 0,
      productosEnCache: 0,
      ultimoProducto: 'Error'
    };
  }
};

export default {
  syncPendingData,
  syncProductos,
  forceFullSync,
  hasPendingSync,
  getSyncStats
};