import React, { useState } from 'react';

const menu = {
  1: [
    { label: 'Dashboard', vista: 'dashboard' },
    {
      label: 'Usuarios', vista: 'usuarios',
      subopciones: [
        { label: 'Listado de Usuarios', vista: 'usuarios-listado' },
        { label: 'Nuevo Usuario', vista: 'usuarios-nuevo' },
      ]
    },
    { label: 'Mantenedores', vista: 'mantenedores' },
    { label: 'Expedientes', vista: 'expedientes' },
    { label: 'Tareas', vista: 'tareas' },
  ],
  2: [
    { label: 'Dashboard', vista: 'dashboard' },
    { label: 'Expedientes', vista: 'expedientes' },
    { label: 'Tareas', vista: 'tareas' },
  ],
  3: [
    { label: 'Dashboard', vista: 'dashboard' },
    { label: 'Expedientes', vista: 'expedientes' },
  ],
};

const Sidebar = ({ usuario, vistaActual, onNavegar }) => {
  const opciones = menu[usuario.rol_id] || [];
  const [expandido, setExpandido] = useState('null');

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