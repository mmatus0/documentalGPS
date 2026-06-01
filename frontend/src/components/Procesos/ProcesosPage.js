import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';
import Modales from '../Shared/Modales';

const FORM_VACIO = { nombre: '', descripcion: '' };

const ProcesosPage = ({ onVolver }) => {
  const [procesos,    setProcesos]    = useState([]);
  const [tabActiva,   setTabActiva]   = useState('activos');
  const [vista,       setVista]       = useState('listado'); // 'listado' | 'crear' | 'editar'
  const [procesoEdit, setProcesoEdit] = useState(null);
  const [form,        setForm]        = useState(FORM_VACIO);
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState('');
  const [exito,       setExito]       = useState('');
  const [guardando,   setGuardando]   = useState(false);
  const [modal,       setModal]       = useState({ visible: false });

  const fetchProcesos = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/procesos');
      setProcesos(data);
    } catch {
      console.error('Error al cargar procesos');
    }
  }, []);

  useEffect(() => { fetchProcesos(); }, [fetchProcesos]);

  const irACrear = () => {
    setForm(FORM_VACIO);
    setErrors({});
    setApiError('');
    setExito('');
    setVista('crear');
  };

  const irAEditar = (p) => {
    setProcesoEdit(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '' });
    setErrors({});
    setApiError('');
    setExito('');
    setVista('editar');
  };

  const irAListado = () => {
    setVista('listado');
    setProcesoEdit(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre del proceso es obligatorio';
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setGuardando(true);
    try {
      if (vista === 'crear') {
        await axios.post('/api/procesos', { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null });
        setExito('Proceso creado correctamente');
      } else {
        await axios.put(`/api/procesos/${procesoEdit.id}`, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null });
        setExito('Proceso actualizado correctamente');
      }
      await fetchProcesos();
      setTimeout(() => { setExito(''); irAListado(); }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = (p) => {
    setModal({
      visible: true,
      titulo: 'Desactivar Proceso',
      mensaje: `¿Está seguro que desea desactivar el proceso "${p.nombre}"? Las áreas que lo tengan asignado mantendrán los expedientes en curso.`,
      labelConfirmar: 'Desactivar',
      variante: 'danger',
      onConfirmar: async () => {
        await axios.delete(`/api/procesos/${p.id}`);
        setModal({ visible: false });
        fetchProcesos();
      },
    });
  };

  const handleReactivar = (p) => {
    setModal({
      visible: true,
      titulo: 'Reactivar Proceso',
      mensaje: `¿Desea reactivar el proceso "${p.nombre}"?`,
      labelConfirmar: 'Reactivar',
      variante: 'primary',
      onConfirmar: async () => {
        await axios.patch(`/api/procesos/${p.id}/reactivar`);
        setModal({ visible: false });
        fetchProcesos();
      },
    });
  };

  const lista = procesos.filter(p => tabActiva === 'activos' ? p.estado_id === 1 : p.estado_id === 2);

  // ── Vista Formulario (crear / editar) ──────────────────────────────────────
  if (vista === 'crear' || vista === 'editar') {
    return (
      <>
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h5 className="fw-bold mb-1">{vista === 'crear' ? 'Nuevo Proceso' : `Editar Proceso: ${procesoEdit.nombre}`}</h5>
            <p className="text-muted small mb-0">
              {vista === 'crear' ? 'Define un nuevo proceso documental' : 'Modifica los datos del proceso'}
            </p>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={irAListado}>
            <i className="bi bi-arrow-left me-1" />Volver al Listado
          </button>
        </div>

        {exito && <div className="alert alert-success py-2 small"><i className="bi bi-check-lg me-1" />{exito}</div>}

        <div className="card border">
          <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
            <i className="bi bi-arrow-repeat" style={{ fontSize: 22, color: 'var(--primary)' }} />
            <div>
              <p className="fw-semibold mb-0 small">{vista === 'crear' ? 'Crear Nuevo Proceso' : 'Editar Proceso'}</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>Complete la información del proceso documental.</p>
            </div>
          </div>

          {apiError && <div className="alert alert-danger py-2 small mx-4 mt-3 mb-0">{apiError}</div>}

          <div className="p-4">
            <div className="mb-3">
              <label className="form-label small fw-medium">Nombre del Proceso <span className="text-danger">*</span></label>
              <input
                type="text" name="nombre"
                className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                placeholder="Ej: Revisión de Documentos Técnicos"
                value={form.nombre} onChange={handleChange}
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label small fw-medium">Descripción</label>
              <textarea
                name="descripcion" rows={3}
                className="form-control"
                placeholder="Descripción opcional del proceso..."
                value={form.descripcion} onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-center p-4 bg-light border-top">
            <button className="btn btn-primary px-5" onClick={handleGuardar} disabled={guardando}>
              {guardando
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-floppy me-2" />{vista === 'crear' ? 'Registrar Proceso' : 'Guardar Cambios'}</>
              }
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Vista Listado ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-link btn-sm text-muted p-0 mb-2" onClick={onVolver}>
            <i className="bi bi-arrow-left me-1" />Volver a Mantenedores
          </button>
          <h5 className="fw-bold mb-1">Gestión de Procesos</h5>
          <p className="text-muted small mb-0">Define los flujos documentales que seguirán las unidades organizativas</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={irACrear}>
          <i className="bi bi-plus-lg me-1" />Nuevo Proceso
        </button>
      </div>

      <div className="card border">
        <div className="px-4 border-bottom py-1">
          <ul className="nav nav-tabs border-bottom-0">
            {['activos', 'inactivos'].map(tab => (
              <li className="nav-item" key={tab}>
                <button
                  className={`nav-link border-0 ${tabActiva === tab ? 'active fw-semibold' : 'text-muted'}`}
                  onClick={() => setTabActiva(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 small text-muted fw-semibold">Nombre</th>
                <th className="small text-muted fw-semibold">Descripción</th>
                <th className="small text-muted fw-semibold">Áreas asignadas</th>
                <th className="small text-muted fw-semibold">Estado</th>
                <th className="pe-4 small text-muted fw-semibold text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {lista.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5 small">
                    No hay procesos {tabActiva}
                  </td>
                </tr>
              ) : (
                lista.map(p => (
                  <tr key={p.id}>
                    <td className="ps-4 small fw-medium">{p.nombre}</td>
                    <td className="small text-muted">{p.descripcion || '—'}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">{p.total_areas}</span>
                    </td>
                    <td>
                      <span className={`badge ${p.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {p.estado_id === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      {tabActiva === 'activos' ? (
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => irAEditar(p)}>
                            <i className="bi bi-pencil me-1" />Editar
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(p)}>
                            <i className="bi bi-slash-circle me-1" />Desactivar
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(p)}>
                          <i className="bi bi-arrow-clockwise me-1" />Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modales {...modal} onCancelar={() => setModal({ visible: false })} />
    </>
  );
};

export default ProcesosPage;