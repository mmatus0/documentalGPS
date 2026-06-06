import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';

// ─── Colores por estado (HU-16 / HU-17) ───────────────────────────────────────
const ESTADO_CONFIG = {
  'Borrador':        { color: '#64748b', bg: '#f1f5f9', icon: 'bi-file-earmark'          },
  'Derivado':        { color: '#2563eb', bg: '#eff6ff', icon: 'bi-arrow-right-circle'     },
  'En Revisión':     { color: '#d97706', bg: '#fffbeb', icon: 'bi-eye'                    },
  'En Colaboración': { color: '#ea580c', bg: '#fff7ed', icon: 'bi-people'                 },
  'En Aprobación':   { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle'           },
  'Terminado':       { color: '#0f766e', bg: '#f0fdfa', icon: 'bi-check-circle-fill'      },
};

const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_CONFIG[estado] || { color: '#64748b', bg: '#f1f5f9', icon: 'bi-circle' };
  return (
    <span
      className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
      style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, border: `1px solid ${cfg.color}22` }}
    >
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {estado}
    </span>
  );
};

const ORIGEN_BADGE = {
  Externo: { bg: 'bg-warning-subtle text-warning', icon: 'bi-box-arrow-in-down' },
  Interno: { bg: 'bg-info-subtle text-info',       icon: 'bi-box-arrow-up'      },
};

