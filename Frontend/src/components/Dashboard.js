import React, { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { getDashboard, getProductosStockBajo } from '../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_ventas: 0,
    cantidad_ventas: 0,
    productos_vendidos: 0,
    ventas_hoy: 0,
    productos_stock_bajo: 0
  });
  const [productosStockBajo, setProductosStockBajo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dashboardRes, stockBajoRes] = await Promise.all([
        getDashboard(),
        getProductosStockBajo()
      ]);
      setStats(dashboardRes.data);
      setProductosStockBajo(stockBajoRes.data);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      alert('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Panel de Control
      </h2>

      {/* Tarjetas de estadísticas */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '2px solid #93c5fd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                Total Ventas
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>
                ${stats.total_ventas.toFixed(2)}
              </p>
            </div>
            <DollarSign size={48} style={{ color: '#3b82f6' }} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#dcfce7',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '2px solid #86efac'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: 600 }}>
                Productos Vendidos
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>
                {stats.productos_vendidos}
              </p>
            </div>
            <Package size={48} style={{ color: '#22c55e' }} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#f3e8ff',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '2px solid #d8b4fe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#6b21a8', fontWeight: 600 }}>
                Transacciones
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#581c87' }}>
                {stats.cantidad_ventas}
              </p>
            </div>
            <ShoppingCart size={48} style={{ color: '#a855f7' }} />
          </div>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '2px solid #fcd34d'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#92400e', fontWeight: 600 }}>
                Ventas Hoy
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#78350f' }}>
                ${stats.ventas_hoy.toFixed(2)}
              </p>
            </div>
            <DollarSign size={48} style={{ color: '#f59e0b' }} />
          </div>
        </div>
      </div>

      {/* Productos con stock bajo */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '0.5rem',
        border: '2px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            Productos con Stock Bajo
          </h3>
        </div>

        {productosStockBajo.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            No hay productos con stock bajo
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {productosStockBajo.map(producto => (
              <div
                key={producto.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  borderRadius: '0.375rem',
                  border: '1px solid #fcd34d'
                }}
              >
                <span style={{ fontWeight: 600 }}>{producto.nombre}</span>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  Stock: {producto.stock} / Mínimo: {producto.stock_minimo}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;