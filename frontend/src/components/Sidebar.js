import React, { useState, useEffect, useCallback, useMemo } from 'react';

const menu = {
  1: [
    { label: 'Dashboard', vista: 'dashboard' },
    {
      label: 'Usuarios', vista: 'usuarios',
      subopciones: [
        { label: 'Listado de Usuarios', vista: 'usuarios-listado' },
        { label: 'Nuevo Usuario',       vista: 'usuarios-nuevo'   },
      ]
    },
    {
      label: 'Mantenedores', vista: 'mantenedores',
      subopciones: [
        { label: 'Contratistas',           vista: 'contratistas-listado' },
        { label: 'Unidades Organizativas', vista: 'areas-listado'        },
      ]
    },
    { label: 'Expedientes', vista: 'expedientes' },
    { label: 'Tareas',      vista: 'tareas'       },
  ],
  2: [
    { label: 'Dashboard',   vista: 'dashboard'   },
    { label: 'Expedientes', vista: 'expedientes' },
    { label: 'Tareas',      vista: 'tareas'      },
  ],
  3: [
    { label: 'Dashboard',   vista: 'dashboard'   },
    { label: 'Expedientes', vista: 'expedientes' },
  ],
};

// Vistas que deben resaltar "Unidades Organizativas" en el sidebar
const VISTAS_AREAS = ['areas', 'areas-listado', 'areas-nueva', 'areas-editar', 'areas-usuarios'];

const Sidebar = ({ usuario, vistaActual, onNavegar }) => {
  const opciones = useMemo(() => menu[usuario.rol_id] || [], [usuario.rol_id]);

  // Normalizar la vista para el resaltado: todas las vistas de áreas
  // se mapean a 'areas-listado' para que el sidebar resalte correctamente
  const vistaEfectiva = VISTAS_AREAS.includes(vistaActual) ? 'areas-listado' : vistaActual;

  const padreDeVista = useCallback((vista) => {
    const item = opciones.find(
      op => op.subopciones?.some(s => s.vista === vista)
    );
    return item ? item.vista : null;
  }, [opciones]);

  const [expandido, setExpandido] = useState(() => padreDeVista(vistaEfectiva));

  useEffect(() => {
    const padre = padreDeVista(vistaEfectiva);
    if (padre) setExpandido(padre);
  }, [vistaEfectiva, padreDeVista]);

  const toggleExpandido = (vista) => {
    setExpandido(expandido === vista ? null : vista);
  };

  const estaActivo = (item) => {
    if (item.subopciones) {
      return item.subopciones.some(s => s.vista === vistaEfectiva);
    }
    return vistaEfectiva === item.vista;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">NAVEGACIÓN</div>
      <nav className="sidebar-nav">
        {opciones.map((item) => (
          <div key={item.vista}>
            <button
              className={`sidebar-item ${estaActivo(item) ? 'active' : ''} ${item.subopciones && expandido === item.vista ? 'expandido' : ''}`}
              onClick={() => {
                if (item.subopciones) {
                  toggleExpandido(item.vista);
                } else {
                  onNavegar(item.vista);
                }
              }}
            >
              <span className="sidebar-label">{item.label}</span>
              {item.subopciones && (
                <span className="sidebar-arrow">
                  {expandido === item.vista ? '▾' : '▸'}
                </span>
              )}
            </button>
            {item.subopciones && expandido === item.vista && (
              <div className="sidebar-subopciones">
                {item.subopciones.map((sub) => (
                  <button
                    key={sub.vista}
                    className={`sidebar-subitem ${vistaEfectiva === sub.vista ? 'active' : ''}`}
                    onClick={() => onNavegar(sub.vista)}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;