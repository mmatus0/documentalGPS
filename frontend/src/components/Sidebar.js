import React, { useState, useEffect, useCallback, useMemo } from 'react';
 
const menu = {
  1: [
    { label: 'Inicio',     vista: 'inicio'     },
    { label: 'Dashboard',  vista: 'dashboard'  },
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
        { label: 'Asignación de Usuarios', vista: 'area-usuarios'        },
        { label: 'Proyectos', vista: 'proyectos-listado' },
        { label: 'Categorías',             vista: 'categorias-listado'   },  // HU-08
      ]
    },
    { label: 'Expedientes', vista: 'expedientes' },
    { label: 'Tareas',      vista: 'tareas'       },
  ],
  2: [
    { label: 'Inicio',       vista: 'inicio'       },
    { label: 'Dashboard',    vista: 'dashboard'    },
    { label: 'Mis Unidades', vista: 'mis-unidades' },
    { label: 'Expedientes',  vista: 'expedientes'  },
    { label: 'Tareas',       vista: 'tareas'       },
  ],
  3: [
    { label: 'Inicio',       vista: 'inicio'       },
    { label: 'Dashboard',    vista: 'dashboard'    },
    { label: 'Mis Unidades', vista: 'mis-unidades' },
    { label: 'Expedientes',  vista: 'expedientes'  },
  ],
};
 
// Vistas que deben resaltar "Unidades Organizativas" en el sidebar
const VISTAS_AREAS = ['areas', 'areas-listado', 'areas-nueva', 'areas-editar', 'areas-usuarios'];

const VISTAS_PROYECTOS = ['proyectos', 'proyectos-listado', 'proyectos-nuevo', 'proyectos-editar'];

// Vistas que deben resaltar "Categorías" en el sidebar
const VISTAS_CATEGORIAS = ['categorias', 'categorias-listado', 'categorias-nueva', 'categorias-editar'];

// Vistas que deben resaltar "Mis Unidades" en el sidebar (roles 2 y 3)
const VISTAS_MIS_UNIDADES = ['mis-unidades', 'mi-unidad-detalle'];
 
const Sidebar = ({ usuario, vistaActual, onNavegar }) => {
  const opciones = useMemo(() => menu[usuario.rol_id] || [], [usuario.rol_id]);
 
  // vistaEfectiva se usa solo para resaltar el ítem padre (Mantenedores, Usuarios)
  const vistaEfectiva = VISTAS_AREAS.includes(vistaActual)
    ? 'areas-listado'
    : VISTAS_CATEGORIAS.includes(vistaActual)
    ? 'categorias-listado'
    : VISTAS_PROYECTOS.includes(vistaActual)
    ? 'proyectos-listado' 
    : VISTAS_MIS_UNIDADES.includes(vistaActual)
    ? 'mis-unidades'
    : vistaActual;
 
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
      return item.subopciones.some(s => s.vista === vistaActual);
    }
    return vistaActual === item.vista;
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
                    className={`sidebar-subitem ${vistaActual === sub.vista ? 'active' : ''}`}
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