import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';
import Modales from '../Shared/Modales';
import EtapasPage from './EtapasPage';

const FORM_VACIO = { nombre: '', descripcion: '' };

const ProcesosPage = ({ onVolver }) => {
  const [procesos,      setProcesos]      = useState([]);
  const [tabActiva,     setTabActiva]     = useState('activos');
  const [vista,         setVista]         = useState('listado');
  const [procesoEdit,   setProcesoEdit]   = useState(null);
  const [form,          setForm]          = useState(FORM_VACIO);
  const [errors,        setErrors]        = useState({});
  const [modal,         setModal]         = useState({ visible: false });
  const [procesoEtapas, setProcesoEtapas] = useState(null);

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
    setVista('crear');
  };

  const irAEditar = (p) => {
    setProcesoEdit(p);
    setForm({ nombre: p.nombre, descripcion: p.descripcion || '' });
    setErrors({});
    setVista('editar');
  };

  const irAListado = () => {
    setVista('listado');
    setProcesoEdit(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre del proceso es obligatorio';
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      if (vista === 'crear') {
        await axios.post('/api/procesos', { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null });
      } else {
        await axios.put(`/api/procesos/${procesoEdit.id}`, { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null });
      }
      await fetchProcesos();
      irAListado();
    } catch (err) {
      setErrors({ api: err.response?.data?.error || 'Error al guardar' });
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

  if (procesoEtapas) {
    return <EtapasPage proceso={procesoEtapas} onVolver={() => setProcesoEtapas(null)} />;
  }

  // ── Vista Crear / Editar ───────────────────────────────────────────────────
  if (vista === 'crear' || vista === 'editar') {
    return (
      <>
        <div className="d-flex align-items-center gap-2 mb-4">
          <button className="btn btn-link btn-sm text-muted p-0" onClick={irAListado}>
            <i className="bi bi-arrow-left me-1" />Volver
          </button>
          <h5 className="fw-bold mb-0">{vista === 'crear' ? 'Nuevo Proceso' : 'Editar Proceso'}</h5>
        </div>
        <div className="card border-0 shadow-sm" style={{ maxWidth: 520 }}>
          <div className="card-body px-4 py-4">
            {errors.api && (
              <div className="alert alert-danger py-2 small mb-3">{errors.api}</div>
            )}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Nombre <span className="text-danger">*</span></label>
              <input className={`form-control form-control-sm ${errors.nombre ? 'is-invalid' : ''}`}
                name="nombre" value={form.nombre} onChange={handleChange} />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label small fw-semibold">Descripción</label>
              <textarea className="form-control form-control-sm" rows={3}
                name="descripcion" value={form.descripcion} onChange={handleChange} />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handleGuardar}>
                <i className="bi bi-check-lg me-1" />{vista === 'crear' ? 'Crear' : 'Guardar'}
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={irAListado}>Cancelar</button>
            </div>
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
                  onClick={() => setTabActiva(tab)}>
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
                <tr><td colSpan="5" className="text-center text-muted py-5 small">No hay procesos {tabActiva}</td></tr>
              ) : (
                lista.map(p => (
                  <tr key={p.id}>
                    <td className="ps-4 small fw-medium">{p.nombre}</td>
                    <td className="small text-muted">{p.descripcion || '—'}</td>
                    <td><span className="badge bg-primary-subtle text-primary">{p.total_areas}</span></td>
                    <td>
                      <span className={`badge ${p.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {p.estado_id === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      {tabActiva === 'activos' ? (
                        <div className="d-flex gap-2 justify-content-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setProcesoEtapas(p)}>
                            <i className="bi bi-list-ol me-1" />Etapas
                          </button>
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
