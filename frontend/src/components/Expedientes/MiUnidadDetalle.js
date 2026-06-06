import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';

// ─── Utilidades ────────────────────────────────────────────────────────────────

const ROL_BADGE = {
  Colaborador: { bg: 'bg-success-subtle text-success', icon: 'bi-pencil-fill' },
  Lector:      { bg: 'bg-secondary-subtle text-secondary', icon: 'bi-eye-fill' },
  Administrador: { bg: 'bg-primary-subtle text-primary', icon: 'bi-shield-fill' },
};

const PERMISO_TEXTO = {
  Colaborador: {
    titulo: 'Acceso de Colaborador',
    descripcion: 'Puedes crear, editar y gestionar expedientes dentro de esta unidad organizativa.',
    icon: 'bi-pencil-fill',
    color: '#10b981',
    colorSubtle: '#d1fae5',
  },
  Lector: {
    titulo: 'Acceso de Lector',
    descripcion: 'Tienes acceso de solo lectura. Puedes consultar expedientes sin realizar modificaciones.',
    icon: 'bi-eye-fill',
    color: '#64748b',
    colorSubtle: '#f1f5f9',
  },
};

// ─── Fila de integrante ─────────────────────────────────────────────────────────

const FilaIntegrante = ({ usuario, esYo }) => {
  const badge = ROL_BADGE[usuario.rol_en_area] || ROL_BADGE.Lector;
  const badgeGlobal = ROL_BADGE[usuario.rol_global] || ROL_BADGE.Lector;
  const iniciales = usuario.nombre_completo
    ?.split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??';

  return (
    <tr className={esYo ? 'table-active' : ''}>
      <td className="ps-4 py-3">
        <div className="d-flex align-items-center gap-2">
          {/* Avatar con iniciales */}
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: esYo ? 'var(--primary)' : '#e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600,
              color: esYo ? 'white' : '#64748b',
            }}
          >
            {iniciales}
          </div>
          <div>
            <div className="fw-medium small">{usuario.nombre_completo}</div>
            {esYo && (
              <div style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 600 }}>
                — Tú
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="small text-muted py-3">{usuario.correo}</td>
      <td className="py-3">
        <span className={`badge ${badge.bg} d-flex align-items-center gap-1`} style={{ fontSize: 10, width: 'fit-content' }}>
          <i className={`bi ${badge.icon}`} />
          {usuario.rol_en_area}
        </span>
      </td>
      <td className="py-3">
        <span className={`badge ${badgeGlobal.bg}`} style={{ fontSize: 10 }}>
          {usuario.rol_global}
        </span>
      </td>
    </tr>
  );
};

// ─── Vista de detalle ───────────────────────────────────────────────────────────

