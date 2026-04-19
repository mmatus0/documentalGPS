import React, { useState } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import UserList from './components/UserList';
import './styles.css';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const [vistaActual, setVistaActual] = useState('dashboard');

  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
    setVistaActual('dashboard');
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
    <Layout
      usuario={usuario}
      vistaActual={vistaActual}
      onNavegar={setVistaActual}
      onLogout={handleLogout}
    >
      <UserList />
    </Layout>
  );
}

export default App;