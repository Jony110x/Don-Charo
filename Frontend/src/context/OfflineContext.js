import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getConnectionDetector } from '../utils/connectionDetector';
import { initDB, countVentasPendientes } from '../utils/indexedDB';
import { syncPendingData, syncProductos } from '../utils/syncManager';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline debe usarse dentro de OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ventasPendientes, setVentasPendientes] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productosProgress, setProductosProgress] = useState({ current: 0, total: 0 });
  
  // ✅ NUEVO: useRef para tener el estado más actualizado en callbacks
  const isOnlineRef = useRef(isOnline);

  // Actualizar ref cuando cambia el estado
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Inicializar IndexedDB al montar
  useEffect(() => {
    const inicializarSistema = async () => {
      try {
        await initDB();
        console.log('✅ IndexedDB inicializada desde Context');
        
        // Contar ventas pendientes solo si hay usuario CAJERO
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.rol === 'CAJERO' || user.rol === 'cajero') {
          await updateVentasPendientes();
        }
      } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
      }
    };
    
    inicializarSistema();
  }, []);

  // Actualizar contador de ventas pendientes
  const updateVentasPendientes = useCallback(async () => {
    try {
      const count = await countVentasPendientes();
      setVentasPendientes(count);
      return count;
    } catch (error) {
      console.error('Error contando ventas pendientes:', error);
      return 0;
    }
  }, []);

  // ✅ MEJORADO: Función de sincronización que usa ref en vez de state
  const triggerSync = useCallback(async () => {
    // ✅ USAR REF en vez de state para tener el valor más actualizado
    if (!isOnlineRef.current || isSyncing) {
      console.log(`⚠️ No se puede sincronizar: ${!isOnlineRef.current ? 'offline' : 'ya sincronizando'}`);
      return { success: false, reason: 'offline_or_syncing' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      console.log('🔄 Iniciando sincronización...');
      const result = await syncPendingData();
      
      if (result.success) {
        setLastSyncTime(Date.now());
        await updateVentasPendientes();
        console.log('✅ Sincronización completada exitosamente');
      } else {
        setSyncError(result.error || 'Error desconocido');
        console.error('❌ Error en sincronización:', result.error);
      }

      return result;
    } catch (error) {
      console.error('❌ Error durante sincronización:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateVentasPendientes]); // ✅ Ya no depende de isOnline

  // ✅ MEJORADO: Escuchar cambios de conexión
  useEffect(() => {
    const detector = getConnectionDetector();
    let prevOnlineState = isOnline;
    let syncTimeoutId = null;
    
    const unsubscribe = detector.subscribe((status, online) => {
      console.log(`🌐 Estado de conexión: ${status} (previo: ${prevOnlineState ? 'online' : 'offline'}, nuevo: ${online ? 'online' : 'offline'})`);
      
      // Actualizar estado inmediatamente
      setIsOnline(online);
      isOnlineRef.current = online; // ✅ ACTUALIZAR REF INMEDIATAMENTE

      // ✅ CLAVE: Solo sincronizar si cambió de offline a online
      if (!prevOnlineState && online && status === 'online') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.rol === 'CAJERO' || user.rol === 'cajero') {
          console.log('✅ Conexión restaurada - Auto-sincronizando en 3 segundos...');
          
          // Limpiar timeout previo si existe
          if (syncTimeoutId) {
            clearTimeout(syncTimeoutId);
          }
          
          syncTimeoutId = setTimeout(() => {
            console.log('🔄 Ejecutando auto-sincronización...');
            triggerSync();
          }, 3000); // 3 segundos para asegurar conexión estable
        }
      }
      
      // Actualizar referencia del estado previo
      prevOnlineState = online;
    });

    return () => {
      unsubscribe();
      if (syncTimeoutId) {
        clearTimeout(syncTimeoutId);
      }
    };
  }, [triggerSync]);

  // Actualizar ventas pendientes periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.rol === 'CAJERO' || user.rol === 'cajero') {
        updateVentasPendientes();
      }
    }, 10000); // Cada 10 segundos

    return () => clearInterval(interval);
  }, [updateVentasPendientes]);

  // Función para precargar productos (solo CAJERO)
  const precargarProductos = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'CAJERO' && user.rol !== 'cajero') {
      console.log('⏭️ Precarga solo disponible para CAJERO');
      return { success: false, message: 'No disponible para este rol' };
    }

    if (!isOnlineRef.current) {
      console.log('⏭️ Precarga requiere conexión');
      return { success: false, message: 'Sin conexión' };
    }

    try {
      setIsLoadingProducts(true);
      console.log('🔄 Precargando productos para CAJERO...');
      
      await syncProductos((current, total) => {
        setProductosProgress({ current, total });
      });
      
      console.log('✅ Productos precargados exitosamente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error precargando productos:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoadingProducts(false);
      setProductosProgress({ current: 0, total: 0 });
    }
  }, []);

  const value = {
    isOnline,
    isSyncing,
    ventasPendientes,
    lastSyncTime,
    syncError,
    isLoadingProducts,
    productosProgress,
    triggerSync,
    updateVentasPendientes,
    precargarProductos
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export default OfflineContext;