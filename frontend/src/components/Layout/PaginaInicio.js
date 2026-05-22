import React from 'react';
 
const ROL_NOMBRE = { 1: 'Administrador', 2: 'Colaborador', 3: 'Lector' };
 
// Tarjetas de acceso rápido por rol
const ACCESOS = {
  1: [
    { titulo: 'Gestión de Usuarios',            descripcion: 'Crear, editar y desactivar cuentas de usuario.',       icono: 'bi-people-fill',          vista: 'usuarios-listado',     variante: 'primary'   },
    { titulo: 'Contratistas',                   descripcion: 'Administrar el directorio de empresas contratistas.',  icono: 'bi-building',             vista: 'contratistas-listado', variante: 'success'   },
    { titulo: 'Unidades Organizativas',         descripcion: 'Gestionar áreas y sus grupos de usuarios.',            icono: 'bi-diagram-3-fill',       vista: 'areas-listado',        variante: 'info'      },
    { titulo: 'Expedientes',                    descripcion: 'Ver y gestionar todos los expedientes del sistema.',   icono: 'bi-folder2-open',         vista: 'expedientes',          variante: 'warning'   },
    { titulo: 'Tareas',                         descripcion: 'Supervisar todas las tareas activas del sistema.',     icono: 'bi-check2-square',        vista: 'tareas',               variante: 'secondary' },
  ],
  2: [
    { titulo: 'Mis Unidades',                   descripcion: 'Ver las unidades organizativas a las que perteneces.',    icono: 'bi-diagram-3-fill',       vista: 'mis-unidades',         variante: 'info'      },
    { titulo: 'Mis Expedientes',                descripcion: 'Crear y gestionar expedientes de tu área.',               icono: 'bi-folder2-open',         vista: 'expedientes',          variante: 'primary'   },
    { titulo: 'Mis Tareas',                     descripcion: 'Revisar y resolver las tareas asignadas a ti.',           icono: 'bi-check2-square',        vista: 'tareas',               variante: 'success'   },
  ],
  3: [
    { titulo: 'Mis Unidades',                   descripcion: 'Ver las unidades organizativas a las que perteneces.',    icono: 'bi-diagram-3-fill',       vista: 'mis-unidades',         variante: 'info'      },
    { titulo: 'Expedientes',                    descripcion: 'Consultar los expedientes de tu área.',                   icono: 'bi-folder2-open',         vista: 'expedientes',          variante: 'primary'   },
  ],
};
 
// Mensaje de bienvenida por rol
const MENSAJE = {
  1: 'Tiene acceso completo al sistema. Desde aquí puede administrar usuarios, contratistas, unidades organizativas y supervisar todos los expedientes.',
  2: 'Desde aquí puede crear y gestionar expedientes en su área y resolver las tareas que le han sido asignadas.',
  3: 'Tiene acceso de lectura. Puede consultar los expedientes de su área sin realizar modificaciones.',
};
 
const BADGE_COLOR = { 1: 'danger', 2: 'success', 3: 'secondary' };
 
const PaginaInicio = ({ usuario, onNavegar }) => {
  const rolId   = usuario.rol_id;
  const accesos = ACCESOS[rolId] || [];
 
  return (
    <div>
      {/* Encabezado de bienvenida */}
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
              <i className="bi bi-person-circle" style={{ fontSize: 26, color: 'var(--primary)' }} />
            </div>
            <div>
              <h4 className="fw-bold mb-1">Bienvenido, {usuario.nombre}</h4>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge bg-${BADGE_COLOR[rolId]}`}>
                  {ROL_NOMBRE[rolId] || 'Usuario'}
                </span>
                <span className="text-muted small">{MENSAJE[rolId]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Accesos rápidos */}
      {accesos.length > 0 && (
        <>
          <h6 className="fw-bold text-muted mb-3" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Acceso rápido
          </h6>
          <div className="row g-3">
            {accesos.map((a) => (
              <div key={a.vista} className="col-md-4">
                <button
                  className="card border-0 shadow-sm w-100 text-start h-100"
                  style={{ background: 'white', cursor: 'pointer', borderRadius: 10 }}
                  onClick={() => onNavegar(a.vista)}
                >
                  <div className="card-body px-4 py-3">
                    <div
                      className={`mb-3`}
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: `var(--bs-${a.variante}-bg-subtle, #e9f5ff)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
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