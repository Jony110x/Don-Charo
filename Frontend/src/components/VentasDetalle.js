import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Download, 
  Calendar, 
  User, 
  Filter, 
  ChevronDown,
  ChevronUp,
  Search,
  Loader
} from 'lucide-react';
import api from '../api/api';

const VentasDetalle = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    usuario_id: '',
    metodo_pago: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Expandir detalles
  const [ventaExpandida, setVentaExpandida] = useState(null);
  
  // Estadísticas
  const [estadisticas, setEstadisticas] = useState(null);
  
  const LIMIT = 50;
  const observerRef = useRef();
  const ventasContainerRef = useRef();

  // Cargar ventas
  const cargarVentas = useCallback(async (skipValue = 0, reset = false) => {
    if (!hasMore && !reset) return;
    
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        skip: skipValue,
        limit: LIMIT,
        ...filtros
      };

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await api.get('/ventas-detalle/', { params });
      const { ventas: nuevasVentas, total: totalVentas, has_more } = response.data;

      if (reset) {
        setVentas(nuevasVentas);
      } else {
        setVentas(prev => [...prev, ...nuevasVentas]);
      }
      
      setTotal(totalVentas);
      setHasMore(has_more);
      setSkip(skipValue + LIMIT);

    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filtros, hasMore]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const params = {};
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;

      const response = await api.get('/ventas-detalle/estadisticas', { params });
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }, [filtros.fecha_desde, filtros.fecha_hasta]);

  // Cargar inicial
  useEffect(() => {
    cargarVentas(0, true);
    cargarEstadisticas();
  }, []);

  // ✅ FIX: No cerrar filtros al aplicar
  const aplicarFiltros = () => {
    setVentas([]);
    setSkip(0);
    setHasMore(true);
    cargarVentas(0, true);
    cargarEstadisticas();
    // ✅ REMOVIDO: setMostrarFiltros(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      usuario_id: '',
      metodo_pago: ''
    });
    setVentas([]);
    setSkip(0);
    setHasMore(true);
    setTimeout(() => {
      cargarVentas(0, true);
      cargarEstadisticas();
    }, 100);
  };

  // Intersection Observer para scroll infinito
  const lastVentaRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        cargarVentas(skip);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, skip, cargarVentas]);

  // ✅ FIX: Exportar con descarga directa del blob
  const exportarExcel = async () => {
    try {
      setExportando(true);
      
      const params = {};
      if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde;
      if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta;
      if (filtros.usuario_id) params.usuario_id = filtros.usuario_id;
      if (filtros.metodo_pago) params.metodo_pago = filtros.metodo_pago;

      // Construir URL con parámetros
      const queryString = new URLSearchParams(params).toString();
      const url = `${api.defaults.baseURL}/ventas-detalle/exportar${queryString ? '?' + queryString : ''}`;
      
      // Obtener token
      const token = localStorage.getItem('token');

      // Fetch con blob
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      // Obtener blob
      const blob = await response.blob();
      
      // Crear link de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener nombre del archivo
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'ventas_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ Excel descargado exitosamente');
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error al exportar a Excel. Verifica la consola.');
    } finally {
      setExportando(false);
    }
  };

  // Toggle expandir venta
  const toggleExpandir = (ventaId) => {
    setVentaExpandida(ventaExpandida === ventaId ? null : ventaId);
  };

  // Formato de fecha
  const formatFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formato de moneda
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    // ✅ FIX: Container con altura fija para que solo el contenido tenga scroll
    <div style={{ 
      height: 'calc(100vh - 180px)', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '0.5rem',
      overflow: 'hidden' // ✅ Sin scroll en el contenedor principal
    }}>
      {/* Header - FIJO */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '0.5rem',
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e40af' }}>
          Detalle de Ventas
        </h1>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: mostrarFiltros ? '#1e40af' : 'white',
              color: mostrarFiltros ? 'white' : '#1e40af',
              border: '2px solid #1e40af',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            <Filter size={18} />
            Filtros
          </button>
          
          <button
            onClick={exportarExcel}
            disabled={exportando || ventas.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: exportando ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: exportando || ventas.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {exportando ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Exportando...
              </>
            ) : (
              <>
                <Download size={18} />
                Exportar Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel de filtros - FIJO */}
      {mostrarFiltros && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          marginBottom: '0.5rem',
          border: '2px solid #e5e7eb',
          flexShrink: 0
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}>
            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                Método de Pago
              </label>
              <select
                value={filtros.metodo_pago}
                onChange={(e) => setFiltros({ ...filtros, metodo_pago: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem'
                }}
              >
                <option value="">Todos</option>
                <option value="normal">Normal</option>
                <option value="efectivo">Efectivo</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={aplicarFiltros}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '0.275rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Aplicar Filtros
            </button>
            <button
              onClick={limpiarFiltros}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas - FIJO */}
      {estadisticas && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '0.5rem',
          flexShrink: 0
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Total Ventas
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e40af' }}>
              {estadisticas.total_ventas}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Total Recaudado
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#10b981' }}>
              {formatMoney(estadisticas.total_recaudado)}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Promedio por Venta
            </div>
            <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {formatMoney(estadisticas.promedio_venta)}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Efectivo / Normal
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {estadisticas.ventas_efectivo} / {estadisticas.ventas_normal}
            </div>
          </div>
        </div>
      )}

      {/* ✅ FIX: Container de ventas con SCROLL */}
      <div 
        ref={ventasContainerRef}
        style={{ 
          flex: 1,
          overflowY: 'auto', // ✅ SCROLL SOLO AQUÍ
          paddingRight: '0.5rem'
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Loader size={48} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#1e40af' }} />
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Cargando ventas...</p>
          </div>
        ) : ventas.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb'
          }}>
            <Search size={48} style={{ margin: '0 auto', color: '#d1d5db' }} />
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>
              No se encontraron ventas con los filtros aplicados
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {ventas.map((venta, index) => {
                const isLast = index === ventas.length - 1;
                const isExpanded = ventaExpandida === venta.id;

                return (
                  <div
                    key={venta.id}
                    ref={isLast ? lastVentaRef : null}
                    style={{
                      backgroundColor: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Header de la venta */}
                    <div
                      onClick={() => toggleExpandir(venta.id)}
                      style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 150px 150px 120px 100px 50px',
                        alignItems: 'center',
                        gap: '1rem',
                        backgroundColor: isExpanded ? '#f3f4f6' : 'white'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: '#1e40af' }}>
                        #{venta.id}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {formatFecha(venta.fecha)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                          {venta.usuario_nombre_completo || venta.usuario_nombre}
                        </span>
                      </div>

                      <div>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: venta.metodo_pago === 'efectivo' ? '#d1fae5' : '#dbeafe',
                          color: venta.metodo_pago === 'efectivo' ? '#065f46' : '#1e40af'
                        }}>
                          {venta.metodo_pago === 'efectivo' ? 'EFECTIVO -8%' : 'NORMAL'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {venta.cantidad_items} item{venta.cantidad_items !== 1 ? 's' : ''}
                      </div>

                      <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '1.125rem' }}>
                        {formatMoney(venta.total)}
                      </div>

                      <div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    {/* Detalle expandido */}
                    {isExpanded && (
                      <div style={{
                        padding: '1rem',
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                      }}>
                        <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                          Productos:
                        </h4>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                              <th style={{ textAlign: 'left', padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                Producto
                              </th>
                              <th style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                Cantidad
                              </th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                Precio Unit.
                              </th>
                              <th style={{ textAlign: 'right', padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {venta.items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                  {item.producto_nombre}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
                                  {item.cantidad}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right' }}>
                                  {formatMoney(item.precio_unitario)}
                                </td>
                                <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 600 }}>
                                  {formatMoney(item.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {venta.observaciones && (
                          <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fef3c7', borderRadius: '0.375rem' }}>
                            <span style={{ fontSize: '0.875rem', color: '#92400e' }}>
                              <strong>Observaciones:</strong> {venta.observaciones}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: '#1e40af' }} />
                <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  Cargando más ventas...
                </p>
              </div>
            )}

            {!hasMore && ventas.length > 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                ✓ Todas las ventas cargadas ({total} total)
              </div>
            )}
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VentasDetalle;