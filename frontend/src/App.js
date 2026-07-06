import React, { useState } from 'react';

import Login              from './components/Auth/Login';
import Layout             from './components/Layout/Layout';
import PaginaInicio       from './components/Layout/PaginaInicio';
import MantenedoresPage   from './components/Mantenedores/MantenedoresPage';
import UsuariosPage       from './components/Usuarios/UsuariosPage';
import ContratistaPage    from './components/Contratistas/ContratistaPage';
import AreasPage          from './components/Areas/AreasPage';
import AreaUsuarios       from './components/Areas/AreaUsuarios';
import MisUnidadesPage    from './components/Expedientes/MisUnidadesPage';
import MiUnidadDetalle    from './components/Expedientes/MiUnidadDetalle';
import ExpedientesArea    from './components/Expedientes/ExpedientesArea';
import DocumentosExpediente from './components/Expedientes/DocumentosExpediente';
import ExpedientesListado from './components/Expedientes/ExpedientesListado';
import ExpedienteDetalle  from './components/Expedientes/ExpedienteDetalle';
import CategoriasPage     from './components/Categorias/CategoriasPage';
import ProyectosPage      from './components/Proyectos/ProyectosPage';
import TipoDocPage        from './components/TiposDocumento/TipoDocPage';
import TipoColabPage      from './components/TiposColaboracion/TipoColabPage';
import ProcesosPage       from './components/Procesos/ProcesosPage';
import TareasPage         from './components/Tareas/TareasPage';       // HU-22/23/24/25/26
import VisadoresPage      from './components/Visadores/VisadoresPage'; // HU-27
import DashboardPage      from './components/Dashboard/DashboardPage'; // HU-29/30
import './styles.css';

const VISTAS_USUARIOS      = ['usuarios', 'usuarios-listado', 'usuarios-nuevo', 'usuarios-editar'];
const VISTAS_CONTRATISTAS  = ['contratistas', 'contratistas-listado', 'contratistas-nuevo', 'contratistas-editar'];
const VISTAS_AREAS         = ['areas', 'areas-listado', 'areas-nueva', 'areas-editar', 'areas-usuarios'];
const VISTAS_AREA_USUARIOS = ['area-usuarios'];
const VISTAS_PROYECTOS     = ['proyectos', 'proyectos-listado', 'proyectos-nuevo', 'proyectos-editar'];
const VISTAS_CATEGORIAS    = ['categorias', 'categorias-listado', 'categorias-nueva', 'categorias-editar'];
const VISTAS_TIPOS_DOC     = ['tipos-doc', 'tipos-doc-listado', 'tipos-doc-nuevo', 'tipos-doc-editar'];
const VISTAS_TIPOS_COLAB   = ['tipos-colab', 'tipos-colab-listado', 'tipos-colab-nuevo', 'tipos-colab-editar'];
const VISTAS_VISADORES     = ['visadores', 'visadores-listado', 'visadores-nuevo', 'visadores-editar'];

