import React, { useEffect, useState, useCallback } from 'react';
import axios from '../services/axiosConfig';

const AreaUsuarios = () => {
  const [areas,             setAreas]             = useState([]);
  const [areaSeleccionada,  setAreaSeleccionada]  = useState('');
  const [asignados,         setAsignados]         = useState([]);
  const [disponibles,       setDisponibles]       = useState([]);
  const [loadingGrupos,     setLoadingGrupos]     = useState(false);
  const [formData,          setFormData]          = useState({ usuario_id: '', rol_en_area: 'Colaborador' });
  const [errors,            setErrors]            = useState({});
  const [saving,            setSaving]            = useState(false);
  const [feedback,          setFeedback]          = useState(null);

  /* ── Cargar lista de áreas al montar ── */
  useEffect(() => {
    axios.get('/api/areas')
      .then(r => setAreas(r.data))
      .catch(() => setAreas([]));
  }, []);

  /* ── Cargar asignados y disponibles cuando cambia el área ── */
  const fetchGrupos = useCallback(async (areaId) => {
    if (!areaId) return;
    setLoadingGrupos(true);
    try {
      const [asigRes, dispRes] = await Promise.all([
        axios.get(`/api/areas/${areaId}/usuarios`),
        axios.get(`/api/areas/${areaId}/usuarios-disponibles`),
      ]);
      setAsignados(asigRes.data);
      setDisponibles(dispRes.data);
    } catch {
      setAsignados([]);
      setDisponibles([]);
    } finally {
      setLoadingGrupos(false);
    }
  }, []);

  useEffect(() => {
    setFormData({ usuario_id: '', rol_en_area: 'Colaborador' });
    setErrors({});
    setFeedback(null);
    fetchGrupos(areaSeleccionada);
  }, [areaSeleccionada, fetchGrupos]);

  /* ── Asignar usuario ── */
  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!formData.usuario_id) {
      setErrors({ usuario_id: 'Debes seleccionar un usuario' });
      return;
    }
    setSaving(true);
    try {
      await axios.post(`/api/areas/${areaSeleccionada}/usuarios`, {
        usuario_id: Number(formData.usuario_id),
        rol_en_area: formData.rol_en_area,
      });
      setFeedback({ type: 'ok', msg: 'Usuario asignado correctamente.' });
      setFormData({ usuario_id: '', rol_en_area: 'Colaborador' });
      fetchGrupos(areaSeleccionada);
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al asignar el usuario';
      setFeedback({ type: 'err', msg });
    } finally {
      setSaving(false);
    }
  };

  /* ── Remover usuario ── */
  const handleRemover = async (asignacionId, nombreUsuario) => {
    if (!window.confirm(`¿Remover a ${nombreUsuario} de esta Unidad Organizativa?`)) return;
    try {
      await axios.delete(`/api/areas/${areaSeleccionada}/usuarios/${asignacionId}`);
      setFeedback({ type: 'ok', msg: `${nombreUsuario} removido correctamente.` });
      fetchGrupos(areaSeleccionada);
    } catch {
      setFeedback({ type: 'err', msg: 'No se pudo remover al usuario.' });
    }
  };

  const colaboradores = asignados.filter(u => u.rol_en_area === 'Colaborador');
  const lectores      = asignados.filter(u => u.rol_en_area === 'Lector');

  /* ── Sub-tabla reutilizable ── */
  const TablaGrupo = ({ titulo, lista, badgeVariant }) => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center px-4 py-3">
        <h6 className="fw-bold mb-0">{titulo}</h6>
        <span className={`badge bg-${badgeVariant}`}>
          {lista.length} usuario{lista.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="card-body p-0">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th className="ps-4">Nombre</th>
              <th>Correo</th>
              <th>Rol global</th>
              <th className="text-end pe-4">Acción</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-muted py-4">
                  Sin usuarios en este grupo
                </td>
              </tr>
            ) : (
              lista.map(u => (
                <tr key={u.id}>
                  <td className="ps-4 fw-medium">{u.nombre_completo}</td>
                  <td className="text-muted small">{u.correo}</td>
                  <td>
                    <span className={`badge bg-${
                      u.rol_global === 'Administrador' ? 'primary'
                      : u.rol_global === 'Colaborador' ? 'success'
                      : 'secondary'
                    }`}>
                      {u.rol_global}
                    </span>
                  </td>
                  <td className="text-end pe-4">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleRemover(u.id, u.nombre_completo)}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Encabezado ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Asignación de Usuarios a Unidades Organizativas</h4>
          <p className="text-muted small mb-0">
            Administra qué usuarios pertenecen a cada Área como Colaborador o Lector
          </p>
        </div>
      </div>

      {/* ── Selector de área ── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom px-4 py-3">
          <h6 className="fw-bold mb-0">Seleccionar Unidad Organizativa</h6>
        </div>
        <div className="card-body px-4 py-3">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label fw-medium">Unidad Organizativa (Área)</label>
              <select
                className="form-select"
                value={areaSeleccionada}
                onChange={e => setAreaSeleccionada(e.target.value)}
              >
                <option value="">-- Selecciona un área --</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.contratista_nombre} → {a.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sección visible solo cuando hay área seleccionada ── */}
      {areaSeleccionada && (
        <>
          {/* Feedback */}
          {feedback && (
            <div
              className={`alert alert-${feedback.type === 'ok' ? 'success' : 'danger'} alert-dismissible d-flex align-items-center`}
              role="alert"
            >
              <span>{feedback.msg}</span>
              <button
                type="button"
                className="btn-close ms-auto"
                onClick={() => setFeedback(null)}
              />
            </div>
          )}

          {/* ── Formulario de asignación ── */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom px-4 py-3">
              <h6 className="fw-bold mb-0">Agregar Usuario al Área</h6>
            </div>
            <div className="card-body px-4 py-3">
              <form onSubmit={handleAsignar}>
                <div className="row g-3 align-items-end">
                  <div className="col-md-5">
                    <label className="form-label fw-medium">Usuario disponible</label>
                    <select
                      className={`form-select ${errors.usuario_id ? 'is-invalid' : ''}`}
                      value={formData.usuario_id}
                      onChange={e => {
                        setFormData({ ...formData, usuario_id: e.target.value });
                        setErrors({ ...errors, usuario_id: '' });
                      }}
                    >
                      <option value="">-- Selecciona un usuario --</option>
                      {disponibles.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre_completo} ({u.correo})
                        </option>
                      ))}
                    </select>
                    {errors.usuario_id && (
                      <div className="invalid-feedback">{errors.usuario_id}</div>
                    )}
                    {disponibles.length === 0 && !errors.usuario_id && (
                      <div className="form-text">
                        Todos los usuarios activos ya están asignados a esta área
                      </div>
                    )}
                  </div>

                  <div className="col-md-5">
                    <label className="form-label fw-medium">Rol en el Área</label>
                    <select
                      className="form-select"
                      value={formData.rol_en_area}
                      onChange={e => setFormData({ ...formData, rol_en_area: e.target.value })}
                    >
                      <option value="Colaborador">Colaborador — puede crear y gestionar expedientes</option>
                      <option value="Lector">Lector — solo puede visualizar expedientes</option>
                    </select>
                  </div>

                  <div className="col-md-2">
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={saving || disponibles.length === 0}
                    >
                      {saving ? 'Asignando…' : 'Asignar'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* ── Grupos del área ── */}
          {loadingGrupos ? (
            <div className="text-center text-muted py-5">
              <div className="spinner-border spinner-border-sm me-2" role="status" />
              Cargando grupos…
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-md-6">
                <TablaGrupo titulo={<><i className="bi bi-pencil-fill me-2"></i>Colaboradores</>} lista={colaboradores} badgeVariant="success" />
              </div>
              <div className="col-md-6">
                <TablaGrupo titulo={<><i className="bi bi-eye-fill me-2"></i>Lectores</>} lista={lectores} badgeVariant="secondary" />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AreaUsuarios;