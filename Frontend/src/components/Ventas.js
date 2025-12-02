import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { getProductos, createVenta } from '../api/api';

const Ventas = () => {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await getProductos();
      setProductos(response.data.filter(p => p.stock > 0));
    } catch (error) {
      console.error('Error cargando productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.categoria && p.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const agregarAlCarrito = (producto) => {
    const itemExistente = carrito.find(item => item.producto_id === producto.id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= producto.stock) {
        alert('No hay suficiente stock');
        return;
      }
      setCarrito(carrito.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio,
        cantidad: 1,
        stock_disponible: producto.stock
      }]);
    }
  };

  const modificarCantidad = (producto_id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(producto_id);
      return;
    }

    const item = carrito.find(i => i.producto_id === producto_id);
    if (nuevaCantidad > item.stock_disponible) {
      alert('No hay suficiente stock');
      return;
    }

    setCarrito(carrito.map(item =>
      item.producto_id === producto_id
        ? { ...item, cantidad: nuevaCantidad }
        : item
    ));
  };

  const eliminarDelCarrito = (producto_id) => {
    setCarrito(carrito.filter(item => item.producto_id !== producto_id));
  };

  const finalizarVenta = async () => {
    if (carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      const ventaData = {
        items: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario
        })),
        metodo_pago: 'efectivo'
      };

      await createVenta(ventaData);
      alert('Venta registrada exitosamente!');
      setCarrito([]);
      cargarProductos(); // Recargar productos para actualizar stock
    } catch (error) {
      console.error('Error creando venta:', error);
      alert(error.response?.data?.detail || 'Error al registrar la venta');
    }
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Panel de productos */}
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Nueva Venta
          </h2>

          {/* Búsqueda */}
          <div style={{
            backgroundColor: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={20} style={{ color: '#6b7280' }} />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input"
                style={{ border: 'none', outline: 'none' }}
              />
            </div>
          </div>

          {/* Productos */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {productosFiltrados.map(producto => (
              <div
                key={producto.id}
                style={{
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {producto.nombre}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {producto.categoria || 'Sin categoría'}
                    </p>
                  </div>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669' }}>
                    ${producto.precio.toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Stock: {producto.stock}
                  </span>
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Carrito
          </h2>

          <div style={{
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {carrito.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af'
              }}>
                <ShoppingCart size={48} />
                <p style={{ marginTop: '1rem' }}>El carrito está vacío</p>
              </div>
            ) : (
              <>
                <div style={{ flex: 1, marginBottom: '1rem' }}>
                  {carrito.map(item => (
                    <div
                      key={item.producto_id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        paddingBottom: '0.75rem',
                        marginBottom: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontWeight: 600 }}>{item.nombre}</h4>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            ${item.precio_unitario.toFixed(2)} c/u
                          </p>
                        </div>
                        <button
                          onClick={() => eliminarDelCarrito(item.producto_id)}
                          style={{
                            padding: '0.25rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#ef4444'
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => modificarCantidad(item.producto_id, item.cantidad - 1)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 'bold', minWidth: '2rem', textAlign: 'center' }}>
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => modificarCantidad(item.producto_id, item.cantidad + 1)}
                          style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#e5e7eb',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                        <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
                          ${(item.precio_unitario * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  backgroundColor: '#dbeafe',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  border: '2px solid #93c5fd'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>Total:</span>
                    <span style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1e40af' }}>
                      ${totalCarrito.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={finalizarVenta}
                    className="btn btn-success"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '1.125rem' }}
                  >
                    Finalizar Venta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ventas;