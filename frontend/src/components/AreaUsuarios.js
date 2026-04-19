import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const rolBadge = (rol) =>
  rol === 'Colaborador' ? 'badge badge-colaborador' : 'badge badge-lector';

const AreaUsuarios = () => {
  const [areas,          setAreas]          = useState([]);
  const [areaSeleccionada, setAreaSeleccionada] = useState('');

  const [asignados,      setAsignados]      = useState([]);
  const [disponibles,    setDisponibles]    = useState([]);
  const [loadingGrupos,  setLoadingGrupos]  = useState(false);

  const [formData, setFormData] = useState({ usuario_id: '', rol_en_area: 'Colaborador' });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/areas`)
      .then(r => setAreas(r.data))
      .catch(() => setAreas([]));
  }, []);

  const fetchGrupos = useCallback(async (areaId) => {
    if (!areaId) return;
    setLoadingGrupos(true);
    try {
      const [asigRes, dispRes] = await Promise.all([
        axios.get(`${API}/api/areas/${areaId}/usuarios`),
        axios.get(`${API}/api/areas/${areaId}/usuarios-disponibles`),
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

  const validar = () => {
    const e = {};
    if (!formData.usuario_id) e.usuario_id = 'Debes seleccionar un usuario';
    return e;
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    const errs = validar();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/api/areas/${areaSeleccionada}/usuarios`, {
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

  const handleRemover = async (asignacionId, nombreUsuario) => {
    if (!window.confirm(`¿Remover a ${nombreUsuario} de esta Unidad Organizativa?`)) return;
    try {
      await axios.delete(`${API}/api/areas/${areaSeleccionada}/usuarios/${asignacionId}`);
      setFeedback({ type: 'ok', msg: `${nombreUsuario} removido correctamente.` });
      fetchGrupos(areaSeleccionada);
    } catch {
      setFeedback({ type: 'err', msg: 'No se pudo remover al usuario.' });
    }
  };

  const colaboradores = asignados.filter(u => u.rol_en_area === 'Colaborador');
  const lectores      = asignados.filter(u => u.rol_en_area === 'Lector');

  const TablaGrupo = ({ titulo, icono, lista, colorBadge }) => (
    <div className="panel" style={{ flex: 1, minWidth: 280 }}>
      <div className="panel-header">
        <span style={{ fontSize: 16 }}>{icono}</span>
        <h3>{titulo}</h3>
        <span className="badge badge-lector" style={{ marginLeft: 'auto' }}>
          {lista.length} usuario{lista.length !== 1 ? 's' : ''}
        </span>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol global</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr>
              <td colSpan="4" className="empty-state">Sin usuarios en este grupo</td>
            </tr>
          ) : (
            lista.map(u => (
              <tr key={u.id}>
                <td>{u.nombre_completo}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{u.correo}</td>
                <td>
                  <span className={rolBadge(u.rol_global)}>{u.rol_global}</span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
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
  );

  return (
    <>
      <p className="page-title">Asignación de Usuarios a Unidades Organizativas</p>
      <p className="page-subtitle">
        Administra qué usuarios pertenecen a cada Área como Colaborador o Lector
      </p>

      {/* ── Selector de área ── */}
      <div className="panel">
        <div className="panel-header">
          <h3>Seleccionar Unidad Organizativa</h3>
        </div>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Unidad Organizativa (Área)</label>
            <select
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

      {/* ── Sección visible solo cuando hay área seleccionada ── */}
      {areaSeleccionada && (
        <>
          {/* Feedback */}
          {feedback && (
            <div
              className="panel"
              style={{
                padding: '12px 22px',
                background: feedback.type === 'ok'
                  ? 'var(--success-light)'
                  : 'var(--danger-light)',
                borderLeft: `4px solid ${feedback.type === 'ok'
                  ? 'var(--success)'
                  : 'var(--danger)'}`,
                color: feedback.type === 'ok' ? 'var(--success)' : 'var(--danger)',
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{feedback.msg}</span>
              <button
                onClick={() => setFeedback(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Formulario de asignación ── */}
          <div className="panel">
            <div className="panel-header">
              <h3>Agregar Usuario al Área</h3>
            </div>
            <form onSubmit={handleAsignar}>
              <div className="form-grid">
                <div className="field">
                  <label>Usuario disponible</label>
                  <select
                    name="usuario_id"
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
                    <span className="field-error">{errors.usuario_id}</span>
                  )}
                  {disponibles.length === 0 && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Todos los usuarios activos ya están asignados a este área
                    </span>
                  )}
                </div>

                <div className="field">
                  <label>Rol en el Área</label>
                  <select
                    name="rol_en_area"
                    value={formData.rol_en_area}
                    onChange={e => setFormData({ ...formData, rol_en_area: e.target.value })}
                  >
                    <option value="Colaborador">Colaborador — puede crear y gestionar expedientes</option>
                    <option value="Lector">Lector — solo puede visualizar expedientes</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || disponibles.length === 0}
                >
                  {saving ? 'Asignando…' : 'Asignar al área'}
                </button>
              </div>
            </form>
          </div>

          {/* ── Grupos del área ── */}
          {loadingGrupos ? (
            <div className="panel" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              Cargando grupos…
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <TablaGrupo
                titulo="Colaboradores"
                icono="✏️"
                lista={colaboradores}
              />
              <TablaGrupo
                titulo="Lectores"
                icono="👁️"
                lista={lectores}
              />
            </div>
          )}
        </>
      )}
    </>
  );
};

export default AreaUsuarios;