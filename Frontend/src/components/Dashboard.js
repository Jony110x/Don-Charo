import { useState, useEffect } from 'react';
import { DollarSign, Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react';
import { getDashboardHoy, getProductosStockBajo, getProductosStockCritico } from '../api/api';
import { useToast  } from '../Toast';

const Dashboard = () => {
  const toast = useToast();
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

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [dashboardRes, stockBajoRes, stockCriticoRes] = await Promise.all([
        getDashboardHoy(), // Usar el nuevo endpoint
        getProductosStockBajo(),
        getProductosStockCritico()
      ]);
      setStats(dashboardRes.data);
      setProductosStockBajo(stockBajoRes.data);
      setProductosStockCritico(stockCriticoRes.data);
      
      // Mostrar toast solo si hay productos críticos o bajo stock
      if (stockCriticoRes.data.length > 0) {
        const cantidad = stockCriticoRes.data.length;
        const mensaje = cantidad === 1 
          ? '🚨 ¡1 producto en stock CRÍTICO!'
          : `🚨 ¡${cantidad} productos en stock CRÍTICO!`;
        toast.error(mensaje);
      } else if (stockBajoRes.data.length > 0) {
        const cantidad = stockBajoRes.data.length;
        const mensaje = cantidad === 1 
          ? '⚠️ 1 producto con stock bajo'
          : `⚠️ ${cantidad} productos con stock bajo`;
        toast.warning(mensaje);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
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
    <div style={{ 
      padding: '1.25rem',
      height: 'calc(100vh - 140px)', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem', flexShrink: 0 }}>
        Panel de Control - Hoy
      </h2>

      {/* Tarjetas de estadísticas - FIJAS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem',
        flexShrink: 0
      }}>
        {/* Ganancias de hoy */}
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

        {/* Ventas de hoy */}
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

        {/* Productos vendidos hoy */}
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

        {/* Transacciones hoy */}
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
      </div>

      {/* Container con scroll para alertas de stock */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Productos con stock crítico */}
        {productosStockCritico.length > 0 && (
          <div style={{
            backgroundColor: '#fee2e2',
            padding: '1.25rem',
            borderRadius: '0.5rem',
            border: '2px solid #fca5a5',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#dc2626' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#991b1b' }}>
                🚨 Stock CRÍTICO (menos de 10 unidades)
              </h3>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              maxHeight: '250px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {productosStockCritico.map(producto => (
                <div
                  key={producto.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    backgroundColor: '#fff',
                    borderRadius: '0.375rem',
                    border: '2px solid #dc2626'
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
                    ⚠️ Stock: {producto.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos con stock bajo */}
        {productosStockBajo.length > 0 && (
          <div style={{
            backgroundColor: 'white',
            padding: '1.25rem',
            borderRadius: '0.5rem',
            border: '2px solid #e5e7eb',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                Productos con Stock Bajo
              </h3>
            </div>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.5rem',
              maxHeight: '250px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
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
                  <span style={{ color: '#92400e', fontWeight: 'bold' }}>
                    Stock: {producto.stock} / Mínimo: {producto.stock_minimo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay alertas */}
        {productosStockCritico.length === 0 && productosStockBajo.length === 0 && (
          <div style={{
            backgroundColor: '#d1fae5',
            padding: '2rem',
            borderRadius: '0.5rem',
            border: '2px solid #86efac',
            textAlign: 'center',
            flexShrink: 0
          }}>
            <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#065f46' }}>
              ✅ No hay productos con stock bajo o crítico
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;