// ─── Dashboard de contadores (HU-16) ──────────────────────────────────────────
const DashboardContadores = ({ expedientes, filtroEstado, onFiltrarEstado }) => {
  const estados = ['Borrador', 'Derivado', 'En Revisión', 'En Colaboración', 'En Aprobación', 'Terminado'];
  return (
    <div className="row g-3 mb-4">
      {estados.map(est => {
        const cfg   = ESTADO_CONFIG[est] || {};
        const count = expedientes.filter(e => e.estado === est).length;
        const activo = filtroEstado === est;
        return (
          <div className="col-6 col-md-4 col-lg-2" key={est}>
            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: 10, cursor: 'pointer',
                border: activo ? `2px solid ${cfg.color}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onClick={() => onFiltrarEstado(activo ? null : est)}
            >
              <div className="card-body px-3 py-3 text-center">
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 8, margin: '0 auto 8px',
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className={`bi ${cfg.icon}`} style={{ fontSize: 16, color: cfg.color }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{count}</div>
                <div className="text-muted mt-1" style={{ fontSize: 10, lineHeight: 1.3 }}>{est}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Fila de expediente ────────────────────────────────────────────────────────
const FilaExpediente = ({ exp, onAbrir, mostrarArea }) => {
  const origenBadge = ORIGEN_BADGE[exp.origen] || ORIGEN_BADGE.Externo;
  return (
    <tr style={{ cursor: 'pointer' }}
      onClick={() => onAbrir(exp)}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <td className="ps-4 py-3">
        <div className="fw-semibold small" style={{ color: 'var(--primary)' }}>{exp.correlativo}</div>
      </td>
      <td className="py-3">
        <div className="small fw-medium">{exp.nombre}</div>
        {exp.materia && <div className="text-muted" style={{ fontSize: 11 }}>{exp.materia}</div>}
      </td>
      <td className="py-3 small text-muted">{exp.tipo_documento}</td>
      {mostrarArea && (
        <td className="py-3 small text-muted">
          <div>{exp.area_nombre}</div>
          <div style={{ fontSize: 10 }}>{exp.contratista_nombre}</div>
        </td>
      )}
      <td className="py-3">
        <span className={`badge ${origenBadge.bg} d-flex align-items-center gap-1`} style={{ fontSize: 10, width: 'fit-content' }}>
          <i className={`bi ${origenBadge.icon}`} />{exp.origen}
        </span>
      </td>
      <td className="py-3 small text-muted">
        {exp.fecha_ingreso ? new Date(exp.fecha_ingreso).toLocaleDateString('es-CL') : '—'}
      </td>
      <td className="py-3"><EstadoBadge estado={exp.estado} /></td>
      <td className="pe-4 py-3">
        <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11 }}
          onClick={e => { e.stopPropagation(); onAbrir(exp); }}>
          <i className="bi bi-folder2-open me-1" />Ver
        </button>
      </td>
    </tr>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const ExpedientesListado = ({ usuario, onVerDetalle }) => {
  const [expedientes,    setExpedientes]    = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [busqueda,       setBusqueda]       = useState('');
  const [filtroEstado,   setFiltroEstado]   = useState(null);
  const [filtroOrigen,   setFiltroOrigen]   = useState('');
  const [filtroTipoDoc,  setFiltroTipoDoc]  = useState('');
  const [opcionesFiltro, setOpcionesFiltro] = useState({ tipos_documento: [], estados: [] });

  const esAdmin = usuario.rol_id === 1;

  const fetchExpedientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (busqueda)      params.busqueda     = busqueda;
      if (filtroOrigen)  params.origen       = filtroOrigen;
      if (filtroTipoDoc) params.tipo_doc_id  = filtroTipoDoc;
      const { data } = await axios.get('/api/expedientes', { params });
      setExpedientes(data);
    } catch (err) {
      setError('No se pudieron cargar los expedientes.');
    } finally {
      setLoading(false);
    }
  }, [busqueda, filtroOrigen, filtroTipoDoc]);

  useEffect(() => {
    axios.get('/api/expedientes/filtros/opciones')
      .then(r => setOpcionesFiltro(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]);

  const expedientesFiltrados = filtroEstado
    ? expedientes.filter(e => e.estado === filtroEstado)
    : expedientes;

  return (
    <div>
      {/* Encabezado */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--primary), #2563eb)' }} />
        <div className="card-body px-4 py-4">
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="bi bi-folder2-open" style={{ fontSize: 26, color: 'var(--primary)' }} />
            </div>
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-1">Expedientes</h4>
              <p className="text-muted small mb-0">
                {esAdmin ? 'Todos los expedientes del sistema' : 'Expedientes de tus unidades organizativas'}
              </p>
            </div>
            {!loading && (
              <div className="badge bg-primary-subtle text-primary px-3 py-2" style={{ fontSize: 12 }}>
                {expedientesFiltrados.length} expediente{expedientesFiltrados.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard de contadores (HU-16) */}
      {!loading && !error && <DashboardContadores expedientes={expedientes} filtroEstado={filtroEstado} onFiltrarEstado={setFiltroEstado} />}

      {/* Filtros */}
      <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 10 }}>
        <div className="card-body px-4 py-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted" style={{ fontSize: 12 }} />
                </span>
                <input type="text" className="form-control border-start-0"
                  placeholder="Buscar por nombre, correlativo, emisor…"
                  value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={filtroTipoDoc}
                onChange={e => setFiltroTipoDoc(e.target.value)}>
                <option value="">Todos los tipos</option>
                {opcionesFiltro.tipos_documento.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={filtroOrigen}
                onChange={e => setFiltroOrigen(e.target.value)}>
                <option value="">Todos los orígenes</option>
                <option value="Externo">Externo</option>
                <option value="Interno">Interno</option>
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2 justify-content-end">
              {filtroEstado && (
                <span className="badge d-flex align-items-center gap-1 px-2"
                  style={{ background: ESTADO_CONFIG[filtroEstado]?.bg, color: ESTADO_CONFIG[filtroEstado]?.color, fontSize: 11 }}>
                  {filtroEstado}
                  <i className="bi bi-x" style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(null)} />
                </span>
              )}
              {(busqueda || filtroTipoDoc || filtroOrigen || filtroEstado) && (
                <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }}
                  onClick={() => { setBusqueda(''); setFiltroTipoDoc(''); setFiltroOrigen(''); setFiltroEstado(null); }}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Cargando expedientes…
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={fetchExpedientes}>Reintentar</button>
              </div>
            </div>
          ) : expedientesFiltrados.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-folder2 text-muted" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
              <p className="text-muted small mb-0">No se encontraron expedientes.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 small text-muted fw-semibold">Correlativo</th>
                    <th className="small text-muted fw-semibold">Nombre</th>
                    <th className="small text-muted fw-semibold">Tipo Doc.</th>
                    {esAdmin && <th className="small text-muted fw-semibold">Área</th>}
                    <th className="small text-muted fw-semibold">Origen</th>
                    <th className="small text-muted fw-semibold">Fecha Ingreso</th>
                    <th className="small text-muted fw-semibold">Estado</th>
                    <th className="pe-4 small text-muted fw-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {expedientesFiltrados.map(exp => (
                    <FilaExpediente key={exp.id} exp={exp} onAbrir={onVerDetalle} mostrarArea={esAdmin} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpedientesListado;
