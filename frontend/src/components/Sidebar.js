import React from 'react';

const menu = {
    1: [
    { icon: '⊞', label: 'Dashboard', vista: 'dashboard' },
    { icon: '👥', label: 'Gestión de Usuarios', vista: 'usuarios' },
    { icon: '⚙️', label: 'Mantenedores', vista: 'mantenedores' },
    { icon: '📁', label: 'Expedientes', vista: 'expedientes' },
    { icon: '✓', label: 'Tareas', vista: 'tareas' },
    ],
    2: [
        { icon: '⊞', label: 'Dashboard', vista: 'dashboard' },
        { icon: '📁', label: 'Expedientes', vista: 'expedientes' },
        { icon: '✓', label: 'Tareas', vista: 'tareas' },
    ],
    3: [
        { icon: '⊞', label: 'Dashboard', vista: 'dashboard' },
        { icon: '📁', label: 'Expedientes', vista: 'expedientes' },
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