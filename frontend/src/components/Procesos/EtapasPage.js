import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';
import Modales from '../Shared/Modales';

const FORM_VACIO = {
  titulo: '', secuencia: '', revisor_id: '', aprobador_id: '',
  dias_revision: 5, dias_aprobacion: 5, requiere_aprobador: true,
};

const EtapasPage = ({ proceso, onVolver }) => {
  const [etapas,    setEtapas]    = useState([]);
  const [usuarios,  setUsuarios]  = useState([]);
  const [vista,     setVista]     = useState('listado');
  const [etapaEdit, setEtapaEdit] = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [exito,     setExito]     = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modal,     setModal]     = useState({ visible: false });

  const fetchEtapas = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/etapas?proceso_id=${proceso.id}`);
      setEtapas(data);
    } catch {
      console.error('Error al cargar etapas');
    }
  }, [proceso.id]);

  useEffect(() => {
    fetchEtapas();
    axios.get('/api/users')
      .then(({ data }) => setUsuarios(data.filter(u => u.estado_id === 1)))
      .catch(() => {});
  }, [fetchEtapas]);

  const irACrear = () => {
    const siguienteSecuencia = etapas.length > 0
      ? Math.max(...etapas.map(e => e.secuencia)) + 1
      : 1;
    setForm({ ...FORM_VACIO, secuencia: siguienteSecuencia });
    setErrors({});
    setApiError('');
    setExito('');
    setVista('crear');
  };

  const irAEditar = (e) => {
    setEtapaEdit(e);
    setForm({
      titulo:             e.titulo,
      secuencia:          e.secuencia,
      revisor_id:         String(e.revisor_id),
      aprobador_id:       String(e.aprobador_id),
      dias_revision:      e.dias_revision,
      dias_aprobacion:    e.dias_aprobacion,
      requiere_aprobador: Boolean(e.requiere_aprobador),
    });
    setErrors({});
    setApiError('');
    setExito('');
    setVista('editar');
  };

  const irAListado = () => {
    setVista('listado');
    setEtapaEdit(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validar = () => {
    const e = {};
    if (!form.titulo.trim())   e.titulo      = 'El título es obligatorio';
    if (!form.secuencia)       e.secuencia   = 'La secuencia es obligatoria';
    if (!form.revisor_id)      e.revisor_id  = 'El revisor es obligatorio';
    if (form.requiere_aprobador && !form.aprobador_id)
      e.aprobador_id = 'El aprobador es obligatorio';
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setGuardando(true);
    const payload = {
      proceso_id:         proceso.id,
      titulo:             form.titulo.trim(),
      secuencia:          Number(form.secuencia),
      revisor_id:         Number(form.revisor_id),
      aprobador_id:       form.requiere_aprobador ? Number(form.aprobador_id) : Number(form.revisor_id),
      dias_revision:      Number(form.dias_revision),
      dias_aprobacion:    Number(form.dias_aprobacion),
      requiere_aprobador: form.requiere_aprobador,
    };
    try {
      if (vista === 'crear') {
        await axios.post('/api/etapas', payload);
        setExito('Etapa creada correctamente');
      } else {
        await axios.put(`/api/etapas/${etapaEdit.id}`, payload);
        setExito('Etapa actualizada correctamente');
      }
      await fetchEtapas();
      setTimeout(() => { setExito(''); irAListado(); }, 1200);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (etapa) => {
    setModal({
      visible: true,
      titulo: 'Eliminar Etapa',
      mensaje: `¿Está seguro que desea eliminar la etapa "${etapa.titulo}"? Esta acción no se puede deshacer.`,
      labelConfirmar: 'Eliminar',
      variante: 'danger',
      onConfirmar: async () => {
        try {
          await axios.delete(`/api/etapas/${etapa.id}`);
          setModal({ visible: false });
          fetchEtapas();
        } catch (err) {
          setModal({ visible: false });
          setApiError(err.response?.data?.error || 'Error al eliminar');
        }
      },
    });
  };

  // ── Formulario ─────────────────────────────────────────────────────────────
  if (vista === 'crear' || vista === 'editar') {
    return (
      <>
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            <h5 className="fw-bold mb-1">
              {vista === 'crear' ? 'Nueva Etapa' : `Editar Etapa: ${etapaEdit.titulo}`}
            </h5>
            <p className="text-muted small mb-0">
              Proceso: <strong>{proceso.nombre}</strong>
            </p>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={irAListado}>
            <i className="bi bi-arrow-left me-1" />Volver al Listado
          </button>
        </div>

        {exito && <div className="alert alert-success py-2 small"><i className="bi bi-check-lg me-1" />{exito}</div>}
        {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}

        <div className="card border">
          <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
            <i className="bi bi-list-ol" style={{ fontSize: 22, color: 'var(--primary)' }} />
            <div>
              <p className="fw-semibold mb-0 small">{vista === 'crear' ? 'Crear Nueva Etapa' : 'Editar Etapa'}</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>Configure los parámetros de la etapa del proceso.</p>
            </div>
          </div>

          <div className="p-4">
            {/* Título y secuencia */}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label className="form-label small fw-medium">Título de la Etapa <span className="text-danger">*</span></label>
                <input
                  type="text" name="titulo"
                  className={`form-control ${errors.titulo ? 'is-invalid' : ''}`}
                  placeholder="Ej: Revisión Técnica"
                  value={form.titulo} onChange={handleChange}
                />
                {errors.titulo && <div className="invalid-feedback">{errors.titulo}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-medium">N° de Secuencia <span className="text-danger">*</span></label>
                <input
                  type="number" name="secuencia" min="1"
                  className={`form-control ${errors.secuencia ? 'is-invalid' : ''}`}
                  value={form.secuencia} onChange={handleChange}
                />
                {errors.secuencia && <div className="invalid-feedback">{errors.secuencia}</div>}
                <div className="form-text">Determina el orden de ejecución</div>
              </div>
            </div>

            {/* Revisor */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-medium">Revisor <span className="text-danger">*</span></label>
                <select
                  name="revisor_id"
                  className={`form-select ${errors.revisor_id ? 'is-invalid' : ''}`}
                  value={form.revisor_id} onChange={handleChange}
                >
                  <option value="">— Selecciona un revisor —</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol})</option>
                  ))}
                </select>
                {errors.revisor_id && <div className="invalid-feedback">{errors.revisor_id}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Días máx. para revisión</label>
                <input
                  type="number" name="dias_revision" min="1"
                  className="form-control"
                  value={form.dias_revision} onChange={handleChange}
                />
              </div>
            </div>

            {/* Requiere aprobador */}
            <div className="mb-3">
              <div className="form-check">
                <input
                  type="checkbox" name="requiere_aprobador"
                  className="form-check-input"
                  id="requiereAprobador"
                  checked={form.requiere_aprobador}
                  onChange={handleChange}
                />
                <label className="form-check-label small fw-medium" htmlFor="requiereAprobador">
                  Esta etapa requiere aprobador
                </label>
              </div>
              <div className="form-text">Si no se requiere aprobador, el expediente avanza directamente a la siguiente etapa tras la revisión.</div>
            </div>

            {/* Aprobador (condicional) */}
            {form.requiere_aprobador && (
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-medium">Aprobador <span className="text-danger">*</span></label>
                  <select
                    name="aprobador_id"
                    className={`form-select ${errors.aprobador_id ? 'is-invalid' : ''}`}
                    value={form.aprobador_id} onChange={handleChange}
                  >
                    <option value="">— Selecciona un aprobador —</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nombre_completo} ({u.rol})</option>
                    ))}
                  </select>
                  {errors.aprobador_id && <div className="invalid-feedback">{errors.aprobador_id}</div>}
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-medium">Días máx. para aprobación</label>
                  <input
                    type="number" name="dias_aprobacion" min="1"
                    className="form-control"
                    value={form.dias_aprobacion} onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="d-flex justify-content-center p-4 bg-light border-top">
            <button className="btn btn-primary px-5" onClick={handleGuardar} disabled={guardando}>
              {guardando
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-floppy me-2" />{vista === 'crear' ? 'Registrar Etapa' : 'Guardar Cambios'}</>
              }
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Listado ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <button className="btn btn-link btn-sm text-muted p-0 mb-2" onClick={onVolver}>
            <i className="bi bi-arrow-left me-1" />Volver a Procesos
          </button>
          <h5 className="fw-bold mb-1">Etapas del Proceso</h5>
          <p className="text-muted small mb-0">
            <i className="bi bi-arrow-repeat me-1" />
            {proceso.nombre}
            {proceso.descripcion && <span className="ms-2 text-muted">— {proceso.descripcion}</span>}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={irACrear}>
          <i className="bi bi-plus-lg me-1" />Nueva Etapa
        </button>
      </div>

      {apiError && <div className="alert alert-danger py-2 small mb-3">{apiError}</div>}

      <div className="card border">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="ps-4 small text-muted fw-semibold" style={{ width: 60 }}>Seq.</th>
                <th className="small text-muted fw-semibold">Título</th>
                <th className="small text-muted fw-semibold">Revisor</th>
                <th className="small text-muted fw-semibold">Días Rev.</th>
                <th className="small text-muted fw-semibold">Aprobador</th>
                <th className="small text-muted fw-semibold">Días Apr.</th>
                <th className="pe-4 small text-muted fw-semibold text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {etapas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5 small">
                    Este proceso no tiene etapas. Agrega la primera.
                  </td>
                </tr>
              ) : (
                etapas.map(e => (
                  <tr key={e.id}>
                    <td className="ps-4">
                      <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: 13 }}>
                        {e.secuencia}
                      </span>
                    </td>
                    <td className="small fw-medium">{e.titulo}</td>
                    <td className="small text-muted">{e.revisor_nombre}</td>
                    <td className="small text-muted">{e.dias_revision}d</td>
                    <td className="small text-muted">
                      {e.requiere_aprobador
                        ? e.aprobador_nombre
                        : <span className="text-muted fst-italic">No requerido</span>}
                    </td>
                    <td className="small text-muted">
                      {e.requiere_aprobador ? `${e.dias_aprobacion}d` : '—'}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-warning" onClick={() => irAEditar(e)}>
                          <i className="bi bi-pencil me-1" />Editar
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleEliminar(e)}>
                          <i className="bi bi-trash me-1" />Eliminar
                        </button>
                      </div>
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

export default EtapasPage;