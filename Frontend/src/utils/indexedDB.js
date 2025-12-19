/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable no-loop-func */

const DB_NAME = 'POS_DonCharo';
const DB_VERSION = 1;

// Stores (tablas)
const STORES = {
  PRODUCTOS: 'productos',
  VENTAS_PENDIENTES: 'ventas_pendientes',
  CONFIG: 'config'
};

// Inicializar la base de datos
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error abriendo IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store de productos
      if (!db.objectStoreNames.contains(STORES.PRODUCTOS)) {
        const productosStore = db.createObjectStore(STORES.PRODUCTOS, { keyPath: 'id' });
        productosStore.createIndex('codigo_barras', 'codigo_barras', { unique: false });
        productosStore.createIndex('categoria', 'categoria', { unique: false });
        productosStore.createIndex('nombre', 'nombre', { unique: false });
      }

      // Store de ventas pendientes
      if (!db.objectStoreNames.contains(STORES.VENTAS_PENDIENTES)) {
        db.createObjectStore(STORES.VENTAS_PENDIENTES, { keyPath: 'id', autoIncrement: true });
      }

      // Store de configuración
      if (!db.objectStoreNames.contains(STORES.CONFIG)) {
        db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      }
    };
  });
};

// Obtener conexión a la DB
const getDB = async () => {
  return await initDB();
};

// ==================== PRODUCTOS ====================

// Guardar todos los productos
export const saveProductos = async (productos) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.PRODUCTOS], 'readwrite');
    const store = transaction.objectStore(STORES.PRODUCTOS);

    // Limpiar productos antiguos
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Guardar nuevos productos
    for (const producto of productos) {
      await new Promise((resolve, reject) => {
        const putRequest = store.put(producto);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    }
    
    // Guardar timestamp de última sincronización
    await setConfig('last_productos_sync', Date.now());
    
    return true;
  } catch (error) {
    console.error(' Error guardando productos:', error);
    return false;
  }
};

// Obtener todos los productos
export const getAllProductos = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.PRODUCTOS], 'readonly');
    const store = transaction.objectStore(STORES.PRODUCTOS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const productos = request.result || [];
        resolve(productos);
      };
      
      request.onerror = () => {
        console.error('Error obteniendo productos:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(' Error obteniendo productos:', error);
    return [];
  }
};

// Buscar productos por texto
export const searchProductos = async (busqueda) => {
  try {
    const productos = await getAllProductos();
    const terminoBusqueda = busqueda.toLowerCase().trim();
    
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(terminoBusqueda) ||
      (p.categoria && p.categoria.toLowerCase().includes(terminoBusqueda)) ||
      (p.codigo_barras && p.codigo_barras.includes(terminoBusqueda))
    );
  } catch (error) {
    console.error(' Error buscando productos:', error);
    return [];
  }
};

// Buscar producto por código de barras
export const getProductoByCodigo = async (codigo) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.PRODUCTOS], 'readonly');
    const store = transaction.objectStore(STORES.PRODUCTOS);
    const index = store.index('codigo_barras');
    
    return new Promise((resolve, reject) => {
      const request = index.get(codigo);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        console.error('Error buscando por código:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(' Error buscando por código:', error);
    return null;
  }
};

// Actualizar stock local de un producto
export const updateProductoStock = async (productoId, nuevoStock) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.PRODUCTOS], 'readwrite');
    const store = transaction.objectStore(STORES.PRODUCTOS);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(productoId);
      
      getRequest.onsuccess = () => {
        const producto = getRequest.result;
        if (producto) {
          producto.stock = nuevoStock;
          const putRequest = store.put(producto);
          
          putRequest.onsuccess = () => {
            resolve(true);
          };
          
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          resolve(false);
        }
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error(' Error actualizando stock:', error);
    return false;
  }
};

// ==================== VENTAS PENDIENTES ====================

