import React, { useState } from 'react';
import Login        from './components/Login';
import Layout       from './components/Layout';
import UsuariosPage from './components/UsuariosPage';
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

  const esVistaUsuarios = [
    'usuarios',
    'usuarios-listado',
    'usuarios-nuevo',
    'usuarios-editar',
  ].includes(vistaActual);

  const renderVista = () => {
    if (esVistaUsuarios) {
      return (
        <UsuariosPage
          vistaActual={vistaActual}
          onNavegar={setVistaActual}
        />
      );
    }

    switch (vistaActual) {
      // Próximos módulos — agregar aquí
      case 'mantenedores':
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
    <Layout
      usuario={usuario}
      vistaActual={vistaActual}
      onNavegar={setVistaActual}
      onLogout={handleLogout}
    >
      {renderVista()}
    </Layout>
  );
}

export default App;