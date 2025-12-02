import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../api/api';
import ProductoForm from './ProductoForm';

const Stock = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productoEdit, setProductoEdit] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const response = await getProductos();
      setProductos(response.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
      alert('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearProducto = async (data) => {
    try {
      await createProducto(data);
      alert('Producto creado exitosamente');
      setShowForm(false);
      cargarProductos();
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('Error al crear producto');
    }
  };

  const handleActualizarProducto = async (data) => {
    try {
      await updateProducto(productoEdit.id, data);
      alert('Producto actualizado exitosamente');
      setShowForm(false);
      setProductoEdit(null);
      cargarProductos();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      alert('Error al actualizar producto');
    }
  };

  const handleEliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      await deleteProducto(id);
      alert('Producto eliminado exitosamente');
      cargarProductos();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar producto');
    }
  };

  const getEstadoStock = (producto) => {
    if (producto.stock < 10) return { text: 'Crítico', color: '#fee2e2', textColor: '#991b1b' };
    if (producto.stock < producto.stock_minimo) return { text: 'Bajo', color: '#fef3c7', textColor: '#92400e' };
    return { text: 'Normal', color: '#d1fae5', textColor: '#065f46' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Control de Stock</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={cargarProductos} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
            <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
            Actualizar
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={18} style={{ marginRight: '0.5rem' }} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        border: '2px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Producto</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Categoría</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Precio</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Stock</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Estado</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(producto => {
              const estado = getEstadoStock(producto);
              return (
                <tr key={producto.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{producto.nombre}</td>
                  <td style={{ padding: '1rem' }}>{producto.categoria || '-'}</td>
                  <td style={{ padding: '1rem', color: '#059669', fontWeight: 'bold' }}>
                    ${producto.precio.toFixed(2)}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{producto.stock}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      backgroundColor: estado.color,
                      color: estado.textColor,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      {estado.text}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setProductoEdit(producto);
                          setShowForm(true);
                        }}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminarProducto(producto.id)}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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