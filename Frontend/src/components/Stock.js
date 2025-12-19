/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit2, Trash2, RefreshCw, Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { getProductos, getCategorias, createProducto, updateProducto, deleteProducto } from '../api/api';
import ProductoForm from './ProductoForm';
import { useToast } from '../Toast';

const Stock = () => {
  // Estados principales
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);
  const [filtrosColapsados, setFiltrosColapsados] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const toast = useToast();
  
  // Estados de paginación
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const LIMIT = 50;
  
  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [categorias, setCategorias] = useState(['todas']);
  
  // Estados para autocompletado de categorías
  const [categoriaInputFiltro, setCategoriaInputFiltro] = useState('');
  const [mostrarSugerenciasFiltro, setMostrarSugerenciasFiltro] = useState(false);
  const inputCategoriaFiltroRef = useRef(null);
  const sugerenciasFiltroRef = useRef(null);
  
  // Refs para control de peticiones y scroll infinito
  const observerRef = useRef();
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const requestIdRef = useRef(0);

  // Anchos fijos de columnas para tabla
  const COLUMN_WIDTHS = {
    producto: '25%',
    categoria: '12%',
    precioCosto: '10%',
    precioVenta: '10%',
    margen: '10%',
    stock: '8%',
    estado: '10%',
    acciones: '15%'
  };

  // Debounce para búsqueda - evita llamadas excesivas al API
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (busqueda.trim() === '') {
      setBusquedaDebounced('');
      return;
    }

    const valorActual = busqueda;
    
    debounceTimerRef.current = setTimeout(() => {
      setBusquedaDebounced(valorActual);
      debounceTimerRef.current = null;
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [busqueda]);

  // Cargar categorías al iniciar
  useEffect(() => {
    cargarCategorias();
  }, []);

  // Recargar productos cuando cambian los filtros
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setProductos([]);
    setSkip(0);
    setHasMore(true);
    
    cargarProductos(0, true);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [busquedaDebounced, filtroCategoria, filtroEstado]);

  const cargarCategorias = async () => {
    try {
      const response = await getCategorias();
      setCategorias(['todas', ...response.data]);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const handleCategoriaFiltroChange = (e) => {
    const valor = e.target.value;
    setCategoriaInputFiltro(valor);
    
    if (valor.trim() === '') {
      setFiltroCategoria('todas');
      setMostrarSugerenciasFiltro(false);
      return;
    }

    setMostrarSugerenciasFiltro(true);
  };

  const seleccionarCategoriaFiltro = (categoria) => {
    setCategoriaInputFiltro(categoria === 'todas' ? '' : categoria);
    setFiltroCategoria(categoria);
    setMostrarSugerenciasFiltro(false);
  };

  // Filtrar categorías según input del usuario
  const categoriasFiltradas = categorias.filter(cat => {
    if (!categoriaInputFiltro.trim()) return true;
    if (cat === 'todas') return 'todas las categorías'.includes(categoriaInputFiltro.toLowerCase());
    return cat.toLowerCase().includes(categoriaInputFiltro.toLowerCase());
  }).sort((a, b) => {
    if (a === 'todas') return -1;
    if (b === 'todas') return 1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });

  // Cerrar dropdown de categorías al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sugerenciasFiltroRef.current &&
        !sugerenciasFiltroRef.current.contains(event.target) &&
        inputCategoriaFiltroRef.current &&
        !inputCategoriaFiltroRef.current.contains(event.target)
      ) {
        setMostrarSugerenciasFiltro(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar productos con paginación
  const cargarProductos = async (skipValue, reset = false) => {
    const currentSkip = skipValue !== undefined ? skipValue : skip;
    
    if (!hasMore && !reset) return;
    
    // ID único para cada petición - evita condiciones de carrera
    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;
    
    abortControllerRef.current = new AbortController();
    
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        skip: currentSkip,
        limit: LIMIT,
        ...(busquedaDebounced && { busqueda: busquedaDebounced }),
        ...(filtroCategoria !== 'todas' && { categoria: filtroCategoria }),
        ...(filtroEstado !== 'todos' && { estado_stock: filtroEstado })
      };

      const response = await getProductos(params);
      
      // Verificar si esta sigue siendo la petición más reciente
      if (thisRequestId !== requestIdRef.current) {
        return;
      }
      
      const { productos: nuevosProductos, total: totalProductos, has_more } = response.data;

      if (reset) {
        setProductos(nuevosProductos);
        setSkip(LIMIT);
      } else {
        setProductos(prev => [...prev, ...nuevosProductos]);
        setSkip(currentSkip + LIMIT);
      }
      
      setTotal(totalProductos);
      setHasMore(has_more);

    } catch (error) {
      if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
        console.error('Error cargando productos:', error);
        toast.error('Error al cargar productos');
      }
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // Intersection Observer para scroll infinito
  const lastProductRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        cargarProductos(skip, false);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, skip]);

  const handleCrearProducto = async (data) => {
    try {
      await createProducto(data);
      toast.success('Producto creado exitosamente');
      setShowForm(false);
      setProductos([]);
      setSkip(0);
      setHasMore(true);
      cargarProductos(0, true);
    } catch (error) {
      console.error('Error creando producto:', error);
      toast.error('Error al crear producto');
    }
  };

  const handleActualizarProducto = async (data) => {
    try {
      await updateProducto(productoEdit.id, data);
      toast.success('Producto actualizado exitosamente');
      setShowForm(false);
      setProductoEdit(null);
      setProductos([]);
      setSkip(0);
      setHasMore(true);
      cargarProductos(0, true);
    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const confirmarEliminarProducto = (producto) => {
    setProductoAEliminar(producto);
    setShowDeleteModal(true);
  };

  const handleEliminarProducto = async () => {
    if (!productoAEliminar) return;
    
    try {
      await deleteProducto(productoAEliminar.id);
      toast.success('Producto eliminado exitosamente');
      setShowDeleteModal(false);
      setProductoAEliminar(null);
      setProductos([]);
      setSkip(0);
      setHasMore(true);
      cargarProductos(0, true);
    } catch (error) {
      console.error('Error eliminando producto:', error);
      toast.error('Error al eliminar producto');
    }
  };

  // Determinar estado del stock según niveles
  const getEstadoStock = (producto) => {
    if (producto.stock < 10) return { text: 'Crítico', color: '#fee2e2', textColor: '#991b1b' };
    if (producto.stock < producto.stock_minimo) return { text: 'Bajo', color: '#fef3c7', textColor: '#92400e' };
    return { text: 'Normal', color: '#d1fae5', textColor: '#065f46' };
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaInputFiltro('');
    setFiltroCategoria('todas');
    setFiltroEstado('todos');
  };

  const handleRefresh = () => {
    setProductos([]);
    setSkip(0);
    setHasMore(true);
    cargarProductos(0, true);
  };

  // Componente skeleton para estado de carga
  const SkeletonRow = () => (
    <tr style={{ borderTop: '1px solid #e5e7eb' }}>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.producto }}>
        <div style={{ 
          height: '1rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '80%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
        <div style={{ 
          height: '0.75rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '50%',
          marginTop: '0.5rem',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.categoria }}>
        <div style={{ 
          height: '1rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '70%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.precioCosto }}>
        <div style={{ 
          height: '1rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '60%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.precioVenta }}>
        <div style={{ 
          height: '1rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '60%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.margen }}>
        <div style={{ 
          height: '1.5rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '50%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.stock }}>
        <div style={{ 
          height: '1rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '0.25rem',
          width: '40%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.estado }}>
        <div style={{ 
          height: '1.5rem', 
          backgroundColor: '#e5e7eb', 
          borderRadius: '9999px',
          width: '70%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} />
      </td>
      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.acciones }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <div style={{ 
            width: '28px',
            height: '28px',
            backgroundColor: '#e5e7eb', 
            borderRadius: '0.375rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{ 
            width: '28px',
            height: '28px',
            backgroundColor: '#e5e7eb', 
            borderRadius: '0.375rem',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
        </div>
      </td>
    </tr>
  );

  return (
    <div style={{ 
      padding: '0.5rem',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Animaciones CSS */}
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
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      
      {/* Panel de filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: filtrosColapsados ? '0.75rem' : '1rem', 
        borderRadius: '0.5rem',
        border: '2px solid #e5e7eb',
        marginBottom: '0.5rem', 
        flexShrink: 0,
        transition: 'padding 0.3s ease'
      }}>
        {/* Header con título y botones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: filtrosColapsados ? 0 : '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Control de Stock</h2>
            <button 
              onClick={() => setFiltrosColapsados(!filtrosColapsados)}
              className="btn"
              style={{ 
                backgroundColor: '#f3f4f6', 
                color: '#374151',
                padding: '0.375rem 0.75rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={filtrosColapsados ? 'Mostrar filtros' : 'Ocultar filtros'}
            >
              {filtrosColapsados ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              {filtrosColapsados ? 'Mostrar filtros' : 'Ocultar filtros'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#6b7280', marginRight: '0.5rem' }}>
              {productos.length} de {total} productos
            </span>
            <button onClick={handleRefresh} className="btn" style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.5rem 0.75rem' }}>
              <RefreshCw size={16} style={{ marginRight: '0.5rem' }} />
              Actualizar
            </button>
            <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Controles de filtros */}
        {!filtrosColapsados && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            {/* Buscador */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Buscar por nombre o categoría
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  placeholder="Escriba para buscar..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.5rem', padding: '0.5rem 0.5rem 0.5rem 2.5rem' }}
                />
              </div>
            </div>

            {/* Filtro por categoría con autocompletado */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Categoría
              </label>
              <input
                ref={inputCategoriaFiltroRef}
                type="text"
                value={categoriaInputFiltro}
                onChange={handleCategoriaFiltroChange}
                onFocus={() => setMostrarSugerenciasFiltro(true)}
                placeholder="Todas las categorías"
                className="input"
                style={{ 
                  textTransform: 'capitalize', 
                  padding: '0.5rem',
                  width: '100%'
                }}
                autoComplete="off"
              />
              
              {/* Dropdown de sugerencias */}
              {mostrarSugerenciasFiltro && (
                <div
                  ref={sugerenciasFiltroRef}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    marginTop: '0.25rem',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000
                  }}
                >
                  {categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map((cat, idx) => (
                      <div
                        key={idx}
                        onClick={() => seleccionarCategoriaFiltro(cat)}
                        style={{
                          padding: '0.35rem 1rem',
                          cursor: 'pointer',
                          borderBottom: idx < categoriasFiltradas.length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.15s',
                          textTransform: 'capitalize',
                          backgroundColor: filtroCategoria === cat ? '#eff6ff' : 'white',
                          fontWeight: filtroCategoria === cat ? 600 : 400,
                          color: filtroCategoria === cat ? '#3b82f6' : '#374151'
                        }}
                        onMouseEnter={(e) => {
                          if (filtroCategoria !== cat) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (filtroCategoria !== cat) {
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        {cat === 'todas' ? 'Todas las categorías' : cat}
                        {filtroCategoria === cat && (
                          <span style={{ float: 'right', color: '#3b82f6' }}>✓</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ 
                      padding: '0.75rem 1rem', 
                      color: '#9ca3af',
                      textAlign: 'center',
                      fontSize: '0.875rem'
                    }}>
                      No se encontraron categorías
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filtro por estado de stock */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.375rem' }}>
                Estado de Stock
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="input"
                style={{ padding: '0.5rem' }}
              >
                <option value="todos">Todos</option>
                <option value="normal">Normal</option>
                <option value="bajo">Bajo</option>
                <option value="critico">Crítico</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div>
              <button
                onClick={limpiarFiltros}
                disabled={!busqueda && filtroCategoria === 'todas' && filtroEstado === 'todos'}
                className="btn"
                style={{ 
                  backgroundColor: (busqueda || filtroCategoria !== 'todas' || filtroEstado !== 'todos') ? '#ef4444' : '#e5e7eb',
                  color: (busqueda || filtroCategoria !== 'todas' || filtroEstado !== 'todos') ? 'white' : '#9ca3af',
                  fontSize: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  cursor: (busqueda || filtroCategoria !== 'todas' || filtroEstado !== 'todos') ? 'pointer' : 'not-allowed',
                  opacity: (busqueda || filtroCategoria !== 'todas' || filtroEstado !== 'todos') ? 1 : 0.6,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '2px solid #e5e7eb',
        flex: 1,
        overflow: 'auto',
        minHeight: 0
      }}>
        {productos.length === 0 && !loading ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Search size={64} style={{ margin: '0 auto', marginBottom: '1rem', color: '#d1d5db' }} />
            <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              No se encontraron productos
            </p>
            <p style={{ fontSize: '0.875rem' }}>
              Intenta cambiar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', tableLayout: 'fixed' }}>
            <thead style={{ 
              backgroundColor: '#f3f4f6',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.producto }}>Producto</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.categoria }}>Categoría</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.precioCosto }}>P. Costo</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.precioVenta }}>P. Venta</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.margen }}>Margen</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.stock }}>Stock</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.estado }}>Estado</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.acciones }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && productos.length === 0 ? (
                <>
                  {[...Array(10)].map((_, index) => (
                    <SkeletonRow key={`skeleton-${index}`} />
                  ))}
                </>
              ) : (
                productos.map((producto, index) => {
                  const estado = getEstadoStock(producto);
                  const margen = producto.precio_costo > 0 
                    ? (((producto.precio_venta - producto.precio_costo) / producto.precio_costo) * 100).toFixed(1)
                    : 0;
                  
                  const isLast = index === productos.length - 1;
                  
                  return (
                    <tr 
                      key={producto.id} 
                      ref={isLast ? lastProductRef : null}
                      style={{ borderTop: '1px solid #e5e7eb' }}
                    >
                      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.producto }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{producto.nombre}</div>
                          {producto.codigo_barras && (
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                              CB: {producto.codigo_barras}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize', fontSize: '0.875rem', width: COLUMN_WIDTHS.categoria }}>
                        {producto.categoria || 'Sin categoría'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#dc2626', fontWeight: 600, fontSize: '0.875rem', width: COLUMN_WIDTHS.precioCosto }}>
                        ${producto.precio_costo.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#059669', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.precioVenta }}>
                        ${producto.precio_venta.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.margen }}>
                        <span style={{
                          backgroundColor: margen > 30 ? '#d1fae5' : margen > 15 ? '#fef3c7' : '#fee2e2',
                          color: margen > 30 ? '#065f46' : margen > 15 ? '#92400e' : '#991b1b',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8125rem',
                          fontWeight: 600
                        }}>
                          {margen}%
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', fontSize: '0.875rem', width: COLUMN_WIDTHS.stock }}>{producto.stock}</td>
                      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.estado }}>
                        <span style={{
                          backgroundColor: estado.color,
                          color: estado.textColor,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.8125rem',
                          fontWeight: 600
                        }}>
                          {estado.text}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', width: COLUMN_WIDTHS.acciones }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <button
                            onClick={() => {
                              setProductoEdit(producto);
                              setShowForm(true);
                            }}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer'
                            }}
                            title="Editar producto"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => confirmarEliminarProducto(producto)}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer'
                            }}
                            title="Eliminar producto"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
        
        {/* Indicador de carga al cargar más */}
        {loadingMore && (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <p>Cargando más productos...</p>
          </div>
        )}
        
        {/* Mensaje cuando se cargaron todos */}
        {!hasMore && productos.length > 0 && (
          <div style={{ 
            padding: '1rem', 
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            <p>Todos los productos cargados ({total} total)</p>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && productoAEliminar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '450px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            animation: 'slideIn 0.2s ease-out'
          }}>
            
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                backgroundColor: '#fee2e2',
                padding: '0.75rem',
                borderRadius: '50%',
                marginRight: '1rem'
              }}>
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>
                Eliminar Producto
              </h3>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
                ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.
              </p>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: '#111827' }}>
                  {productoAEliminar.nombre}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'capitalize' }}>
                  {productoAEliminar.categoria || 'Sin categoría'} • Stock: {productoAEliminar.stock}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductoAEliminar(null);
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarProducto}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario de producto */}
      {showForm && (
        <ProductoForm
          producto={productoEdit}
          onClose={() => {
            setShowForm(false);
            setProductoEdit(null);
          }}
          onSubmit={productoEdit ? handleActualizarProducto : handleCrearProducto}
        />
      )}
    </div>
  );
};

export default Stock;