import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import axios from '../../services/axiosConfig';

// ─── Colores por estado ───────────────────────────────────────────────────────
const COLORES_ESTADO = {
  'Borrador':       '#94a3b8',
  'Derivado':       '#3b82f6',
  'En Revisión':    '#f59e0b',
  'En Colaboración':'#f97316',
  'En Aprobación':  '#8b5cf6',
  'Terminado':      '#16a34a',
};

const COLORES_BAR = ['#0f766e', '#0284c7', '#7c3aed', '#b45309', '#dc2626', '#16a34a', '#ea580c', '#be185d'];

const FILTROS_ESTADO = [
  { label: 'Todos',          value: '' },
  { label: 'Borrador',       value: 'Borrador' },
  { label: 'Derivado',       value: 'Derivado' },
  { label: 'En Revisión',    value: 'En Revisión' },
  { label: 'En Colaboración',value: 'En Colaboración' },
  { label: 'En Aprobación',  value: 'En Aprobación' },
  { label: 'Terminado',      value: 'Terminado' },
];

// ─── Tarjeta de métrica simple ────────────────────────────────────────────────
const MetricaCard = ({ titulo, valor, icono, color, bg }) => (
  <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 10 }}>
    <div className="card-body d-flex align-items-center gap-3 p-3">
      <div style={{ width: 44, height: 44, borderRadius: 10, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`bi ${icono}`} style={{ fontSize: 20, color }} />
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{valor}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{titulo}</div>
      </div>
    </div>
  </div>
);

