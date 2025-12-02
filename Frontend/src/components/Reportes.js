import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getVentas } from '../api/api';

const Reportes = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarVentas();
  }, []);

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const response = await getVentas();
      setVentas(response.data.reverse()); // Más recientes primero
    } catch (error) {
      console.error('Error cargando ventas:', error);
      alert('Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Cargando ventas...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
          Reportes y Estadísticas
        </h2>
        <button onClick={cargarVentas} className="btn" style={{ backgroundColor: '#6b7280', color: 'white' }}>
          <RefreshCw size={18} style={{ marginRight: '0.5rem' }} />
          Actualizar
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        border: '2px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Historial de Ventas
        </h3>

        {ventas.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No hay ventas registradas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ventas.map(venta => (
              <div
                key={venta.id}
                style={{
                  border: '2px solid #e5e7eb',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                      Venta #{venta.id}
                    </span>
                    <span style={{
                      marginLeft: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {formatearFecha(venta.fecha)}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#059669'
                  }}>
                    ${venta.total.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.75rem',
                  borderRadius: '0.375rem'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    marginBottom: '0.5rem',
                    color: '#4b5563'
                  }}>
                    Productos:
                  </p>
                  {venta.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}
                    >
                      • Producto ID: {item.producto_id} - Cantidad: {item.cantidad} - 
                      Subtotal: ${item.subtotal.toFixed(2)}
                    </div>
                  ))}
                  <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px solid #e5e7eb',
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>
                    Método de pago: <span style={{ fontWeight: 600 }}>{venta.metodo_pago}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reportes;