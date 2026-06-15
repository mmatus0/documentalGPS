import React, { useState, useEffect } from 'react';
import axios from '../../services/axiosConfig';

const VisadorEdit = ({ visador, onVolver }) => {
  const [formData,  setFormData]  = useState({ cargo: visador.cargo || '', area_id: visador.area_id || '' });
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState('');
  const [guardando, setGuardando] = useState(false);
  const [areas,     setAreas]     = useState([]);
  const [cargandoAreas, setCargandoAreas] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get('/api/areas');
        setAreas((res.data || []).filter(a => a.estado_id === 1));
      } catch { setApiError('Error al cargar las áreas'); }
      finally { setCargandoAreas(false); }
    };
    cargar();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setApiError('');
  };

  const validar = () => {
    const e = {};
    if (!formData.area_id) e.area_id = 'El área es obligatoria';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errores = validar();
    if (Object.keys(errores).length > 0) { setErrors(errores); return; }
    try {
      setGuardando(true);
      await axios.put(`/api/visadores/${visador.id}`, formData);
      onVolver();
    } catch (error) {
      setApiError(error.response?.data?.error || 'Error al actualizar el visador');
    } finally { setGuardando(false); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 className="fw-bold mb-1">Editar Visador</h5>
          <p className="text-muted small mb-0">Actualiza el área o cargo del visador</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>
          <i className="bi bi-arrow-left me-1" />Volver al Listado
        </button>
      </div>

      <div className="card border">
        <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
          <i className="bi bi-person-badge-fill" style={{ fontSize: 22, color: 'var(--primary)' }} />
          <div>
            <p className="fw-semibold mb-0 small">{visador.usuario_nombre}</p>
            <p className="text-muted mb-0" style={{ fontSize: 12 }}>Editar datos de visador</p>
          </div>
        </div>

        {apiError && <div className="alert alert-danger py-2 small mx-4 mt-3 mb-0">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="border-bottom">
            <div className="px-4 py-2 bg-light border-bottom">
              <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                <i className="bi bi-pencil me-1" />Editar Datos
              </span>
            </div>
            <div className="row g-3 p-4">
              <div className="col-md-6">
                <label className="form-label small fw-medium">
                  Área <span className="text-danger">*</span>
                </label>
                {cargandoAreas ? (
                  <div className="text-muted small"><span className="spinner-border spinner-border-sm me-1" />Cargando...</div>
                ) : (
                  <select name="area_id"
                    className={`form-select ${errors.area_id ? 'is-invalid' : ''}`}
                    value={formData.area_id} onChange={handleChange}>
                    <option value="">Seleccionar área...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre} — {a.contratista_nombre || ''}</option>
                    ))}
                  </select>
                )}
                {errors.area_id && <div className="invalid-feedback">{errors.area_id}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label small fw-medium">Cargo</label>
                <input type="text" name="cargo"
                  className="form-control"
                  placeholder="Ej: Jefe de Área, Supervisor Técnico..."
                  value={formData.cargo} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center p-4 bg-light">
            <button type="submit" className="btn btn-primary px-5" disabled={guardando || cargandoAreas}>
              {guardando
                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                : <><i className="bi bi-floppy me-2" />Guardar Cambios</>
              }
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default VisadorEdit;