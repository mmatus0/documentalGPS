import React, { useMemo, useCallback } from 'react';

const menu = {
  // Administrador
  1: [
    { label: 'Inicio',              vista: 'inicio'             },
    { label: 'Dashboard',           vista: 'dashboard'          },
    { label: 'Mantenedores',        vista: 'mantenedores'       },
    { label: 'Expedientes',         vista: 'expedientes'        },
    { label: 'Documentos Finales',  vista: 'documentos-finales' },
    { label: 'Tareas',              vista: 'tareas'             },
  ],
  // Colaborador
  2: [
    { label: 'Inicio',              vista: 'inicio'             },
    { label: 'Dashboard',           vista: 'dashboard'          },
    { label: 'Mis Unidades',        vista: 'mis-unidades'       },
    { label: 'Expedientes',         vista: 'expedientes'        },
    { label: 'Documentos Finales',  vista: 'documentos-finales' },
    { label: 'Tareas',              vista: 'tareas'             },
  ],
  // Lector
  3: [
    { label: 'Inicio',              vista: 'inicio'             },
    { label: 'Dashboard',           vista: 'dashboard'          },
    { label: 'Mis Unidades',        vista: 'mis-unidades'       },
    { label: 'Expedientes',         vista: 'expedientes'        },
    { label: 'Documentos Finales',  vista: 'documentos-finales' },
  ],
};

const VISTAS_MANTENEDORES = [
  'mantenedores',
  'contratistas', 'contratistas-listado', 'contratistas-nuevo', 'contratistas-editar',
  'areas', 'areas-listado', 'areas-nueva', 'areas-editar', 'areas-usuarios',
  'area-usuarios',
  'proyectos', 'proyectos-listado', 'proyectos-nuevo', 'proyectos-editar',
  'categorias', 'categorias-listado', 'categorias-nueva', 'categorias-editar',
  'tipos-doc', 'tipos-doc-listado', 'tipos-doc-nuevo', 'tipos-doc-editar',
  'tipos-colab', 'tipos-colab-listado', 'tipos-colab-nuevo', 'tipos-colab-editar',
  'usuarios', 'usuarios-listado', 'usuarios-nuevo', 'usuarios-editar',
  'visadores', 'visadores-listado', 'visadores-nuevo', 'visadores-editar', // HU-27
];

const VISTAS_MIS_UNIDADES = ['mis-unidades', 'mi-unidad-detalle', 'expedientes-area', 'documentos-expediente'];
const VISTAS_EXPEDIENTES  = ['expedientes', 'expediente-detalle'];
const VISTAS_DOC_FINALES  = ['documentos-finales'];
const VISTAS_TAREAS       = ['tareas'];

const Sidebar = ({ usuario, vistaActual, onNavegar }) => {
  const opciones = useMemo(() => menu[usuario.rol_id] || [], [usuario.rol_id]);

  const vistaEfectiva = VISTAS_MANTENEDORES.includes(vistaActual)
    ? 'mantenedores'
    : VISTAS_MIS_UNIDADES.includes(vistaActual)
    ? 'mis-unidades'
    : VISTAS_EXPEDIENTES.includes(vistaActual)
    ? 'expedientes'
    : VISTAS_DOC_FINALES.includes(vistaActual)
    ? 'documentos-finales'
    : VISTAS_TAREAS.includes(vistaActual)
    ? 'tareas'
    : vistaActual;

  const estaActivo = useCallback((item) => {
    return vistaEfectiva === item.vista;
  }, [vistaEfectiva]);

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">NAVEGACIÓN</div>
      <nav className="sidebar-nav">
        {opciones.map((item) => (
          <button
            key={item.vista}
            className={`sidebar-item ${estaActivo(item) ? 'active' : ''}`}
            onClick={() => onNavegar(item.vista)}
          >
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;