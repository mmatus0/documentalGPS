import React, { useState } from 'react';
import Sidebar from './Sidebar';

const Layout = ({ usuario, vistaActual, onNavegar, onLogout, children }) => {
  const [sidebarAbierto, setSidebarAbierto] = useState(true);

  return (
    <div className="app-wrapper">
 
      {/* Topbar */}
      <header className="app-header">
        <div className="brand">
          <button className="btn-toggle-sidebar" onClick={() => setSidebarAbierto(!sidebarAbierto)}>
            ☰
          </button>
          <div className="brand-mark">GD</div>
          <div>
            <div className="brand-name">Documental GPS</div>
            <div className="brand-sub">Sistema de Gestión Documental</div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="header-username">Hola, {usuario.nombre}</span>
          <button className="btn-logout" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </header>
 
      {/* Body */}
      <div className="app-body">
        {sidebarAbierto && (
          <Sidebar usuario={usuario} vistaActual={vistaActual} onNavegar={onNavegar} />
        )}
        <main className="main-content">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>
 
    </div>
  );
};

export default Layout;