function App() {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const [vistaActual,            setVistaActual]            = useState('inicio');
  const [filtroContratistaId,    setFiltroContratistaId]    = useState(null);
  const [unidadSeleccionada,     setUnidadSeleccionada]     = useState(null);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [filtroEstadoInicial,    setFiltroEstadoInicial]    = useState(null);

  const handleLogin = (usuarioData) => {
    setUsuario(usuarioData);
    setVistaActual('inicio');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const handleNavegar = (vista, params = {}) => {
    if (params.filtroContratistaId !== undefined) {
      setFiltroContratistaId(params.filtroContratistaId);
    } else if (VISTAS_AREAS.includes(vista) && !params.filtroContratistaId) {
      setFiltroContratistaId(null);
    }
    setFiltroEstadoInicial(params.filtroEstado || null);
    if (vista !== 'mi-unidad-detalle')    setUnidadSeleccionada(null);
    if (vista !== 'expedientes-area' &&
        vista !== 'expediente-detalle' &&
        vista !== 'expediente-detalle-area' &&
        vista !== 'documentos-expediente') setExpedienteSeleccionado(null);
    setVistaActual(vista);
  };

  const handleVerDetalleUnidad             = (unidad)      => { setUnidadSeleccionada(unidad);         setVistaActual('mi-unidad-detalle'); };
  const handleVolverAMisUnidades           = ()             => { setUnidadSeleccionada(null);           setVistaActual('mis-unidades'); };
  const handleVerExpedientes               = (unidad)      => { setUnidadSeleccionada(unidad);         setVistaActual('expedientes-area'); };
  const handleVerExpedienteDetalle         = (expediente)  => { setExpedienteSeleccionado(expediente); setVistaActual('expediente-detalle'); };
  const handleVolverAExpedientes           = ()             => { setExpedienteSeleccionado(null);       setVistaActual('expedientes'); };
  const handleVolverAExpedientesArea       = ()             => { setExpedienteSeleccionado(null);       setVistaActual('expedientes-area'); };
  const handleVerExpedienteDetalleDesdeArea = (expediente) => { setExpedienteSeleccionado(expediente); setVistaActual('expediente-detalle-area'); };

  if (!usuario) return <Login onLogin={handleLogin} />;

  const renderVista = () => {
    if (vistaActual === 'inicio')
      return <PaginaInicio usuario={usuario} onNavegar={handleNavegar} />;

    if (vistaActual === 'mantenedores')
      return <MantenedoresPage onNavegar={handleNavegar} />;

    if (vistaActual === 'dashboard')
      return <DashboardPage usuario={usuario} />;

    if (VISTAS_USUARIOS.includes(vistaActual))
      return <UsuariosPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_CONTRATISTAS.includes(vistaActual))
      return <ContratistaPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_AREAS.includes(vistaActual))
      return <AreasPage vistaActual={vistaActual} onNavegar={handleNavegar} filtroContratistaId={filtroContratistaId} />;

    if (VISTAS_AREA_USUARIOS.includes(vistaActual))
      return <AreaUsuarios />;

    if (VISTAS_CATEGORIAS.includes(vistaActual))
      return <CategoriasPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_PROYECTOS.includes(vistaActual))
      return <ProyectosPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_TIPOS_DOC.includes(vistaActual))
      return <TipoDocPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_TIPOS_COLAB.includes(vistaActual))
      return <TipoColabPage vistaActual={vistaActual} onNavegar={handleNavegar} />;

    if (VISTAS_VISADORES.includes(vistaActual))  // HU-27
      return <VisadoresPage onVolver={() => handleNavegar('mantenedores')} />;

    if (vistaActual === 'procesos-listado' || vistaActual === 'etapas-listado')
      return <ProcesosPage onVolver={() => handleNavegar('mantenedores')} />;

    if (vistaActual === 'tareas')   // HU-22/23/24/25/26
      return <TareasPage usuario={usuario} />;

    if (vistaActual === 'mis-unidades')
      return <MisUnidadesPage usuario={usuario} onVerDetalle={handleVerDetalleUnidad} />;

    if (vistaActual === 'mi-unidad-detalle' && unidadSeleccionada)
      return <MiUnidadDetalle unidad={unidadSeleccionada} usuario={usuario} onVolver={handleVolverAMisUnidades} onVerExpedientes={handleVerExpedientes} />;

    if (vistaActual === 'expedientes-area' && unidadSeleccionada)
      return <ExpedientesArea unidad={unidadSeleccionada} usuario={usuario} onVerDetalle={handleVerExpedienteDetalleDesdeArea} onVolver={() => handleVerDetalleUnidad(unidadSeleccionada)} />;

    if (vistaActual === 'documentos-expediente' && expedienteSeleccionado)
      return <DocumentosExpediente expedienteId={expedienteSeleccionado.id} usuario={usuario} onVolver={handleVolverAExpedientesArea} />;

    if (vistaActual === 'expedientes')
      return <ExpedientesListado usuario={usuario} onVerDetalle={handleVerExpedienteDetalle} filtroEstadoInicial={filtroEstadoInicial} />;

    if (vistaActual === 'documentos-finales')  // HU-28
      return <ExpedientesListado usuario={usuario} onVerDetalle={handleVerExpedienteDetalle} filtroEstadoInicial="Terminado" soloTerminados />;

    if (vistaActual === 'expediente-detalle' && expedienteSeleccionado)
      return <ExpedienteDetalle expedienteId={expedienteSeleccionado.id} usuario={usuario} onVolver={handleVolverAExpedientes} />;

    if (vistaActual === 'expediente-detalle-area' && expedienteSeleccionado)
      return <ExpedienteDetalle expedienteId={expedienteSeleccionado.id} usuario={usuario} onVolver={handleVolverAExpedientesArea} />;

    return (
      <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>
        Módulo en construcción
      </div>
    );
  };

  return (
    <Layout usuario={usuario} vistaActual={vistaActual} onNavegar={handleNavegar} onLogout={handleLogout}>
      {renderVista()}
    </Layout>
  );
}

export default App;