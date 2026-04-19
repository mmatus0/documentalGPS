import React from 'react';

const menu = {
    1: [
    { label: 'Dashboard', vista: 'dashboard' },
    { label: 'Gestión de Usuarios', vista: 'usuarios' },
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

const Sidebar = ({usuario, vistaActual, onNavegar}) => {
     const opciones = menu[usuario.rol_id] || [];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {opciones.map((item) => (
          <button
            key={item.vista}
            className={`sidebar-item ${vistaActual === item.vista ? 'active' : ''}`}
            onClick={() => onNavegar(item.vista)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;