// ─── Contenedor de gráfico ────────────────────────────────────────────────────
const GraficoCard = ({ titulo, children }) => (
  <div className="card border-0 shadow-sm" style={{ borderRadius: 10 }}>
    <div className="card-body p-4">
      <div className="fw-semibold mb-3" style={{ fontSize: 14, color: '#1e293b' }}>{titulo}</div>
      {children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div className="fw-semibold mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color }}>{p.name || 'Total'}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const DashboardPage = ({ usuario }) => {
  const [expedientes, setExpedientes] = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [error,       setError]       = useState('');
  const [filtroArea,  setFiltroArea]  = useState('');
  const [filtroEstado,setFiltroEstado]= useState('');
  const [filtroAnio,  setFiltroAnio]  = useState('');

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const res = await axios.get('/api/expedientes');
      setExpedientes(res.data || []);
    } catch {
      setError('Error al cargar los datos del dashboard');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Opciones de filtro ──────────────────────────────────────────────────────
  const areas = [...new Map(expedientes.map(e => [e.area_id, { id: e.area_id, nombre: e.area_nombre }])).values()]
    .filter(a => a.nombre);
  const anios = [...new Set(expedientes.map(e => new Date(e.fecha_ingreso).getFullYear()))]
    .filter(Boolean).sort((a, b) => b - a);

  // ── Aplicar filtros ─────────────────────────────────────────────────────────
  const expedientesFiltrados = expedientes.filter(e => {
    if (filtroArea   && String(e.area_id)  !== filtroArea)   return false;
    if (filtroEstado && e.estado           !== filtroEstado) return false;
    if (filtroAnio   && String(new Date(e.fecha_ingreso).getFullYear()) !== filtroAnio) return false;
    return true;
  });

  // ── Agregaciones ────────────────────────────────────────────────────────────
  const porEstado = Object.entries(
    expedientesFiltrados.reduce((acc, e) => {
      acc[e.estado] = (acc[e.estado] || 0) + 1;
      return acc;
    }, {})
  ).map(([nombre, total]) => ({ nombre, total }));

  const porArea = Object.entries(
    expedientesFiltrados.reduce((acc, e) => {
      const nombre = e.area_nombre || 'Sin área';
      acc[nombre] = (acc[nombre] || 0) + 1;
      return acc;
    }, {})
  ).map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const porProceso = Object.entries(
    expedientesFiltrados.reduce((acc, e) => {
      const nombre = e.proceso_nombre || 'Sin proceso';
      acc[nombre] = (acc[nombre] || 0) + 1;
      return acc;
    }, {})
  ).map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  const porAnio = Object.entries(
    expedientesFiltrados.reduce((acc, e) => {
      const anio = new Date(e.fecha_ingreso).getFullYear();
      if (anio) acc[anio] = (acc[anio] || 0) + 1;
      return acc;
    }, {})
  ).map(([nombre, total]) => ({ nombre: String(nombre), total }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // ── Métricas rápidas ────────────────────────────────────────────────────────
  const total      = expedientesFiltrados.length;
  const activos    = expedientesFiltrados.filter(e => !['Borrador', 'Terminado'].includes(e.estado)).length;
  const terminados = expedientesFiltrados.filter(e => e.estado === 'Terminado').length;
  const borradores = expedientesFiltrados.filter(e => e.estado === 'Borrador').length;

  if (cargando) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Cargando dashboard...
    </div>
  );

  if (error) return (
    <div className="alert alert-danger py-2 small">{error}</div>
  );

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 className="fw-bold mb-1">
            <i className="bi bi-bar-chart-fill me-2" style={{ color: 'var(--primary)' }} />
            Dashboard de Reportes
          </h5>
          <p className="text-muted small mb-0">Métricas de expedientes por estado, área, proceso y año</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargar} disabled={cargando}>
          <i className="bi bi-arrow-clockwise me-1" />Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 10 }}>
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-medium mb-1">Área</label>
              <select className="form-select form-select-sm" value={filtroArea}
                onChange={e => setFiltroArea(e.target.value)}>
                <option value="">Todas las áreas</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-medium mb-1">Estado</label>
              <select className="form-select form-select-sm" value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}>
                {FILTROS_ESTADO.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-medium mb-1">Año</label>
              <select className="form-select form-select-sm" value={filtroAnio}
                onChange={e => setFiltroAnio(e.target.value)}>
                <option value="">Todos los años</option>
                {anios.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              {(filtroArea || filtroEstado || filtroAnio) && (
                <button className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => { setFiltroArea(''); setFiltroEstado(''); setFiltroAnio(''); }}>
                  <i className="bi bi-x-circle me-1" />Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <MetricaCard titulo="Total Expedientes" valor={total}      icono="bi-folder2-open"   color="#0f766e" bg="#ccfbf1" />
        </div>
        <div className="col-6 col-md-3">
          <MetricaCard titulo="En Proceso"        valor={activos}    icono="bi-arrow-repeat"   color="#d97706" bg="#fef3c7" />
        </div>
        <div className="col-6 col-md-3">
          <MetricaCard titulo="Terminados"         valor={terminados} icono="bi-check-circle"   color="#16a34a" bg="#dcfce7" />
        </div>
        <div className="col-6 col-md-3">
          <MetricaCard titulo="Borradores"         valor={borradores} icono="bi-pencil-square"  color="#64748b" bg="#f1f5f9" />
        </div>
      </div>

      {/* Gráficos */}
      <div className="row g-4">

        {/* Por Estado — Pie */}
        <div className="col-md-5">
          <GraficoCard titulo="Expedientes por Estado">
            {porEstado.length === 0 ? (
              <div className="text-center text-muted py-4 small">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={porEstado} dataKey="total" nameKey="nombre"
                    cx="50%" cy="50%" outerRadius={90} label={({ nombre, percent }) =>
                      `${nombre} (${(percent * 100).toFixed(0)}%)`
                    } labelLine={false}>
                    {porEstado.map((entry, i) => (
                      <Cell key={i} fill={COLORES_ESTADO[entry.nombre] || COLORES_BAR[i % COLORES_BAR.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </GraficoCard>
        </div>

        {/* Por Año — Bar */}
        <div className="col-md-7">
          <GraficoCard titulo="Expedientes por Año">
            {porAnio.length === 0 ? (
              <div className="text-center text-muted py-4 small">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porAnio} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Expedientes" radius={[4, 4, 0, 0]}>
                    {porAnio.map((_, i) => <Cell key={i} fill={COLORES_BAR[i % COLORES_BAR.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GraficoCard>
        </div>

        {/* Por Área — Bar horizontal */}
        <div className="col-md-6">
          <GraficoCard titulo="Expedientes por Área">
            {porArea.length === 0 ? (
              <div className="text-center text-muted py-4 small">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porArea} layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" width={110}
                    tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Expedientes" radius={[0, 4, 4, 0]}>
                    {porArea.map((_, i) => <Cell key={i} fill={COLORES_BAR[i % COLORES_BAR.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GraficoCard>
        </div>

        {/* Por Proceso — Bar */}
        <div className="col-md-6">
          <GraficoCard titulo="Expedientes por Proceso">
            {porProceso.length === 0 ? (
              <div className="text-center text-muted py-4 small">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={porProceso} layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nombre" width={110}
                    tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Expedientes" radius={[0, 4, 4, 0]}>
                    {porProceso.map((_, i) => <Cell key={i} fill={COLORES_BAR[i % COLORES_BAR.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </GraficoCard>
        </div>

      </div>
    </>
  );
};

export default DashboardPage;