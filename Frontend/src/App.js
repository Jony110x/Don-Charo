import React, { useState } from 'react';
import { Home, ShoppingCart, Package, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Ventas from './components/Ventas';
import Stock from './components/Stock';
import Reportes from './components/Reportes';

function App() {
  const [vistaActual, setVistaActual] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', nombre: 'Inicio', icono: Home, componente: Dashboard },
    { id: 'ventas', nombre: 'Ventas', icono: ShoppingCart, componente: Ventas },
    { id: 'stock', nombre: 'Stock', icono: Package, componente: Stock },
    { id: 'reportes', nombre: 'Reportes', icono: BarChart3, componente: Reportes }
  ];

  const ComponenteActual = menuItems.find(item => item.id === vistaActual)?.componente;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(to right, #2563eb, #1e40af)',
        color: 'white',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            Sistema de Gestión - Autoservicio Don Charo
          </h1>
          <p style={{ color: '#bfdbfe', marginTop: '0.25rem' }}>
            Control de Ventas, Stock y Finanzas
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            {menuItems.map(item => {
              const Icono = item.icono;
              const activo = vistaActual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '1rem 1.5rem',
                    fontWeight: 600,
                    border: 'none',
                    backgroundColor: activo ? '#eff6ff' : 'transparent',
                    color: activo ? '#1e40af' : '#6b7280',
                    borderBottom: activo ? '4px solid #1e40af' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!activo) e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (!activo) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icono size={20} />
                  {item.nombre}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {ComponenteActual && <ComponenteActual />}
      </div>
    </div>
  );
}

export default App;