import React from 'react';

const MODULOS = [
  {
    titulo:      'Contratistas',
    descripcion: 'Registrar, editar y desactivar empresas contratistas.',
    icono:       'bi-building',
    vista:       'contratistas-listado',
    color:       '#0f766e',
    bg:          '#ccfbf1',
  },
  {
    titulo:      'Unidades Organizativas',
    descripcion: 'Gestionar áreas vinculadas a contratistas y sus grupos de usuarios.',
    icono:       'bi-diagram-3-fill',
    vista:       'areas-listado',
    color:       '#0284c7',
    bg:          '#e0f2fe',
  },
  {
    titulo:      'Proyectos',
    descripcion: 'Administrar proyectos asociados a contratistas y áreas.',
    icono:       'bi-kanban-fill',
    vista:       'proyectos-listado',
    color:       '#7c3aed',
    bg:          '#ede9fe',
  },
  {
    titulo:      'Categorías',
    descripcion: 'Definir categorías y subtipos para clasificar expedientes.',
    icono:       'bi-tags-fill',
    vista:       'categorias-listado',
    color:       '#b45309',
    bg:          '#fef3c7',
  },
  {
    titulo:      'Tipos de Documento',
    descripcion: 'Configurar los tipos de documento aceptados: Carta, Oficio, Memo, etc.',
    icono:       'bi-file-earmark-text-fill',
    vista:       'tipos-doc-listado',
    color:       '#dc2626',
    bg:          '#fee2e2',
  },
  {
    titulo:      'Tipos de Colaboración',
    descripcion: 'Definir los tipos de colaboración disponibles en tareas.',
    icono:       'bi-people-fill',
    vista:       'tipos-colab-listado',
    color:       '#0891b2',
    bg:          '#cffafe',
  },
  {
    titulo:      'Procesos',
    descripcion: 'Definir procesos documentales y asignarlos a unidades organizativas.',
    icono:       'bi-arrow-repeat',
    vista:       'procesos-listado',
    color:       '#0369a1',
    bg:          '#e0f2fe',
  },
  {
    titulo:      'Etapas por Proceso',
    descripcion: 'Configurar etapas secuenciales con revisor y aprobador por proceso.',
    icono:       'bi-list-ol',
    vista:       'etapas-listado',
    color:       '#7e22ce',
    bg:          '#f3e8ff',
  },
  {
    titulo:      'Usuarios',
    descripcion: 'Crear, editar y desactivar cuentas de usuario del sistema.',
    icono:       'bi-person-badge-fill',
    vista:       'usuarios-listado',
    color:       '#475569',
    bg:          '#f1f5f9',
  },
  {
    titulo:      'Asignación de Usuarios',
    descripcion: 'Asignar colaboradores y lectores a unidades organizativas.',
    icono:       'bi-person-lines-fill',
    vista:       'area-usuarios',
    color:       '#16a34a',
    bg:          '#dcfce7',
  },
  {
    titulo:      'Visadores',
    descripcion: 'Gestionar los usuarios habilitados para realizar visaciones en áreas específicas.',
    icono:       'bi-person-check-fill',
    vista:       'visadores',
    color:       '#be185d',
    bg:          '#fce7f3',
  },
];

const MantenedoresPage = ({ onNavegar }) => {
  return (
    <div>
      {/* Encabezado */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className="bi bi-grid-fill" style={{ fontSize: 22, color: 'var(--primary)' }} />
        </div>
        <div>
          <h5 className="fw-bold mb-0">Mantenedores</h5>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>
            Configuración base del sistema. Define las entidades maestras antes de operar con expedientes.
          </p>
        </div>
      </div>

      {/* Grilla de módulos */}
      <div className="row g-3">
        {MODULOS.map((m) => (
          <div key={m.vista} className="col-md-4 col-sm-6">
            <button
              className="card border-0 shadow-sm w-100 text-start h-100"
              style={{ background: 'white', cursor: 'pointer', borderRadius: 10, transition: 'box-shadow 0.15s' }}
              onClick={() => onNavegar(m.vista)}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
            >
              <div className="card-body px-4 py-3">
                <div
                  className="mb-3"
                  style={{
                    width: 42, height: 42, borderRadius: 9,
                    background: m.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <i className={`bi ${m.icono}`} style={{ fontSize: 20, color: m.color }} />
                </div>
                <div className="fw-bold mb-1" style={{ fontSize: 13, color: '#1e293b' }}>
                  {m.titulo}
                </div>
                <div className="text-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {m.descripcion}
                </div>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MantenedoresPage;