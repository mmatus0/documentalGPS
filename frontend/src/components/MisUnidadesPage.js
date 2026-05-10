import React, { useEffect, useState, useCallback } from 'react';
import axios from '../services/axiosConfig';


const ROL_BADGE = {
  Colaborador: { bg: 'bg-success-subtle text-success', icon: 'bi-pencil-fill' },
  Lector:      { bg: 'bg-secondary-subtle text-secondary', icon: 'bi-eye-fill' },
};

const PERMISO_DETALLE = {
  Colaborador: 'Puedes crear y gestionar expedientes en esta unidad.',
  Lector:      'Tienes acceso de lectura a los expedientes de esta unidad.',
};


const TarjetaUnidad = ({ unidad, onVerDetalle }) => {
  const badge  = ROL_BADGE[unidad.rol_en_area] || ROL_BADGE.Lector;
  const permiso = PERMISO_DETALLE[unidad.rol_en_area] || '';

  return (
    <div className="col-md-6 col-lg-4">
      <div
        className="card border-0 shadow-sm h-100"
        style={{ borderRadius: 12, overflow: 'hidden', transition: 'box-shadow 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
      >
        {/* Banda de color superior */}
        <div
          style={{
            height: 4,
            background: unidad.rol_en_area === 'Colaborador'
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #94a3b8, #64748b)',
          }}
        />

        <div className="card-body px-4 py-3">
          {/* Encabezado */}
          <div className="d-flex align-items-start justify-content-between mb-2">
            <div
              style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <i className="bi bi-diagram-3-fill" style={{ fontSize: 20, color: 'var(--primary)' }} />
            </div>
            <span className={`badge ${badge.bg} d-flex align-items-center gap-1`} style={{ fontSize: 11 }}>
              <i className={`bi ${badge.icon}`} />
              {unidad.rol_en_area}
            </span>
          </div>

          {/* Nombre del área */}
          <h6 className="fw-bold mb-1 mt-2" style={{ fontSize: 14, lineHeight: 1.3 }}>
            {unidad.area_nombre}
          </h6>

          {/* Contratista */}
          <div className="d-flex align-items-center gap-1 text-muted mb-2" style={{ fontSize: 12 }}>
            <i className="bi bi-building" style={{ fontSize: 11 }} />
            <span>{unidad.contratista_nombre}</span>
          </div>

          {/* Permiso */}
          <p className="text-muted mb-3" style={{ fontSize: 11, lineHeight: 1.5 }}>
            {permiso}
          </p>

          {/* Acción */}
          <button
            className="btn btn-outline-primary btn-sm w-100"
            style={{ fontSize: 12 }}
            onClick={() => onVerDetalle(unidad)}
          >
            <i className="bi bi-arrow-right-circle me-1" />
            Ver detalle
          </button>
        </div>
      </div>
    </div>
  );
};


const SinUnidades = ({ rolId }) => (
  <div className="text-center py-5">
    <div
      style={{
        width: 72, height: 72, borderRadius: 16, margin: '0 auto 20px',
        background: 'var(--primary-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <i className="bi bi-diagram-3" style={{ fontSize: 32, color: 'var(--primary)' }} />
    </div>
    <h6 className="fw-bold mb-1">Sin unidades asignadas</h6>
    <p className="text-muted small mb-0">
      {rolId === 2
        ? 'Aún no te han asignado a ninguna Unidad Organizativa. Contacta al administrador.'
        : 'Aún no tienes acceso a ninguna Unidad Organizativa. Contacta al administrador.'}
    </p>
  </div>
);


const MisUnidadesPage = ({ usuario, onVerDetalle }) => {
  const [unidades, setUnidades]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [error,    setError]      = useState(null);
  const [busqueda, setBusqueda]   = useState('');

  const fetchUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/areas/mis-unidades`);
      setUnidades(data);
    } catch (err) {
      setError('No se pudieron cargar tus unidades organizativas.');
      console.error('Error al cargar unidades:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnidades();
  }, [fetchUnidades]);

  const unidadesFiltradas = unidades.filter(u => {
    const q = busqueda.toLowerCase();
    return (
      u.area_nombre?.toLowerCase().includes(q) ||
      u.contratista_nombre?.toLowerCase().includes(q)
    );
  });

  const totalColaborador = unidades.filter(u => u.rol_en_area === 'Colaborador').length;
  const totalLector      = unidades.filter(u => u.rol_en_area === 'Lector').length;

  return (
    <div>
      {/* Encabezado */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body px-4 py-4">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: 52, height: 52, borderRadius: 10,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <i className="bi bi-diagram-3-fill" style={{ fontSize: 26, color: 'var(--primary)' }} />
            </div>
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-1">Mis Unidades Organizativas</h4>
              <p className="text-muted small mb-0">
                Unidades a las que perteneces y tu rol dentro de cada una
              </p>
            </div>
            {/* Badges de resumen */}
            {!loading && unidades.length > 0 && (
              <div className="d-flex gap-2 flex-shrink-0">
                {totalColaborador > 0 && (
                  <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1 px-3 py-2">
                    <i className="bi bi-pencil-fill" />
                    {totalColaborador} Colaborador{totalColaborador !== 1 ? 'es' : ''}
                  </span>
                )}
                {totalLector > 0 && (
                  <span className="badge bg-secondary-subtle text-secondary d-flex align-items-center gap-1 px-3 py-2">
                    <i className="bi bi-eye-fill" />
                    {totalLector} Lector{totalLector !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de búsqueda */}
      {!loading && unidades.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6
            className="fw-bold text-muted mb-0"
            style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}
          >
            {unidadesFiltradas.length} unidad{unidadesFiltradas.length !== 1 ? 'es' : ''} encontrada{unidadesFiltradas.length !== 1 ? 's' : ''}
          </h6>
          <div style={{ maxWidth: 260 }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" style={{ fontSize: 12 }} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Buscar unidad o contratista…"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status" />
          Cargando tus unidades…
        </div>
      ) : error ? (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>{error}</span>
          <button className="btn btn-sm btn-outline-danger ms-auto" onClick={fetchUnidades}>
            Reintentar
          </button>
        </div>
      ) : unidades.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <SinUnidades rolId={usuario.rol_id} />
          </div>
        </div>
      ) : unidadesFiltradas.length === 0 ? (
        <div className="text-center py-5 text-muted small">
          No se encontraron unidades que coincidan con "{busqueda}"
        </div>
      ) : (
        <div className="row g-3">
          {unidadesFiltradas.map(unidad => (
            <TarjetaUnidad
              key={unidad.area_id}
              unidad={unidad}
              onVerDetalle={onVerDetalle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MisUnidadesPage;
