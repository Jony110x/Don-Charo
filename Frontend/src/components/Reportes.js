/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Package, Clock, RefreshCw } from 'lucide-react';
import { getDashboard, getVentasPorPeriodo, getCategoriasVendidas, getProductosVendidos, getVentasPorHorario, getVentasPorHorarioFecha, getGanancias, getMetodosPago } from '../api/api';
import { useToast } from '../Toast';

// Tooltip personalizado para gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '0.75rem',
        border: '2px solid #e5e7eb',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#374151' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, fontSize: '0.875rem', margin: '0.25rem 0' }}>
            {entry.name}: {typeof entry.value === 'number' ? 
              (entry.name.includes('%') ? `${entry.value.toFixed(1)}%` : `${entry.value.toFixed(2)}`) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Componente skeleton para estado de carga
const ChartSkeleton = ({ height = 180 }) => (
  <div style={{ 
    width: '100%', 
    height: `${height}px`,
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 1.5s ease-in-out infinite'
  }}>
    <div style={{ textAlign: 'center', color: '#9ca3af' }}>
      <div style={{ 
        width: '60px', 
        height: '60px', 
        margin: '0 auto',
        backgroundColor: '#e5e7eb',
        borderRadius: '0.5rem',
        marginBottom: '0.5rem',
        animation: 'pulse 1.5s ease-in-out infinite'
      }} />
      <p style={{ fontSize: '0.75rem' }}>Cargando datos...</p>
    </div>
  </div>
);

const Reportes = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [vistaActual, setVistaActual] = useState('ventas');
  const [periodoVentas, setPeriodoVentas] = useState('dia');
  const [periodoGanancias, setPeriodoGanancias] = useState('mes');
  const [graficoVentas, setGraficoVentas] = useState('cantidad');
  const [fechaHorario, setFechaHorario] = useState('');
  
  // Estados para datos de gráficos
  const [datosVentas, setDatosVentas] = useState([]);
  const [datosVentasGanancia, setDatosVentasGanancia] = useState([]);
  const [datosCategorias, setDatosCategorias] = useState([]);
  const [datosProductos, setDatosProductos] = useState([]);
  const [datosHorarios, setDatosHorarios] = useState([]);
  const [datosGanancias, setDatosGanancias] = useState([]);
  const [datosMetodosPago, setDatosMetodosPago] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  // Inicializar fecha y cargar datos
  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaHorario(hoy);
    cargarDatos();
  }, [periodoVentas, periodoGanancias]);

  // Cargar todos los datos de reportes en paralelo
  const cargarDatos = async () => {
    setLoading(true);
    try {
      const dashRes = await getDashboard();
      setDashboard(dashRes.data);

      const [ventasRes, ganVentasRes, catRes, prodRes, metRes, horRes, ganRes] = await Promise.all([
        getVentasPorPeriodo(periodoVentas),
        getGanancias(periodoVentas),
        getCategoriasVendidas(10),
        getProductosVendidos(10),
        getMetodosPago(),
        getVentasPorHorarioFecha(fechaHorario),
        getGanancias(periodoGanancias)
      ]);

      setDatosVentas(ventasRes.data);
      setDatosVentasGanancia(ganVentasRes.data);
      setDatosCategorias(catRes.data);
      setDatosProductos(prodRes.data);
      setDatosMetodosPago(metRes.data);
      setDatosHorarios(horRes.data);
      setDatosGanancias(ganRes.data);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error('Error al cargar los datos de reportes');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos de horarios para fecha específica
  const cargarDatosHorarios = async (nuevaFecha) => {
    try {
      const horRes = await getVentasPorHorarioFecha(nuevaFecha);
      setDatosHorarios(horRes.data);
    } catch (error) {
      console.error('Error cargando horarios:', error);
      toast.error('Error al cargar datos de horarios');
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div style={{ 
      padding: '0.75rem',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Animación de pulso para skeletons */}
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
        `}
      </style>

      {/* Header con controles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.75rem',
        flexShrink: 0
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dashboard de Reportes</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Selector de período */}
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {['dia', 'semana', 'mes', 'año'].map(periodo => (
              <button
                key={periodo}
                onClick={() => {
                  setPeriodoVentas(periodo);
                  setPeriodoGanancias(periodo);
                }}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: periodoVentas === periodo ? '#3b82f6' : '#e5e7eb',
                  color: periodoVentas === periodo ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: '0.8125rem'
                }}
              >
                {periodo}
              </button>
            ))}
          </div>
          <button 
            onClick={cargarDatos} 
            className="btn" 
            style={{ backgroundColor: '#6b7280', color: 'white', padding: '0.375rem 0.75rem' }} 
            disabled={loading}
          >
            <RefreshCw size={14} style={{ marginRight: '0.5rem' }} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Grid de gráficos con scroll */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        minHeight: 0,
        paddingRight: '0.5rem'
      }}>
        {/* Fila 1: Ventas (3 columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {/* Cantidad de Ventas */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#000000ff' }}>
              Cantidad de Ventas
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={datosVentas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" style={{ fontSize: '0.7rem' }} />
                  <YAxis style={{ fontSize: '0.7rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="cantidad" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Total en Ventas */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#010705ff' }}>
              Total en Ventas
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={datosVentas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" style={{ fontSize: '0.7rem' }} />
                  <YAxis style={{ fontSize: '0.7rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Ganancias */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#000000ff' }}>
              Ganancias
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={datosVentasGanancia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" style={{ fontSize: '0.7rem' }} />
                  <YAxis style={{ fontSize: '0.7rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="ganancia" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fila 2: Categorías, Métodos Pago, Horarios */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          {/* Top Categorías */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Top 10 Categorías
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={datosCategorias.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" style={{ fontSize: '0.65rem' }} angle={-45} textAnchor="end" height={60} />
                  <YAxis style={{ fontSize: '0.7rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Métodos de Pago */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Métodos de Pago
            </h3>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={datosMetodosPago}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => {
                      const total = datosMetodosPago.reduce((sum, item) => sum + item.cantidad, 0);
                      const porcentaje = ((entry.cantidad / total) * 100).toFixed(1);
                      return `${entry.metodo}: ${porcentaje}%`;
                    }}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="cantidad"
                  >
                    {datosMetodosPago.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      const total = datosMetodosPago.reduce((sum, item) => sum + item.cantidad, 0);
                      const porcentaje = ((value / total) * 100).toFixed(1);
                      return [`${value} (${porcentaje}%)`, 'Ventas'];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Ventas por Horario */}
          <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                Ventas por Horario
              </h3>
              <input
                type="date"
                value={fechaHorario}
                onChange={(e) => {
                  setFechaHorario(e.target.value);
                  cargarDatosHorarios(e.target.value);
                }}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.8125rem',
                  cursor: 'pointer'
                }}
              />
            </div>
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={datosHorarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" style={{ fontSize: '0.65rem' }} />
                  <YAxis style={{ fontSize: '0.7rem' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="cantidad" fill="#8b5cf6" name="Cantidad" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fila 3: Top Productos (ancho completo) */}
        <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.5rem', border: '2px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Top 10 Productos Más Vendidos
          </h3>
          {loading ? (
            <ChartSkeleton height={220} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={datosProductos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={80} interval={0} style={{ fontSize: '0.65rem' }} />
                <YAxis style={{ fontSize: '0.7rem' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" fill="#87408dff" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;