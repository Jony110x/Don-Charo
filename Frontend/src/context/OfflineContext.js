/* eslint-disable react-hooks/exhaustive-deps */
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
  // Estados principales
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ventasPendientes, setVentasPendientes] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productosProgress, setProductosProgress] = useState({ current: 0, total: 0 });
  
  // Ref para mantener estado actualizado en callbacks
  const isOnlineRef = useRef(isOnline);

  // Sincronizar ref con estado
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Inicializar IndexedDB al montar
  useEffect(() => {
    const inicializarSistema = async () => {
      try {
        await initDB();
        
        // Contar ventas pendientes solo para cajeros
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.rol === 'CAJERO' || user.rol === 'cajero') {
          await updateVentasPendientes();
        }
      } catch (error) {
        console.error('Error inicializando sistema:', error);
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

  // Sincronizar datos pendientes con el servidor
  const triggerSync = useCallback(async () => {
    // Usar ref para valor más actualizado
    if (!isOnlineRef.current || isSyncing) {
      console.log(`No se puede sincronizar: ${!isOnlineRef.current ? 'offline' : 'ya sincronizando'}`);
      return { success: false, reason: 'offline_or_syncing' };
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await syncPendingData();
      
      if (result.success) {
        setLastSyncTime(Date.now());
        await updateVentasPendientes();
      } else {
        setSyncError(result.error || 'Error desconocido');
        console.error('Error en sincronización:', result.error);
      }

      return result;
    } catch (error) {
      console.error('Error durante sincronización:', error);
      setSyncError(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updateVentasPendientes]);

  // Escuchar cambios de conexión y sincronizar automáticamente
  useEffect(() => {
    const detector = getConnectionDetector();
    let prevOnlineState = isOnline;
    let syncTimeoutId = null;
    
    const unsubscribe = detector.subscribe((status, online) => {
      
      // Actualizar estado y ref inmediatamente
      setIsOnline(online);
      isOnlineRef.current = online;

      // Sincronizar solo si cambió de offline a online
      if (!prevOnlineState && online && status === 'online') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (user.rol === 'CAJERO' || user.rol === 'cajero') {

          if (syncTimeoutId) clearTimeout(syncTimeoutId);

          syncTimeoutId = setTimeout(async () => {
            await triggerSync();
            await precargarProductosSiHaceFalta();
          }, 3000);
        }
      }
      
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
    }, 10000);

    return () => clearInterval(interval);
  }, [updateVentasPendientes]);

  // Precargar productos manualmente (solo cajeros)
  const precargarProductos = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.rol !== 'CAJERO' && user.rol !== 'cajero') {
      return { success: false, message: 'No disponible para este rol' };
    }

    if (!isOnlineRef.current) {
      return { success: false, message: 'Sin conexión' };
    }

    try {
      setIsLoadingProducts(true);
      
      await syncProductos((current, total) => {
        setProductosProgress({ current, total });
      });
      
      return { success: true };
      
    } catch (error) {
      console.error('Error precargando productos:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoadingProducts(false);
      setProductosProgress({ current: 0, total: 0 });
    }
  }, []);

  // Verificar y precargar productos si es necesario
  const precargarProductosSiHaceFalta = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.rol !== 'CAJERO' && user.rol !== 'cajero') {
      return;
    }

    if (!isOnlineRef.current) {
      return;
    }

    try {
      const { countProductos } = await import('../utils/indexedDB');
      const count = await countProductos();

      if (count === 0) {
        await precargarProductos();
      } 
    } catch (error) {
      console.error('Error verificando productos:', error);
    }
  }, [precargarProductos]);

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