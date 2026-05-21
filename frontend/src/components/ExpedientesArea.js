import React, { useEffect, useState, useCallback } from 'react';
import axios from '../services/axiosConfig';

const ORIGEN_BADGE = {
  Externo: { bg: 'bg-warning-subtle text-warning', icon: 'bi-box-arrow-in-down' },
  Interno: { bg: 'bg-info-subtle text-info',       icon: 'bi-box-arrow-up'      },
};

const TarjetaExpediente = ({ expediente, onVerDetalle }) => {
  const badge = ORIGEN_BADGE[expediente.origen] || ORIGEN_BADGE.Externo;

  return (
    <tr
      style={{ cursor: 'pointer' }}
      onClick={() => onVerDetalle(expediente)}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg, #f8fafc)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <td className="ps-4 py-3">
        <div className="fw-semibold small">{expediente.correlativo}</div>
      </td>
      <td className="py-3">
        <div className="small fw-medium">{expediente.nombre}</div>
        {expediente.materia && (
          <div className="text-muted" style={{ fontSize: 11 }}>{expediente.materia}</div>
        )}
      </td>
      <td className="py-3 small">{expediente.tipo_documento}</td>
      <td className="py-3 small">{expediente.categoria}</td>
      <td className="py-3">
        <span className={`badge ${badge.bg} d-flex align-items-center gap-1`} style={{ fontSize: 10, width: 'fit-content' }}>
          <i className={`bi ${badge.icon}`} />
          {expediente.origen}
        </span>
      </td>
      <td className="py-3 small text-muted">
        {expediente.fecha_ingreso
          ? new Date(expediente.fecha_ingreso).toLocaleDateString('es-CL')
          : '—'}
      </td>
      <td className="py-3">
        {(() => {
          const BADGE_ESTADO = {
            'Borrador':          'bg-secondary-subtle text-secondary',
            'Derivado':          'bg-primary-subtle text-primary',
            'En Revisión':       'bg-warning-subtle text-warning',
            'En Colaboración':   'bg-orange-subtle text-warning',
            'En Aprobación':     'bg-success-subtle text-success',
            'Terminado':         'bg-success text-white',
          };
          const cls = BADGE_ESTADO[expediente.estado] || 'bg-secondary-subtle text-secondary';
          return (
            <span className={`badge ${cls}`} style={{ fontSize: 10 }}>
              {expediente.estado}
            </span>
          );
        })()}
      </td>
      <td className="pe-4 py-3">
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ fontSize: 11 }}
          onClick={e => { e.stopPropagation(); onVerDetalle(expediente); }}
        >
          <i className="bi bi-folder2-open me-1" />
          Abrir
        </button>
      </td>
    </tr>
  );
};

const ExpedientesArea = ({ unidad, usuario, onVerDetalle, onVolver }) => {
  const [expedientes,  setExpedientes]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [busqueda,     setBusqueda]     = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const fetchExpedientes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/expedientes/area/${unidad.area_id}`);
      setExpedientes(data);
    } catch (err) {
      setError('No se pudieron cargar los expedientes de esta unidad.');
    } finally {
      setLoading(false);
    }
  }, [unidad.area_id]);

  useEffect(() => { fetchExpedientes(); }, [fetchExpedientes]);

  const ESTADOS_FLUJO = ['Borrador', 'Derivado', 'En Revisión', 'En Colaboración', 'En Aprobación', 'Terminado'];

  const expedientesFiltrados = expedientes.filter(e => {
    const q = busqueda.toLowerCase();
    const coincideBusqueda =
      e.correlativo?.toLowerCase().includes(q) ||
      e.nombre?.toLowerCase().includes(q) ||
      e.materia?.toLowerCase().includes(q) ||
      e.emisor?.toLowerCase().includes(q);
    const coincideOrigen = filtroOrigen === 'todos' || e.origen === filtroOrigen;
    const coincideEstado = filtroEstado === 'todos' || e.estado === filtroEstado;
    return coincideBusqueda && coincideOrigen && coincideEstado;
  });

  return (
    <div>
      {/* Botón volver */}
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={onVolver}>
        <i className="bi bi-arrow-left me-1" />
        Volver al detalle de la unidad
      </button>

      {/* Encabezado */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--primary), #6366f1)' }} />
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
              <div className="d-flex align-items-center gap-2 text-muted small">
                <i className="bi bi-diagram-3-fill" style={{ fontSize: 11 }} />
                <span>{unidad.area_nombre}</span>
                <span>·</span>
                <i className="bi bi-building" style={{ fontSize: 11 }} />
                <span>{unidad.contratista_nombre}</span>
              </div>
            </div>
            {!loading && (
              <div className="badge bg-primary-subtle text-primary px-3 py-2" style={{ fontSize: 12 }}>
                {expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtros */}
      {!loading && expedientes.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="d-flex gap-2 flex-wrap">
            {/* Filtro origen */}
            {['todos', 'Externo', 'Interno'].map(o => (
              <button
                key={o}
                className={`btn btn-sm ${filtroOrigen === o ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={{ fontSize: 12 }}
                onClick={() => setFiltroOrigen(o)}
              >
                {o === 'todos' ? `Todos (${expedientes.length})` : o}
              </button>
            ))}
            {/* Separador visual */}
            <span className="text-muted small align-self-center px-1">|</span>
            {/* Filtro estado */}
            <select
              className="form-select form-select-sm"
              style={{ fontSize: 12, width: 'auto' }}
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {ESTADOS_FLUJO.map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>
          <div style={{ maxWidth: 280 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" style={{ fontSize: 12 }} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar por correlativo, nombre…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

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
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={fetchExpedientes}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : expedientes.length === 0 ? (
            <div className="text-center py-5">
              <div style={{
                width: 64, height: 64, borderRadius: 14, margin: '0 auto 16px',
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="bi bi-folder2" style={{ fontSize: 30, color: 'var(--primary)' }} />
              </div>
              <h6 className="fw-bold mb-1">Sin expedientes</h6>
              <p className="text-muted small mb-0">Esta unidad no tiene expedientes registrados aún.</p>
            </div>
          ) : expedientesFiltrados.length === 0 ? (
            <div className="text-center py-5 text-muted small">
              No se encontraron expedientes que coincidan con la búsqueda
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 small text-muted fw-semibold">Correlativo</th>
                    <th className="small text-muted fw-semibold">Nombre</th>
                    <th className="small text-muted fw-semibold">Tipo Doc.</th>
                    <th className="small text-muted fw-semibold">Categoría</th>
                    <th className="small text-muted fw-semibold">Origen</th>
                    <th className="small text-muted fw-semibold">Fecha Ingreso</th>
                    <th className="small text-muted fw-semibold">Estado</th>
                    <th className="pe-4 small text-muted fw-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {expedientesFiltrados.map(exp => (
                    <TarjetaExpediente
                      key={exp.id}
                      expediente={exp}
                      onVerDetalle={onVerDetalle}
                    />
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

export default ExpedientesArea;