// Guardar venta pendiente
export const saveVentaPendiente = async (ventaData) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);
    
    const venta = {
      ...ventaData,
      timestamp: Date.now(),
      sincronizada: false
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(venta);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('Error guardando venta pendiente:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(' Error guardando venta pendiente:', error);
    throw error;
  }
};

// Obtener todas las ventas pendientes
export const getVentasPendientes = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readonly');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const ventas = request.result || [];
        const ventasPendientes = ventas.filter(v => !v.sincronizada);
        resolve(ventasPendientes);
      };
      
      request.onerror = () => {
        console.error('Error obteniendo ventas pendientes:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(' Error obteniendo ventas pendientes:', error);
    return [];
  }
};

// Marcar venta como sincronizada
export const markVentaSincronizada = async (ventaId) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(ventaId);
      
      getRequest.onsuccess = () => {
        const venta = getRequest.result;
        if (venta) {
          venta.sincronizada = true;
          venta.fecha_sincronizacion = Date.now();
          
          const putRequest = store.put(venta);
          
          putRequest.onsuccess = () => {
            resolve(true);
          };
          
          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          resolve(false);
        }
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error(' Error marcando venta sincronizada:', error);
    return false;
  }
};

// Eliminar ventas sincronizadas antiguas
export const cleanSyncedVentas = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);
    
    return new Promise((resolve, reject) => {
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = async () => {
        const ventas = getAllRequest.result || [];
        const ahoraMenos7Dias = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        let eliminadas = 0;
        for (const venta of ventas) {
          if (venta.sincronizada && venta.fecha_sincronizacion < ahoraMenos7Dias) {
            await new Promise((res, rej) => {
              const deleteRequest = store.delete(venta.id);
              deleteRequest.onsuccess = () => {
                eliminadas++;
                res();
              };
              deleteRequest.onerror = () => rej(deleteRequest.error);
            });
          }
        }
        
        resolve(eliminadas);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    });
  } catch (error) {
    console.error(' Error limpiando ventas:', error);
    return 0;
  }
};

// Contar ventas pendientes
export const countVentasPendientes = async () => {
  try {
    const ventas = await getVentasPendientes();
    return ventas.length;
  } catch (error) {
    console.error(' Error contando ventas pendientes:', error);
    return 0;
  }
};

// ==================== CONFIGURACIÓN ====================

// Guardar configuración
export const setConfig = async (key, value) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.CONFIG], 'readwrite');
    const store = transaction.objectStore(STORES.CONFIG);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(' Error guardando config:', error);
    return false;
  }
};

// Obtener configuración
export const getConfig = async (key) => {
  try {
    const db = await getDB();
    const transaction = db.transaction([STORES.CONFIG], 'readonly');
    const store = transaction.objectStore(STORES.CONFIG);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const config = request.result;
        resolve(config ? config.value : null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(' Error obteniendo config:', error);
    return null;
  }
};

// Limpiar toda la base de datos (para testing o reset)
export const clearAllData = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction(
      [STORES.PRODUCTOS, STORES.VENTAS_PENDIENTES, STORES.CONFIG],
      'readwrite'
    );
    
    await transaction.objectStore(STORES.PRODUCTOS).clear();
    await transaction.objectStore(STORES.VENTAS_PENDIENTES).clear();
    await transaction.objectStore(STORES.CONFIG).clear();
    
    return true;
  } catch (error) {
    console.error(' Error limpiando base de datos:', error);
    return false;
  }
};

export async function countProductos() {
  const db = await getDB();
  const tx = db.transaction('productos', 'readonly');
  const store = tx.objectStore('productos');
  const count = await store.count();
  return count;
}

export default {
  initDB,
  saveProductos,
  getAllProductos,
  searchProductos,
  getProductoByCodigo,
  updateProductoStock,
  saveVentaPendiente,
  getVentasPendientes,
  markVentaSincronizada,
  cleanSyncedVentas,
  countVentasPendientes,
  setConfig,
  getConfig,
  clearAllData
};