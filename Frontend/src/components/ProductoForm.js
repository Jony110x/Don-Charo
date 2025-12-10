import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { getProductos } from '../api/api';

const ProductoForm = ({ producto, onClose, onSubmit }) => {
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

  const [categoriaInput, setCategoriaInput] = useState(producto?.categoria || '');
  const [sugerenciasCategorias, setSugerenciasCategorias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [todasLasCategorias, setTodasLasCategorias] = useState([]);
  const inputCategoriaRef = useRef(null);
  const sugerenciasRef = useRef(null);
  const contenedorScrollRef = useRef(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  // Cargar categorías existentes de la base de datos
  const cargarCategorias = async () => {
    try {
      const response = await getProductos();
      const categoriasUnicas = [...new Set(
        response.data
          .map(p => p.categoria)
          .filter(c => c && c.trim() !== '')
      )].sort();
      setTodasLasCategorias(categoriasUnicas);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  // Manejar cambio en input de categoría con búsqueda
  const handleCategoriaChange = (e) => {
    const valor = e.target.value;
    setCategoriaInput(valor);
    setFormData(prev => ({ ...prev, categoria: valor }));
    
    if (valor.trim() === '') {
      setSugerenciasCategorias([]);
      setMostrarSugerencias(false);
      return;
    }

    // Filtrar categorías que coincidan
    const sugerencias = todasLasCategorias.filter(cat =>
      cat.toLowerCase().includes(valor.toLowerCase())
    );

    setSugerenciasCategorias(sugerencias);
    setMostrarSugerencias(true);

    // Hacer scroll automático para mostrar las sugerencias
    setTimeout(() => {
      if (inputCategoriaRef.current && contenedorScrollRef.current) {
        const inputRect = inputCategoriaRef.current.getBoundingClientRect();
        const contenedorRect = contenedorScrollRef.current.getBoundingClientRect();
        const dropdownHeight = 200; // Altura máxima del dropdown
        
        // Calcular si el dropdown quedaría fuera de vista
        const espacioInferior = contenedorRect.bottom - inputRect.bottom;
        
        if (espacioInferior < dropdownHeight + 20) {
          // Hacer scroll para que el input y el dropdown sean visibles
          const scrollAmount = inputRect.top - contenedorRect.top + contenedorScrollRef.current.scrollTop - 50;
          contenedorScrollRef.current.scrollTo({
            top: scrollAmount,
            behavior: 'smooth'
          });
        }
      }
    }, 100);
  };

  // Seleccionar categoría de sugerencias
  const seleccionarCategoria = (categoria) => {
    setCategoriaInput(categoria);
    setFormData(prev => ({ ...prev, categoria }));
    setMostrarSugerencias(false);
  };

  // Crear nueva categoría
  const crearNuevaCategoria = () => {
    setFormData(prev => ({ ...prev, categoria: categoriaInput }));
    setMostrarSugerencias(false);
  };

  // Click fuera de sugerencias
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

  const margenGanancia = formData.precio_costo && formData.precio_venta
    ? (((formData.precio_venta - formData.precio_costo) / formData.precio_costo) * 100).toFixed(2)
    : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar categoría obligatoria
    if (!formData.categoria || formData.categoria.trim() === '') {
      alert('La categoría es obligatoria');
      return;
    }
    
    if (parseFloat(formData.precio_venta) <= parseFloat(formData.precio_costo)) {
      alert('El precio de venta debe ser mayor al precio de costo');
      return;
    }
    
    onSubmit(formData);
  };

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

              {/* Mostrar margen de ganancia */}
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
                    onFocus={() => categoriaInput && setMostrarSugerencias(true)}
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
                        maxHeight: '96px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 1000
                      }}
                    >
                      {sugerenciasCategorias.length > 0 ? (
                        sugerenciasCategorias.map((cat, idx) => (
                          <div
                            key={idx}
                            onClick={() => seleccionarCategoria(cat)}
                            style={{
                              padding: '0.75rem 1rem',
                              cursor: 'pointer',
                              borderBottom: idx < sugerenciasCategorias.length - 1 ? '1px solid #f3f4f6' : 'none',
                              transition: 'background-color 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            {cat}
                          </div>
                        ))
                      ) : (
                        <div
                          onClick={crearNuevaCategoria}
                          style={{
                            padding: '0.75rem 1rem',
                            cursor: 'pointer',
                            color: '#3b82f6',
                            fontWeight: 600,
                            transition: 'background-color 0.15s'
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

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={handleChange}
                    className="input"
                    placeholder="7891234567890"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer fijo - SIEMPRE VISIBLE */}
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