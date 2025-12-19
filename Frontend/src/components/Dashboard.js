/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from 'react';
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { getDashboardHoy, getProductosStockBajo, getProductosStockCritico } from '../api/api';
import { useToast } from '../Toast';

const Dashboard = () => {
  const toast = useToast();
  
  // Estados principales
  const [stats, setStats] = useState({
    ganancia_hoy: 0,
    ventas_hoy: 0,
    cantidad_ventas_hoy: 0,
    productos_vendidos_hoy: 0,
    productos_stock_bajo: 0,
    productos_stock_critico: 0
  });
  const [productosStockBajo, setProductosStockBajo] = useState([]);
  const [productosStockCritico, setProductosStockCritico] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de paginación para stock bajo
  const [skipBajo, setSkipBajo] = useState(0);
  const [hasMoreBajo, setHasMoreBajo] = useState(true);
  const [totalBajo, setTotalBajo] = useState(0);
  const [loadingMoreBajo, setLoadingMoreBajo] = useState(false);
  const LIMIT_BAJO = 20;
  
  // Estados de paginación para stock crítico
  const [skipCritico, setSkipCritico] = useState(0);
  const [hasMoreCritico, setHasMoreCritico] = useState(true);
  const [totalCritico, setTotalCritico] = useState(0);
  const [loadingMoreCritico, setLoadingMoreCritico] = useState(false);
  const LIMIT_CRITICO = 20;
  
  // Estados de colapso - Mutuamente exclusivos - Crítico expandido por defecto
  const [criticoColapsado, setCriticoColapsado] = useState(false);
  const [bajoColapsado, setBajoColapsado] = useState(true);
  
  // Refs para Intersection Observer
  const observerBajoRef = useRef(null);
  const observerCriticoRef = useRef(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Carga inicial de estadísticas y productos con stock bajo/crítico
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const dashboardRes = await getDashboardHoy();
      setStats(dashboardRes.data);
      
      // Cargar ambos tipos de stock en paralelo
      await Promise.allSettled([
        cargarStockBajo(0, true),
        cargarStockCritico(0, true)
      ]).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Falló carga ${index === 0 ? 'stock bajo' : 'stock crítico'}:`, result.reason);
          }
        });
      });
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Carga productos con stock bajo con paginación
  const cargarStockBajo = async (skipValue, reset = false) => {
    const currentSkip = skipValue !== undefined ? skipValue : skipBajo;

    if (!hasMoreBajo && !reset) return;
    
    try {
      if (!reset) setLoadingMoreBajo(true);
      
      const response = await getProductosStockBajo({
        skip: currentSkip,
        limit: LIMIT_BAJO
      });
      
      const { productos, total, has_more } = response.data;
      
      if (reset) {
        setProductosStockBajo(productos || []);
        setSkipBajo(LIMIT_BAJO);
      } else {
        setProductosStockBajo(prev => [...prev, ...(productos || [])]);
        setSkipBajo(currentSkip + LIMIT_BAJO);
      }
      
      setTotalBajo(total || 0);
      setHasMoreBajo(has_more || false);
      
      // Toast solo en carga inicial
      if (reset && total > 0) {
        const mensaje = total === 1 
          ? '1 producto con stock bajo'
          : `${total} productos con stock bajo`;
        toast.warning(mensaje);
      }
      
    } catch (error) {
      console.error('Error cargando stock bajo:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingMoreBajo(false);
    }
  };

  // Carga productos con stock crítico con paginación
  const cargarStockCritico = async (skipValue, reset = false) => {
    const currentSkip = skipValue !== undefined ? skipValue : skipCritico;
    
    if (!hasMoreCritico && !reset) return;
    
    try {
      if (!reset) setLoadingMoreCritico(true);
      
      const response = await getProductosStockCritico({
        skip: currentSkip,
        limit: LIMIT_CRITICO
      });
      
      const { productos, total, has_more } = response.data;
  
      if (reset) {
        setProductosStockCritico(productos || []);
        setSkipCritico(LIMIT_CRITICO);
      } else {
        setProductosStockCritico(prev => [...prev, ...(productos || [])]);
        setSkipCritico(currentSkip + LIMIT_CRITICO);
      }
      
      setTotalCritico(total || 0);
      setHasMoreCritico(has_more || false);
      
      // Toast solo en carga inicial
      if (reset && total > 0) {
        const mensaje = total === 1 
          ? '1 producto en stock CRÍTICO'
          : `${total} productos en stock CRÍTICO`;
        toast.error(mensaje);
      }
      
    } catch (error) {
      console.error('Error cargando stock crítico:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoadingMoreCritico(false);
    }
  };

  // Alterna visibilidad de sección crítica (al expandir, colapsa stock bajo)
  const toggleCritico = () => {
    if (criticoColapsado) {
      setBajoColapsado(true);
    }
    setCriticoColapsado(!criticoColapsado);
  };

  // Alterna visibilidad de sección bajo (al expandir, colapsa stock crítico)
  const toggleBajo = () => {
    if (bajoColapsado) {
      setCriticoColapsado(true);
    }
    setBajoColapsado(!bajoColapsado);
  };

  // Intersection Observer para scroll infinito de stock bajo
  const lastProductBajoRef = useCallback(node => {
    if (loading || loadingMoreBajo) return;
    if (observerBajoRef.current) observerBajoRef.current.disconnect();
    
    observerBajoRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreBajo) {
        cargarStockBajo(skipBajo);
      }
    });
    
    if (node) observerBajoRef.current.observe(node);
  }, [loading, loadingMoreBajo, hasMoreBajo, skipBajo]);

  // Intersection Observer para scroll infinito de stock crítico
  const lastProductCriticoRef = useCallback(node => {
    if (loading || loadingMoreCritico) return;
    if (observerCriticoRef.current) observerCriticoRef.current.disconnect();
    
    observerCriticoRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreCritico) {
        cargarStockCritico(skipCritico);
      }
    });
    
    if (node) observerCriticoRef.current.observe(node);
  }, [loading, loadingMoreCritico, hasMoreCritico, skipCritico]);

  // Componente skeleton para tarjetas de estadísticas
  const StatCardSkeleton = () => (
    <div style={{
      backgroundColor: '#f3f4f6',
      padding: '1.25rem',
      borderRadius: '0.5rem',
      border: '2px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            height: '0.875rem',
            width: '60%',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.25rem',
            marginBottom: '0.75rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{ 
            height: '1.75rem',
            width: '80%',
            backgroundColor: '#e5e7eb',
            borderRadius: '0.25rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
        <div style={{ 
          width: '44px',
          height: '44px',
          backgroundColor: '#e5e7eb',
          borderRadius: '0.375rem',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </div>
    </div>
  );

  // Componente skeleton para items de producto
  const ProductoSkeleton = () => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.375rem',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ 
        height: '1rem',
        width: '60%',
        backgroundColor: '#e5e7eb',
        borderRadius: '0.25rem',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <div style={{ 
        height: '1.5rem',
        width: '25%',
        backgroundColor: '#e5e7eb',
        borderRadius: '0.25rem',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
    </div>
  );

  return (
    <div style={{ 
      padding: '1.25rem',
      height: 'calc(100vh - 140px)', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Animación de pulso para skeletons */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', flexShrink: 0 }}>
        Panel de Control - Hoy
      </h2>

      {/* Grid de tarjetas de estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem',
        flexShrink: 0
      }}>
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            {/* Tarjeta de ganancias */}
            <div style={{
              backgroundColor: '#d1fae5',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #86efac'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#15803d', fontWeight: 600 }}>
                    Ganancias Hoy
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#166534' }}>
                    ${stats.ganancia_hoy.toFixed(2)}
                  </p>
                </div>
                <TrendingUp size={44} style={{ color: '#22c55e' }} />
              </div>
            </div>

            {/* Tarjeta de ventas */}
            <div style={{
              backgroundColor: '#dbeafe',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #93c5fd'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#1e40af', fontWeight: 600 }}>
                    Ventas Hoy
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                    ${stats.ventas_hoy.toFixed(2)}
                  </p>
                </div>
                <DollarSign size={44} style={{ color: '#3b82f6' }} />
              </div>
            </div>

            {/* Tarjeta de productos vendidos */}
            <div style={{
              backgroundColor: '#fce7f3',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #fbcfe8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#9f1239', fontWeight: 600 }}>
                    Productos Vendidos
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#881337' }}>
                    {stats.productos_vendidos_hoy}
                  </p>
                </div>
                <Package size={44} style={{ color: '#ec4899' }} />
              </div>
            </div>

            {/* Tarjeta de transacciones */}
            <div style={{
              backgroundColor: '#f3e8ff',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #d8b4fe'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '0.8125rem', color: '#6b21a8', fontWeight: 600 }}>
                    Transacciones Hoy
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#581c87' }}>
                    {stats.cantidad_ventas_hoy}
                  </p>
                </div>
                <ShoppingCart size={44} style={{ color: '#a855f7' }} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Secciones de alertas de stock */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: criticoColapsado ? 'flex-start' : 'space-between',
        gap: '1rem',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        
        {loading ? (
          <>
            {/* Skeleton para stock crítico */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ 
                height: '1.5rem',
                width: '50%',
                backgroundColor: '#e5e7eb',
                borderRadius: '0.25rem',
                marginBottom: '1rem',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ProductoSkeleton />
                <ProductoSkeleton />
                <ProductoSkeleton />
              </div>
            </div>

            {/* Skeleton para stock bajo */}
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '1.25rem',
              borderRadius: '0.5rem',
              border: '2px solid #e5e7eb',
              flexShrink: 0
            }}>
              <div style={{ 
                height: '1.5rem',
                width: '50%',
                backgroundColor: '#e5e7eb',
                borderRadius: '0.25rem',
                marginBottom: '1rem',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ProductoSkeleton />
                <ProductoSkeleton />
                <ProductoSkeleton />
                <ProductoSkeleton />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Sección de productos con stock crítico */}
            {(totalCritico > 0) && (
              <div style={{
                backgroundColor: '#fee2e2',
                borderRadius: '0.5rem',
                border: '2px solid #fca5a5',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...(!criticoColapsado ? { 
                  flex: '1 1 0',
                  minHeight: 0 
                } : { 
                  flexShrink: 0,
                  flexGrow: 0
                })
              }}>
                {/* Header colapsable */}
                <div 
                  onClick={toggleCritico}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={22} style={{ color: '#dc2626' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#991b1b', margin: 0 }}>
                      Stock CRÍTICO (menos de 10 unidades)
                    </h3>
                    <span style={{
                      backgroundColor: '#dc2626',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {totalCritico}
                    </span>
                  </div>
                  {criticoColapsado ? (
                    <ChevronDown size={24} style={{ color: '#991b1b' }} />
                  ) : (
                    <ChevronUp size={24} style={{ color: '#991b1b' }} />
                  )}
                </div>

                {/* Lista de productos críticos */}
                {!criticoColapsado && (
                  <div style={{ 
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 1.25rem 1.25rem 1.25rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem',
                      flex: 1,
                      overflowY: 'auto',
                      paddingRight: '0.5rem'
                    }}>
                      {productosStockCritico?.map((producto, index) => {
                        const isLast = index === productosStockCritico.length - 1;
                        return (
                          <div
                            key={producto.id}
                            ref={isLast ? lastProductCriticoRef : null}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              backgroundColor: '#fff',
                              borderRadius: '0.375rem',
                              border: '2px solid #dc2626',
                              flexShrink: 0
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{producto.nombre}</span>
                            <span style={{ 
                              color: '#dc2626', 
                              fontWeight: 'bold',
                              backgroundColor: '#fee2e2',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.25rem'
                            }}>
                              Stock: {producto.stock}
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Indicador de carga */}
                      {loadingMoreCritico && (
                        <div style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          color: '#991b1b',
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          Cargando más productos...
                        </div>
                      )}
                      
                      {/* Mensaje de finalización */}
                      {!hasMoreCritico && (productosStockCritico?.length > 0) && (
                        <div style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          color: '#991b1b',
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          Todos los productos críticos cargados
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sección de productos con stock bajo */}
            {(totalBajo > 0) && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                border: '2px solid #e5e7eb',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                ...(!bajoColapsado ? { 
                  flex: '1 1 0',
                  minHeight: 0 
                } : { 
                  flexShrink: 0,
                  flexGrow: 0
                })
              }}>
                {/* Header colapsable */}
                <div 
                  onClick={toggleBajo}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                      Productos con Stock Bajo
                    </h3>
                    <span style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {totalBajo}
                    </span>
                  </div>
                  {bajoColapsado ? (
                    <ChevronDown size={24} style={{ color: '#6b7280' }} />
                  ) : (
                    <ChevronUp size={24} style={{ color: '#6b7280' }} />
                  )}
                </div>

                {/* Lista de productos con stock bajo */}
                {!bajoColapsado && (
                  <div style={{ 
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0 1.25rem 1.25rem 1.25rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '0.5rem',
                      flex: 1,
                      overflowY: 'auto',
                      paddingRight: '0.5rem'
                    }}>
                      {productosStockBajo?.map((producto, index) => {
                        const isLast = index === productosStockBajo.length - 1;
                        return (
                          <div
                            key={producto.id}
                            ref={isLast ? lastProductBajoRef : null}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.75rem',
                              backgroundColor: '#fef3c7',
                              borderRadius: '0.375rem',
                              border: '1px solid #fcd34d',
                              flexShrink: 0
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>{producto.nombre}</span>
                            <span style={{ color: '#92400e', fontWeight: 'bold' }}>
                              Stock: {producto.stock} / Mínimo: {producto.stock_minimo}
                            </span>
                          </div>
                        );
                      })}
                      
                      {/* Indicador de carga */}
                      {loadingMoreBajo && (
                        <div style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          color: '#92400e',
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          Cargando más productos...
                        </div>
                      )}
                      
                      {/* Mensaje de finalización */}
                      {!hasMoreBajo && (productosStockBajo?.length > 0) && (
                        <div style={{ 
                          padding: '0.75rem', 
                          textAlign: 'center',
                          color: '#92400e',
                          fontSize: '0.875rem',
                          flexShrink: 0
                        }}>
                          Todos los productos con stock bajo cargados
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mensaje cuando no hay alertas de stock */}
            {totalCritico === 0 && totalBajo === 0 && (
              <div style={{
                backgroundColor: '#d1fae5',
                padding: '2rem',
                borderRadius: '0.5rem',
                border: '2px solid #86efac',
                textAlign: 'center',
                flexShrink: 0
              }}>
                <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#065f46' }}>
                  No hay productos con stock bajo o crítico
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;