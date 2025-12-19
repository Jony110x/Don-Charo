/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { getCategorias } from '../api/api';
import { useToast } from '../Toast';

const ProductoForm = ({ producto, onClose, onSubmit }) => {
  const toast = useToast();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    precio_costo: producto?.precio_costo || '',
    precio_venta: producto?.precio_venta || '',
    stock: producto?.stock || '',
    stock_minimo: producto?.stock_minimo || 10,
    categoria: producto?.categoria || '',
    codigo_barras: producto?.codigo_barras || ''
  });

  // Estados para categorías
  const [categoriaInput, setCategoriaInput] = useState(producto?.categoria || '');
  const [categorias, setCategorias] = useState([]);
  const [categoriasCache, setCategoriasCache] = useState([]);
  const [sugerenciasLocales, setSugerenciasLocales] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  
  // Estados de paginación para categorías
  const [skipCategorias, setSkipCategorias] = useState(0);
  const [hasMoreCategorias, setHasMoreCategorias] = useState(true);
  const [totalCategorias, setTotalCategorias] = useState(0);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const LIMIT_CATEGORIAS = 20;
  
  // Referencias
  const inputCategoriaRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const contenedorScrollRef = useRef(null);
  const observerCategoriasRef = useRef(null);
  const timerBusquedaRef = useRef(null);
  const scrollAjustadoRef = useRef(false);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerBusquedaRef.current) {
        clearTimeout(timerBusquedaRef.current);
      }
    };
  }, []);

  // Ajustar scroll del modal cuando aparecen sugerencias
  const ajustarScrollModal = useCallback(() => {
    if (!inputCategoriaRef.current || !contenedorScrollRef.current) return;
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (!sugerenciasRef.current) return;
        
        const inputRect = inputCategoriaRef.current.getBoundingClientRect();
        const contenedorRect = contenedorScrollRef.current.getBoundingClientRect();
        const sugerenciasRect = sugerenciasRef.current.getBoundingClientRect();
        
        const espacioInferior = contenedorRect.bottom - inputRect.bottom;
        const alturaDropdown = Math.min(sugerenciasRect.height, 200);
        
        if (espacioInferior < alturaDropdown + 20) {
          const scrollAmount = inputRect.top - contenedorRect.top + 
                              contenedorScrollRef.current.scrollTop - 20;
          
          contenedorScrollRef.current.scrollTo({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }, 100);
    });
  }, []);

  // Ajustar scroll cuando aparecen sugerencias
  useEffect(() => {
    if (mostrarSugerencias && sugerenciasLocales.length > 0 && !scrollAjustadoRef.current) {
      ajustarScrollModal();
      scrollAjustadoRef.current = true;
    }
  }, [mostrarSugerencias, sugerenciasLocales, ajustarScrollModal]);

  // Cargar cache inicial de categorías para búsqueda local rápida
  useEffect(() => {
    const cargarCategoriasIniciales = async () => {
      try {
        const response = await getCategorias({ skip: 0, limit: 100 });
        
        let categoriasIniciales = [];
        if (Array.isArray(response.data)) {
          categoriasIniciales = response.data;
        } else if (response.data && response.data.categorias) {
          categoriasIniciales = response.data.categorias;
        }
        
        setCategoriasCache(categoriasIniciales);
      } catch (error) {
        console.error('Error cargando categorías iniciales:', error);
      }
    };
    
    cargarCategoriasIniciales();
  }, []);

  // Cargar categorías con paginación
  const cargarCategorias = async (skipValue = 0, reset = false) => {
    if (!hasMoreCategorias && !reset) return;
    if (loadingCategorias) return;
    
    try {
      setLoadingCategorias(true);
      
      const params = {
        skip: skipValue,
        limit: LIMIT_CATEGORIAS,
        ...(categoriaInput && { busqueda: categoriaInput })
      };

      const response = await getCategorias(params);
      
      // Manejar diferentes formatos de respuesta
      let nuevasCategorias, total, has_more;
      
      if (Array.isArray(response.data)) {
        nuevasCategorias = response.data;
        total = response.data.length;
        has_more = false;
      } else if (response.data && response.data.categorias) {
        nuevasCategorias = response.data.categorias;
        total = response.data.total;
        has_more = response.data.has_more;
      } else {
        console.error('Formato de respuesta inesperado:', response.data);
        nuevasCategorias = [];
        total = 0;
        has_more = false;
      }

      if (reset) {
        setCategorias(nuevasCategorias);
        if (categoriaInput && nuevasCategorias.length > 0) {
          setSugerenciasLocales(prev => {
            const combined = [...prev, ...nuevasCategorias];
            return [...new Set(combined)];
          });
        }
        
        if (!categoriaInput) {
          setCategoriasCache(prev => {
            const merged = [...prev, ...nuevasCategorias];
            return [...new Set(merged)];
          });
        }
      } else {
        setCategorias(prev => [...prev, ...nuevasCategorias]);
        if (categoriaInput) {
          setSugerenciasLocales(prev => {
            const combined = [...prev, ...nuevasCategorias];
            return [...new Set(combined)];
          });
        }
      }
      
      setTotalCategorias(total);
      setHasMoreCategorias(has_more);
      setSkipCategorias(skipValue + LIMIT_CATEGORIAS);

    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Intersection Observer para scroll infinito de categorías
  const lastCategoriaRef = useCallback(node => {
    if (loadingCategorias) return;
    if (observerCategoriasRef.current) observerCategoriasRef.current.disconnect();
    
    observerCategoriasRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreCategorias) {
        cargarCategorias(skipCategorias);
      }
    });
    
    if (node) observerCategoriasRef.current.observe(node);
  }, [loadingCategorias, hasMoreCategorias, skipCategorias]);

  // Manejar cambio en input de categoría con búsqueda local
  const handleCategoriaChange = (e) => {
    const valor = e.target.value;
    setCategoriaInput(valor);
    setFormData(prev => ({ ...prev, categoria: valor }));
    
    if (timerBusquedaRef.current) {
      clearTimeout(timerBusquedaRef.current);
    }
    
    if (valor.trim() === '') {
      setSugerenciasLocales([]);
      setMostrarSugerencias(false);
      scrollAjustadoRef.current = false;
      return;
    }
    
    // Filtrado local instantáneo
    const valorLower = valor.toLowerCase();
    const sugerenciasFiltradas = categoriasCache.filter(cat =>
      cat.toLowerCase().includes(valorLower)
    );
    
    setSugerenciasLocales(sugerenciasFiltradas);
    setMostrarSugerencias(true);
    scrollAjustadoRef.current = false;
  };

  // Seleccionar categoría de sugerencias
  const seleccionarCategoria = (categoria) => {
    setCategoriaInput(categoria);
    setFormData(prev => ({ ...prev, categoria }));
    setMostrarSugerencias(false);
    scrollAjustadoRef.current = false;
  };

  // Crear nueva categoría
  const crearNuevaCategoria = () => {
    setFormData(prev => ({ ...prev, categoria: categoriaInput }));
    setMostrarSugerencias(false);
    scrollAjustadoRef.current = false;
  };

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target) &&
        inputCategoriaRef.current &&
        !inputCategoriaRef.current.contains(event.target)
      ) {
        setMostrarSugerencias(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calcular margen de ganancia
  const margenGanancia = formData.precio_costo && formData.precio_venta
    ? (((formData.precio_venta - formData.precio_costo) / formData.precio_costo) * 100).toFixed(2)
    : 0;

  // Validar y enviar formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.categoria || formData.categoria.trim() === '') {
      toast.warning('La categoría es obligatoria');
      return;
    }
    
    if (parseFloat(formData.precio_venta) <= parseFloat(formData.precio_costo)) {
      toast.warning('El precio de venta debe ser mayor al precio de costo');
      return;
    }
    
    onSubmit(formData);
  };

  // Actualizar campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio_costo' || name === 'precio_venta' || name === 'stock' || name === 'stock_minimo' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '2rem 2rem 0 2rem',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {producto ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <button onClick={onClose} style={{ cursor: 'pointer', border: 'none', background: 'none' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }}>
          {/* Contenido scrolleable */}
          <div 
            ref={contenedorScrollRef}
            style={{
              padding: '0 2rem',
              overflowY: 'auto',
              flex: 1
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Nombre */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Nombre <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="input"
                />
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="input"
                  rows="3"
                />
              </div>

              {/* Precios */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Precio de Costo <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="precio_costo"
                    value={formData.precio_costo}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Precio de Venta <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="input"
                  />
                </div>
              </div>

              {/* Margen de ganancia */}
              {formData.precio_costo > 0 && formData.precio_venta > 0 && (
                <div style={{
                  backgroundColor: margenGanancia > 0 ? '#d1fae5' : '#fee2e2',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: `2px solid ${margenGanancia > 0 ? '#86efac' : '#fca5a5'}`
                }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    Margen de Ganancia: <span style={{ fontSize: '1.125rem' }}>{margenGanancia}%</span>
                  </p>
                  <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Ganancia por unidad: ${(formData.precio_venta - formData.precio_costo).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Stock <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleChange}
                    min="0"
                    className="input"
                  />
                </div>
              </div>

              {/* Categoría y código de barras */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Categoría con autocompletado */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Categoría <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    ref={inputCategoriaRef}
                    type="text"
                    value={categoriaInput}
                    onChange={handleCategoriaChange}
                    onFocus={() => {
                      const valor = categoriaInput.trim();
                      if (valor !== '') {
                        const valorLower = valor.toLowerCase();
                        const sugerenciasFiltradas = categoriasCache.filter(cat =>
                          cat.toLowerCase().includes(valorLower)
                        );
                        setSugerenciasLocales(sugerenciasFiltradas);
                        setMostrarSugerencias(true);
                        scrollAjustadoRef.current = false;
                        
                        if (sugerenciasFiltradas.length < 5 && categorias.length === 0) {
                          cargarCategorias(0, true);
                        }
                      }
                    }}
                    required
                    className="input"
                    autoComplete="off"
                  />
                  
                  {/* Dropdown de sugerencias */}
                  {mostrarSugerencias && (
                    <div
                      ref={sugerenciasRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        marginTop: '0.25rem',
                        maxHeight: '100px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000
                      }}
                    >
                      {sugerenciasLocales.length > 0 ? (
                        <>
                          {sugerenciasLocales.map((cat, idx) => {
                            const isLast = idx === sugerenciasLocales.length - 1;
                            return (
                              <div
                                key={idx}
                                ref={isLast ? lastCategoriaRef : null}
                                onClick={() => seleccionarCategoria(cat)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  cursor: 'pointer',
                                  borderBottom: idx < sugerenciasLocales.length - 1 ? '1px solid #f3f4f6' : 'none',
                                  transition: 'background-color 0.15s',
                                  fontSize: '0.875rem'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                              >
                                {cat}
                              </div>
                            );
                          })}
                          
                          {loadingCategorias && (
                            <div style={{ 
                              padding: '0.5rem 0.75rem', 
                              textAlign: 'center',
                              color: '#6b7280',
                              fontSize: '0.8125rem'
                            }}>
                              Buscando más categorías...
                            </div>
                          )}
                          
                          <div
                            onClick={crearNuevaCategoria}
                            style={{
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              color: '#3b82f6',
                              fontWeight: 600,
                              transition: 'background-color 0.15s',
                              borderTop: '2px solid #e5e7eb',
                              fontSize: '0.875rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            + Agregar "{categoriaInput}"
                          </div>
                        </>
                      ) : loadingCategorias ? (
                        <div style={{ 
                          padding: '0.75rem 1rem', 
                          color: '#6b7280',
                          textAlign: 'center',
                          fontSize: '0.875rem'
                        }}>
                          Buscando categorías...
                        </div>
                      ) : (
                        <div
                          onClick={crearNuevaCategoria}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            fontWeight: 600,
                            transition: 'background-color 0.15s',
                            fontSize: '0.875rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          + Agregar "{categoriaInput}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Código de barras */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Código de Barras <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="7891234567890"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer fijo con botones */}
          <div style={{
            padding: '1rem 2rem 2rem 2rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
                {producto ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" onClick={onClose} className="btn" style={{ flex: 1, backgroundColor: '#6b7280', color: 'white' }}>
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductoForm;