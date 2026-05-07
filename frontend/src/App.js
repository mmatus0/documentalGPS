import React, { useState } from 'react';
import Login        from './components/Login';
import Layout       from './components/Layout';
import UsuariosPage from './components/UsuariosPage';
import ContratistaPage from './components/ContratistaPage';
import AreaUsuarios   from './components/AreaUsuarios';
import './styles.css';

const VISTAS_USUARIOS     = ['usuarios', 'usuarios-listado', 'usuarios-nuevo', 'usuarios-editar'];
const VISTAS_CONTRATISTAS = ['contratistas', 'contratistas-listado', 'contratistas-nuevo', 'contratistas-editar'];
const VISTAS_AREA_USUARIOS = ['area-usuarios'];

function App() {

  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [seccion, setSeccion] = useState('usuarios');

  const handleLogin  = (u) => setUsuario(u);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (!usuario) return <Login onLogin={handleLogin} />;

  const renderVista = () => {
    if (VISTAS_USUARIOS.includes(vistaActual))
      return <UsuariosPage vistaActual={vistaActual} onNavegar={setVistaActual} />;

    if (VISTAS_CONTRATISTAS.includes(vistaActual))
      return <ContratistaPage vistaActual={vistaActual} onNavegar={setVistaActual} />;

    if (VISTAS_AREA_USUARIOS.includes(vistaActual))
      return <AreaUsuarios onNavegar={setVistaActual} />;

    switch (vistaActual) {
      case 'expedientes':
      case 'tareas':
      case 'dashboard':
      default:
        return (
          <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
            Selecciona una opción del menú
          </div>
        );
    }
  };

  return (
    <div>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">GD</div>
          <div>
            <div className="brand-name">Documental GPS</div>
            <div className="brand-sub">Sistema de Gestión Documental</div>
          </div>
        </div>

        {/* Navegación simple entre módulos */}
        {esAdmin && (
          <nav style={{ display: 'flex', gap: 8 }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => setSeccion(item.key)}
                style={{
                  background: seccion === item.key ? 'rgba(255,255,255,0.2)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}

        <div className="header-user">
          <span className="header-username">Hola, {usuario.nombre}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="page-container">
        {seccion === 'usuarios'      && <UserList />}
        {seccion === 'area-usuarios' && esAdmin && <AreaUsuarios />}
      </div>
    </div>
  );
}

export default App;