const MiUnidadDetalle = ({ unidad, usuario, onVolver, onVerExpedientes }) => {
  const [integrantes,  setIntegrantes]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [tabActiva,    setTabActiva]    = useState('todos');

  const permiso = PERMISO_TEXTO[unidad.rol_en_area] || PERMISO_TEXTO.Lector;

  const fetchIntegrantes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/areas/${unidad.area_id ?? unidad.id}/usuarios`);
      setIntegrantes(data);
    } catch (err) {
      setError('No se pudieron cargar los integrantes de esta unidad.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [unidad.area_id ?? unidad.id]);

  useEffect(() => {
    fetchIntegrantes();
  }, [fetchIntegrantes]);

  // Filtros por tab
  const colaboradores = integrantes.filter(u => u.rol_en_area === 'Colaborador');
  const lectores      = integrantes.filter(u => u.rol_en_area === 'Lector');
  const listaTab = tabActiva === 'todos'
    ? integrantes
    : tabActiva === 'colaboradores'
    ? colaboradores
    : lectores;

  return (
    <div>
      {/* Botones de navegación */}
      <div className="d-flex gap-2 mb-4">
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={onVolver}
        >
          <i className="bi bi-arrow-left me-1" />
          Volver a mis unidades
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => onVerExpedientes(unidad)}
        >
          <i className="bi bi-folder2-open me-1" />
          Ver expedientes
        </button>
      </div>

      {/* Encabezado de la unidad */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
        {/* Banda de color */}
        <div
          style={{
            height: 5,
            background: unidad.rol_en_area === 'Colaborador'
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #94a3b8, #64748b)',
          }}
        />
        <div className="card-body px-4 py-4">
          <div className="row align-items-center g-3">
            {/* Icono + info */}
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-3">
                <div
                  style={{
                    width: 56, height: 56, borderRadius: 12, flexShrink: 0,
                    background: 'var(--primary-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className="bi bi-diagram-3-fill" style={{ fontSize: 28, color: 'var(--primary)' }} />
                </div>
                <div>
                  <h4 className="fw-bold mb-1">{unidad.area_nombre}</h4>
                  <div className="d-flex align-items-center gap-2 text-muted small">
                    <i className="bi bi-building" />
                    <span>{unidad.contratista_nombre}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge de rol */}
            <div className="col-md-4 text-md-end">
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                style={{ background: permiso.colorSubtle, border: `1px solid ${permiso.color}22` }}
              >
                <i className={`bi ${permiso.icon}`} style={{ color: permiso.color, fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: permiso.color }}>
                    {permiso.titulo}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.3 }}>
                    {unidad.rol_en_area === 'Colaborador' ? 'Crear y gestionar expedientes' : 'Solo consulta'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción del permiso */}
          <div
            className="mt-3 d-flex align-items-start gap-2 px-3 py-2 rounded"
            style={{ background: '#f8fafc', border: '1px solid var(--border)' }}
          >
            <i className="bi bi-info-circle text-muted mt-1" style={{ fontSize: 13, flexShrink: 0 }} />
            <p className="mb-0 text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              {permiso.descripcion}
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {!loading && !error && (
        <div className="row g-3 mb-4">
          {[
            {
              label: 'Total integrantes',
              valor: integrantes.length,
              icon: 'bi-people-fill',
              color: 'var(--primary)',
              bg: 'var(--primary-light)',
            },
            {
              label: 'Colaboradores',
              valor: colaboradores.length,
              icon: 'bi-pencil-fill',
              color: '#10b981',
              bg: '#d1fae5',
            },
            {
              label: 'Lectores',
              valor: lectores.length,
              icon: 'bi-eye-fill',
              color: '#64748b',
              bg: '#f1f5f9',
            },
          ].map(stat => (
            <div className="col-md-4" key={stat.label}>
              <div className="card border-0 shadow-sm" style={{ borderRadius: 10 }}>
                <div className="card-body px-4 py-3 d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                      background: stat.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <i className={`bi ${stat.icon}`} style={{ fontSize: 18, color: stat.color }} />
                  </div>
                  <div>
                    <div className="fw-bold" style={{ fontSize: 20, lineHeight: 1 }}>{stat.valor}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>{stat.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de integrantes */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="d-flex justify-content-between align-items-center px-4 border-bottom flex-wrap gap-2 py-1">
          <h6 className="fw-bold mb-0 py-2">Integrantes de la Unidad</h6>
          <ul className="nav nav-tabs border-bottom-0">
            {[
              { key: 'todos', label: `Todos (${integrantes.length})` },
              { key: 'colaboradores', label: `Colaboradores (${colaboradores.length})` },
              { key: 'lectores', label: `Lectores (${lectores.length})` },
            ].map(tab => (
              <li className="nav-item" key={tab.key}>
                <button
                  className={`nav-link border-0 ${tabActiva === tab.key ? 'active fw-semibold' : 'text-muted'}`}
                  onClick={() => setTabActiva(tab.key)}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Cargando integrantes…
            </div>
          ) : error ? (
            <div className="p-4">
              <div className="alert alert-danger d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{error}</span>
                <button className="btn btn-sm btn-outline-danger ms-auto" onClick={fetchIntegrantes}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 small text-muted fw-semibold" style={{ width: '30%' }}>Nombre</th>
                    <th className="small text-muted fw-semibold">Correo</th>
                    <th className="small text-muted fw-semibold">Rol en el área</th>
                    <th className="small text-muted fw-semibold">Rol global</th>
                  </tr>
                </thead>
                <tbody>
                  {listaTab.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-5 small">
                        No hay integrantes en esta categoría
                      </td>
                    </tr>
                  ) : (
                    listaTab.map(u => (
                      <FilaIntegrante
                        key={u.id}
                        usuario={u}
                        esYo={u.correo === usuario.correo}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiUnidadDetalle;
