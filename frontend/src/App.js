import React, { useState } from 'react';
import Login from './components/Login';
import UserList from './components/UserList';
import './styles.css';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

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
        <div className="header-user">
          <span className="header-username">Hola, {usuario.nombre}</span>
          <button className="btn-logout" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>
      <div className="page-container">
        <UserList />
      </div>
    </div>
  );
}

export default App;