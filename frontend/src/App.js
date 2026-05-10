import React, { useState } from 'react';
import Login        from './components/Login';
import Layout       from './components/Layout';
import PaginaInicio      from './components/PaginaInicio';
import UsuariosPage from './components/UsuariosPage';
import ContratistaPage from './components/ContratistaPage';
import AreaUsuarios   from './components/AreaUsuarios';
import AreasPage from './components/AreasPage';
import './styles.css';

const VISTAS_USUARIOS     = ['usuarios', 'usuarios-listado', 'usuarios-nuevo', 'usuarios-editar'];
const VISTAS_CONTRATISTAS = ['contratistas', 'contratistas-listado', 'contratistas-nuevo', 'contratistas-editar'];
const VISTAS_AREAS        = ['areas', 'areas-listado', 'areas-nueva', 'areas-editar', 'areas-usuarios'];
const VISTAS_AREA_USUARIOS = ['area-usuarios'];

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
 
  const [vistaActual,       setVistaActual]       = useState('inicio');
  const [filtroContratistaId, setFiltroContratistaId] = useState(null);
 
  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
    setVistaActual('inicio');
  };
 
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };
 
  // Navegación extendida: acepta un objeto params opcional para pasar filtros
  const handleNavegar = (vista, params = {}) => {
    if (params.filtroContratistaId !== undefined) {
      setFiltroContratistaId(params.filtroContratistaId);
    } else if (VISTAS_AREAS.includes(vista) && !params.filtroContratistaId) {
      // Limpiar filtro al navegar a áreas desde el sidebar (sin filtro)
      setFiltroContratistaId(null);
    }
    setVistaActual(vista);
  };
 
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }
 
    const renderVista = () => {
      if (vistaActual === 'inicio')
      return <PaginaInicio usuario={usuario} onNavegar={handleNavegar} />;

      if (vistaActual === 'dashboard')
        return (
          <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
            <i className="bi bi-bar-chart-fill" style={{ fontSize: 48, display: 'block', marginBottom: 16 }} />
            <strong>Dashboard Power BI</strong>
            <p className="mt-2" style={{ fontSize: 13 }}>
              Módulo de reportes en construcción (HU-29 / HU-30).
            </p>
          </div>
        );
 
      if (VISTAS_USUARIOS.includes(vistaActual))
        return <UsuariosPage vistaActual={vistaActual} onNavegar={handleNavegar} />;
  
      if (VISTAS_CONTRATISTAS.includes(vistaActual))
        return <ContratistaPage vistaActual={vistaActual} onNavegar={handleNavegar} />;
  
      if (VISTAS_AREAS.includes(vistaActual))
        return (
          <AreasPage
            vistaActual={vistaActual}
            onNavegar={handleNavegar}
            filtroContratistaId={filtroContratistaId}
          />
        );
  
      // Acceso directo desde sidebar → Asignación de Usuarios (HU-03)
      if (VISTAS_AREA_USUARIOS.includes(vistaActual))
        return <AreaUsuarios />;
 
      // Placeholders para módulos futuros
      return (
        <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
          Módulo en construcción
        </div>
      );
  };
 
  return (
    <Layout
      usuario={usuario}
      vistaActual={vistaActual}
      onNavegar={handleNavegar}
      onLogout={handleLogout}
    >
      {renderVista()}
    </Layout>
  );
}
 
export default App;