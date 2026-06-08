import React, { useEffect, useState } from 'react';
import axios from '../../services/axiosConfig';

const ROL_NOMBRE  = { 1: 'Administrador', 2: 'Colaborador', 3: 'Lector' };
const BADGE_COLOR = { 1: 'danger', 2: 'success', 3: 'secondary' };

const MENSAJE = {
  1: 'Tiene acceso completo al sistema. Desde aquí puede administrar usuarios, contratistas, unidades organizativas y supervisar todos los expedientes.',
  2: 'Desde aquí puede crear y gestionar expedientes en su área y resolver las tareas que le han sido asignadas.',
  3: 'Tiene acceso de lectura. Puede consultar los expedientes de su área sin realizar modificaciones.',
};

const ACCESOS = {
  1: [
    { titulo: 'Mantenedores',    descripcion: 'Configurar contratistas, áreas, procesos y demás entidades base.',  icono: 'bi-grid-fill',        vista: 'mantenedores',     variante: 'success'   },
    { titulo: 'Usuarios',        descripcion: 'Crear, editar y desactivar cuentas de usuario del sistema.',         icono: 'bi-person-badge-fill', vista: 'usuarios-listado', variante: 'secondary' },
    { titulo: 'Expedientes',     descripcion: 'Ver y gestionar todos los expedientes del sistema.',                  icono: 'bi-folder2-open',      vista: 'expedientes',      variante: 'warning'   },
    { titulo: 'Tareas',          descripcion: 'Supervisar todas las tareas activas del sistema.',                    icono: 'bi-check2-square',     vista: 'tareas',           variante: 'primary'   },
  ],
  2: [
    { titulo: 'Mis Unidades',    descripcion: 'Ver las unidades organizativas a las que perteneces.',               icono: 'bi-diagram-3-fill',    vista: 'mis-unidades',     variante: 'info'      },
    { titulo: 'Mis Expedientes', descripcion: 'Crear y gestionar expedientes de tu área.',                           icono: 'bi-folder2-open',      vista: 'expedientes',      variante: 'primary'   },
    { titulo: 'Mis Tareas',      descripcion: 'Revisar y resolver las tareas asignadas a ti.',                       icono: 'bi-check2-square',     vista: 'tareas',           variante: 'success'   },
  ],
  3: [
    { titulo: 'Mis Unidades',    descripcion: 'Ver las unidades organizativas a las que perteneces.',               icono: 'bi-diagram-3-fill',    vista: 'mis-unidades',     variante: 'info'      },
    { titulo: 'Expedientes',     descripcion: 'Consultar los expedientes de tu área.',                              icono: 'bi-folder2-open',      vista: 'expedientes',      variante: 'primary'   },
  ],
};

const ESTADO_CONFIG = {
  'Borrador':        { color: '#64748b', bg: '#f1f5f9', icon: 'bi-file-earmark'        },
  'Derivado':        { color: '#2563eb', bg: '#eff6ff', icon: 'bi-arrow-right-circle'  },
  'En Revisión':     { color: '#d97706', bg: '#fffbeb', icon: 'bi-eye'                 },
  'En Colaboración': { color: '#ea580c', bg: '#fff7ed', icon: 'bi-people'              },
  'En Aprobación':   { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle'        },
  'Terminado':       { color: '#0f766e', bg: '#f0fdfa', icon: 'bi-check-circle-fill'   },
};

const ESTADOS_DASHBOARD = ['Borrador', 'Derivado', 'En Revisión', 'En Colaboración', 'En Aprobación', 'Terminado'];

// ─── Dashboard de contadores ───────────────────────────────────────────────────
const DashboardExpedientes = ({ onNavegar }) => {
  const [contadores, setContadores] = useState({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    axios.get('/api/expedientes')
      .then(({ data }) => {
        const counts = {};
        ESTADOS_DASHBOARD.forEach(e => { counts[e] = 0; });
        data.forEach(exp => {
          if (counts[exp.estado] !== undefined) counts[exp.estado]++;
        });
        setContadores(counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = Object.values(contadores).reduce((a, b) => a + b, 0);

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ height: 4, background: 'linear-gradient(90deg, var(--primary), #2563eb)' }} />
      <div className="card-body px-4 pt-4 pb-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-folder2-open" style={{ fontSize: 18, color: 'var(--primary)' }} />
            <span className="fw-bold" style={{ fontSize: 14 }}>Estado de Expedientes</span>
          </div>
          <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11 }}
            onClick={() => onNavegar('expedientes')}>
            Ver todos <i className="bi bi-arrow-right ms-1" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-3 text-muted small">
            <span className="spinner-border spinner-border-sm me-1" />Cargando…
          </div>
        ) : (
          <>
            <div className="row g-2 mb-3">
              {ESTADOS_DASHBOARD.map(est => {
                const cfg   = ESTADO_CONFIG[est];
                const count = contadores[est] || 0;
                return (
                  <div key={est} className="col-6 col-md-4 col-lg-2">
                    <div
                      className="text-center p-2 rounded"
                      style={{
                        background: cfg.bg, cursor: 'pointer',
                        border: `1px solid ${cfg.color}22`,
                        transition: 'all 0.15s',
                      }}
                      onClick={() => onNavegar('expedientes', { filtroEstado: est })}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      title={`Ver expedientes en ${est}`}
                    >
                      <i className={`bi ${cfg.icon} d-block mb-1`} style={{ fontSize: 16, color: cfg.color }} />
                      <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: 9, color: cfg.color, opacity: 0.8, marginTop: 2, lineHeight: 1.2 }}>{est}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-muted text-end" style={{ fontSize: 11 }}>
              Total: <strong>{total}</strong> expediente{total !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const PaginaInicio = ({ usuario, onNavegar }) => {
  const rolId   = usuario.rol_id;
  const accesos = ACCESOS[rolId] || [];

  return (
    <div>
      {/* Encabezado de bienvenida */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body px-4 py-4">
          <div className="d-flex align-items-center gap-3">
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className="bi bi-person-circle" style={{ fontSize: 26, color: 'var(--primary)' }} />
            </div>
            <div>
              <h4 className="fw-bold mb-1">Bienvenido, {usuario.nombre}</h4>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className={`badge bg-${BADGE_COLOR[rolId]}`}>{ROL_NOMBRE[rolId] || 'Usuario'}</span>
                <span className="text-muted small">{MENSAJE[rolId]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de expedientes — visible para Admin y Colaborador */}
      {[1, 2].includes(rolId) && <DashboardExpedientes onNavegar={onNavegar} />}

      {/* Accesos rápidos */}
      {accesos.length > 0 && (
        <>
          <h6 className="fw-bold text-muted mb-3"
            style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Acceso rápido
          </h6>
          <div className="row g-3">
            {accesos.map(a => (
              <div key={a.vista} className="col-md-4">
                <button
                  className="card border-0 shadow-sm w-100 text-start h-100"
                  style={{ background: 'white', cursor: 'pointer', borderRadius: 10 }}
                  onClick={() => onNavegar(a.vista)}
                >
                  <div className="card-body px-4 py-3">
                    <div className="mb-3" style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: `var(--bs-${a.variante}-bg-subtle, #e9f5ff)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <i className={`bi ${a.icono}`} style={{ fontSize: 20, color: `var(--bs-${a.variante}, var(--primary))` }} />
                    </div>
                    <div className="fw-bold mb-1" style={{ fontSize: 13 }}>{a.titulo}</div>
                    <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{a.descripcion}</div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PaginaInicio;
