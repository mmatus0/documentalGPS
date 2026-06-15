import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';

// ─── Configuraciones visuales ─────────────────────────────────────────────────
const ESTADO_TAREA_CFG = {
  'Pendiente':   { color: '#64748b', bg: '#f1f5f9', icon: 'bi-clock'            },
  'En Progreso': { color: '#d97706', bg: '#fffbeb', icon: 'bi-play-circle-fill' },
  'Completada':  { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle-fill'},
  'Rechazada':   { color: '#dc2626', bg: '#fef2f2', icon: 'bi-x-circle-fill'    },
};

const TIPO_CFG = {
  Revision:     { label: 'Revisión',     color: '#d97706', icon: 'bi-eye'          },
  Aprobacion:   { label: 'Aprobación',   color: '#16a34a', icon: 'bi-check2-circle'},
  Colaboracion: { label: 'Colaboración', color: '#ea580c', icon: 'bi-people'       },
};

const EstadoBadge = ({ estado }) => {
  const cfg = ESTADO_TAREA_CFG[estado] || ESTADO_TAREA_CFG['Pendiente'];
  return (
    <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
      style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, border: `1px solid ${cfg.color}33` }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />{estado}
    </span>
  );
};

const TipoBadge = ({ tipo }) => {
  const cfg = TIPO_CFG[tipo] || { label: tipo, color: '#64748b', icon: 'bi-circle' };
  return (
    <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
      style={{ background: `${cfg.color}15`, color: cfg.color, fontSize: 11, fontWeight: 600, border: `1px solid ${cfg.color}44` }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />{cfg.label}
    </span>
  );
};

const esVencida = (fechaVenc, estadoId) =>
  estadoId === 9 || estadoId === 10
    ? fechaVenc && new Date(fechaVenc) < new Date()
    : false;

// ─── Panel de acción (modal interno) ─────────────────────────────────────────
const PanelAccion = ({ tarea, usuario, onCerrar, onAccionCompletada }) => {
  const [comentario,      setComentario]      = useState('');
  const [colaboradorId,   setColaboradorId]   = useState('');
  const [tipoColabId,     setTipoColabId]     = useState('');
  const [fechaLimite,     setFechaLimite]     = useState('');
  const [mostrarColab,    setMostrarColab]     = useState(false);
  const [colaboradores,   setColaboradores]   = useState([]);
  const [tiposColab,      setTiposColab]      = useState([]);
  const [cargando,        setCargando]        = useState(false);
  const [error,           setError]           = useState('');
  const [detalle,         setDetalle]         = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(true);

  // Cargar detalle completo (historial + docs + sub-tareas)
  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(`/api/tareas/${tarea.id}`);
        setDetalle(res.data);
        // Si está Pendiente, abrir automáticamente
        if (res.data.estado_id === 9) {
          await axios.patch(`/api/tareas/${tarea.id}/abrir`);
          setDetalle(prev => ({ ...prev, estado_id: 10, estado: 'En Progreso' }));
        }
      } catch { setError('Error al cargar el detalle de la tarea'); }
      finally { setCargandoDetalle(false); }
    };
    cargar();
  }, [tarea.id]);

  // Cargar colaboradores y tipos de colaboración para el panel de solicitar
  useEffect(() => {
    if (!mostrarColab || !detalle) return;
    const cargarDatos = async () => {
      try {
        const [rColab, rTipos] = await Promise.all([
          axios.get(`/api/areas/${detalle.area_id}/usuarios`),
          axios.get('/api/tipos-colab'),
        ]);
        setColaboradores((rColab.data || []).filter(u => u.id !== usuario.id));
        setTiposColab((rTipos.data || []).filter(t => t.estado_id === 1));
      } catch { /* ignorar */ }
    };
    cargarDatos();
  }, [mostrarColab, detalle, usuario.id]);

  const ejecutarAccion = async (endpoint, body) => {
    if (!comentario.trim()) { setError('El comentario es obligatorio'); return; }
    try {
      setCargando(true);
      setError('');
      await axios.post(`/api/tareas/${tarea.id}/${endpoint}`, { comentario, ...body });
      onAccionCompletada();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al procesar la acción');
    } finally { setCargando(false); }
  };

  const ejecutarColaboracion = async () => {
    if (!colaboradorId) { setError('Selecciona un colaborador'); return; }
    if (!tipoColabId)   { setError('Selecciona el tipo de colaboración'); return; }
    if (!fechaLimite)   { setError('La fecha límite es obligatoria'); return; }
    if (!comentario.trim()) { setError('El comentario es obligatorio'); return; }
    try {
      setCargando(true);
      setError('');
      await axios.post(`/api/tareas/${tarea.id}/solicitar-colaboracion`, {
        colaborador_id: colaboradorId,
        tipo_colab_id:  tipoColabId,
        fecha_limite:   fechaLimite,
        comentario,
      });
      onAccionCompletada();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al solicitar colaboración');
    } finally { setCargando(false); }
  };

  const esResponsable = tarea.asignado_a_id === usuario.id || usuario.rol_id === 1;
  const tareaActiva   = [9, 10].includes(detalle?.estado_id);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <TipoBadge tipo={tarea.tipo} />
              {detalle && <EstadoBadge estado={detalle.estado} />}
            </div>
            <div className="fw-bold" style={{ fontSize: 16 }}>{tarea.expediente_nombre}</div>
            <div className="text-muted small">{tarea.correlativo} · {tarea.area_nombre}</div>
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={onCerrar}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {cargandoDetalle ? (
            <div className="text-center py-4 text-muted small">
              <span className="spinner-border spinner-border-sm me-2" />Cargando detalle...
            </div>
          ) : (
            <>
              {/* Info básica */}
              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Asignado a</div>
                  <div className="fw-medium small">{tarea.asignado_a_nombre}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Vence</div>
                  <div className={`fw-medium small ${esVencida(tarea.fecha_vencimiento, detalle?.estado_id) ? 'text-danger' : ''}`}>
                    {tarea.fecha_vencimiento
                      ? new Date(tarea.fecha_vencimiento).toLocaleDateString('es-CL')
                      : '—'}
                    {esVencida(tarea.fecha_vencimiento, detalle?.estado_id) && (
                      <span className="ms-1 badge bg-danger" style={{ fontSize: 10 }}>Vencida</span>
                    )}
                  </div>
                </div>
                {tarea.tipo_colaboracion && (
                  <div className="col-12">
                    <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Tipo colaboración</div>
                    <div className="fw-medium small">{tarea.tipo_colaboracion}</div>
                  </div>
                )}
              </div>

              {/* Sub-tareas de colaboración pendientes */}
              {detalle?.sub_tareas?.length > 0 && (
                <div className="mb-4">
                  <div className="fw-semibold small mb-2" style={{ color: '#ea580c' }}>
                    <i className="bi bi-people me-1" />Colaboraciones en curso
                  </div>
                  {detalle.sub_tareas.map(st => (
                    <div key={st.id} className="d-flex align-items-center justify-content-between p-2 rounded mb-1"
                      style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <div className="small">
                        <span className="fw-medium">{st.asignado_a_nombre}</span>
                        {st.tipo_colaboracion && <span className="text-muted ms-2">· {st.tipo_colaboracion}</span>}
                      </div>
                      <EstadoBadge estado={st.estado} />
                    </div>
                  ))}
                </div>
              )}

              {/* Historial del expediente */}
              {detalle?.historial?.length > 0 && (
                <div className="mb-4">
                  <div className="fw-semibold small mb-2 text-muted">
                    <i className="bi bi-clock-history me-1" />Historial del expediente
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 12 }}>
                    {detalle.historial.map((h, i) => (
                      <div key={i} className="d-flex gap-2 mb-1 align-items-start p-2 rounded" style={{ background: '#f8fafc' }}>
                        <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                          {new Date(h.fecha).toLocaleDateString('es-CL')}
                        </span>
                        <span className="fw-medium">{h.estado_nuevo}</span>
                        <span className="text-muted">· {h.usuario}</span>
                        {h.comentario && <span style={{ fontStyle: 'italic', color: '#475569' }}>— {h.comentario}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documentos adjuntos */}
              {detalle?.documentos?.length > 0 && (
                <div className="mb-4">
                  <div className="fw-semibold small mb-2 text-muted">
                    <i className="bi bi-paperclip me-1" />Documentos adjuntos
                  </div>
                  {detalle.documentos.map(d => (
                    <div key={d.id} className="d-flex align-items-center gap-2 p-2 rounded mb-1"
                      style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <i className="bi bi-file-earmark text-muted" />
                      <span className="small fw-medium">{d.nombre_archivo}</span>
                      <span className="text-muted small ms-auto">{d.subido_por}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Área de acción (solo si la tarea está activa y el usuario es el responsable) */}
              {esResponsable && tareaActiva && !mostrarColab && (
                <div className="border-top pt-4">
                  {error && (
                    <div className="alert alert-danger py-2 small mb-3">{error}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label small fw-medium">
                      Comentario <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Escribe tu comentario antes de tomar una acción..."
                      value={comentario}
                      onChange={e => { setComentario(e.target.value); setError(''); }}
                    />
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    {tarea.tipo === 'Revision' && (
                      <>
                        <button className="btn btn-success btn-sm" disabled={cargando}
                          onClick={() => ejecutarAccion('aceptar')}>
                          <i className="bi bi-check-lg me-1" />Aceptar Revisión
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={cargando}
                          onClick={() => ejecutarAccion('rechazar')}>
                          <i className="bi bi-x-lg me-1" />Rechazar
                        </button>
                        <button className="btn btn-outline-warning btn-sm" disabled={cargando}
                          onClick={() => setMostrarColab(true)}>
                          <i className="bi bi-people me-1" />Solicitar Colaboración
                        </button>
                      </>
                    )}
                    {tarea.tipo === 'Aprobacion' && (
                      <>
                        <button className="btn btn-success btn-sm" disabled={cargando}
                          onClick={() => ejecutarAccion('aprobar')}>
                          <i className="bi bi-check2-circle me-1" />Aprobar
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={cargando}
                          onClick={() => ejecutarAccion('rechazar-aprobacion')}>
                          <i className="bi bi-x-lg me-1" />Rechazar
                        </button>
                        <button className="btn btn-outline-warning btn-sm" disabled={cargando}
                          onClick={() => setMostrarColab(true)}>
                          <i className="bi bi-people me-1" />Solicitar Colaboración
                        </button>
                      </>
                    )}
                    {tarea.tipo === 'Colaboracion' && (
                      <button className="btn btn-primary btn-sm" disabled={cargando}
                        onClick={() => ejecutarAccion('cerrar-colaboracion')}>
                        <i className="bi bi-check2 me-1" />Cerrar mi Colaboración
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario de solicitar colaboración */}
              {esResponsable && tareaActiva && mostrarColab && (
                <div className="border-top pt-4">
                  <div className="fw-semibold small mb-3" style={{ color: '#ea580c' }}>
                    <i className="bi bi-people-fill me-1" />Solicitar Colaboración
                  </div>
                  {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
                  <div className="row g-3 mb-3">
                    <div className="col-12">
                      <label className="form-label small fw-medium">Colaborador <span className="text-danger">*</span></label>
                      <select className="form-select form-select-sm" value={colaboradorId}
                        onChange={e => { setColaboradorId(e.target.value); setError(''); }}>
                        <option value="">Seleccionar colaborador del área...</option>
                        {colaboradores.map(c => (
                          <option key={c.id} value={c.id}>{c.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Tipo de colaboración <span className="text-danger">*</span></label>
                      <select className="form-select form-select-sm" value={tipoColabId}
                        onChange={e => { setTipoColabId(e.target.value); setError(''); }}>
                        <option value="">Seleccionar tipo...</option>
                        {tiposColab.map(t => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-medium">Fecha límite <span className="text-danger">*</span></label>
                      <input type="date" className="form-control form-control-sm" value={fechaLimite}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => { setFechaLimite(e.target.value); setError(''); }} />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-medium">Comentario <span className="text-danger">*</span></label>
                      <textarea className="form-control form-control-sm" rows={2}
                        placeholder="Instrucciones para el colaborador..."
                        value={comentario}
                        onChange={e => { setComentario(e.target.value); setError(''); }} />
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-warning btn-sm" disabled={cargando} onClick={ejecutarColaboracion}>
                      <i className="bi bi-send me-1" />Enviar Colaboración
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => { setMostrarColab(false); setError(''); }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Tarea completada o rechazada */}
              {(!tareaActiva) && (
                <div className="border-top pt-3 text-center text-muted small">
                  <i className={`bi ${detalle?.estado_id === 11 ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} d-block mb-1`}
                    style={{ fontSize: 24 }} />
                  Esta tarea ya fue {detalle?.estado === 'Completada' ? 'completada' : 'rechazada'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal TareasPage ─────────────────────────────────────────
const TareasPage = ({ usuario }) => {
  const [tareas,          setTareas]          = useState([]);
  const [cargando,        setCargando]        = useState(true);
  const [error,           setError]           = useState('');
  const [filtroEstado,    setFiltroEstado]    = useState('activas');
  const [filtroTipo,      setFiltroTipo]      = useState('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const esAdmin = usuario.rol_id === 1;

  const cargarTareas = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipo', filtroTipo);
      const res = await axios.get(`/api/tareas?${params}`);
      setTareas(res.data || []);
    } catch {
      setError('Error al cargar las tareas');
    } finally {
      setCargando(false);
    }
  }, [filtroTipo]);

  useEffect(() => { cargarTareas(); }, [cargarTareas]);

  const tareasFiltradas = tareas.filter(t => {
    if (filtroEstado === 'activas')    return [9, 10].includes(t.estado_id);
    if (filtroEstado === 'completadas') return t.estado_id === 11;
    if (filtroEstado === 'rechazadas')  return t.estado_id === 12;
    return true;
  });

  const contadores = {
    activas:     tareas.filter(t => [9, 10].includes(t.estado_id)).length,
    completadas: tareas.filter(t => t.estado_id === 11).length,
    rechazadas:  tareas.filter(t => t.estado_id === 12).length,
  };

  const handleAccionCompletada = () => {
    setTareaSeleccionada(null);
    cargarTareas();
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 className="fw-bold mb-1">
            <i className="bi bi-list-task me-2" style={{ color: 'var(--primary)' }} />
            {esAdmin ? 'Todas las Tareas' : 'Mis Tareas'}
          </h5>
          <p className="text-muted small mb-0">
            {esAdmin
              ? 'Visibilidad transversal de todas las tareas del sistema'
              : 'Tareas asignadas a tu usuario'}
          </p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={cargarTareas} disabled={cargando}>
          <i className={`bi bi-arrow-clockwise me-1 ${cargando ? 'spin' : ''}`} />Actualizar
        </button>
      </div>

      {/* Contadores */}
      <div className="row g-3 mb-4">
        {[
          { key: 'activas',     label: 'Activas',     color: '#d97706', bg: '#fffbeb', icon: 'bi-play-circle' },
          { key: 'completadas', label: 'Completadas', color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle' },
          { key: 'rechazadas',  label: 'Rechazadas',  color: '#dc2626', bg: '#fef2f2', icon: 'bi-x-circle'    },
        ].map(({ key, label, color, bg, icon }) => (
          <div key={key} className="col-md-4">
            <button
              onClick={() => setFiltroEstado(key)}
              style={{
                width: '100%', border: `2px solid ${filtroEstado === key ? color : '#e2e8f0'}`,
                borderRadius: 10, background: filtroEstado === key ? bg : 'white',
                padding: '14px 16px', cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
              <i className={`bi ${icon}`} style={{ fontSize: 22, color }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{contadores[key]}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Filtro tipo */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        {['', 'Revision', 'Aprobacion', 'Colaboracion'].map(tipo => (
          <button key={tipo} onClick={() => setFiltroTipo(tipo)}
            className={`btn btn-sm ${filtroTipo === tipo ? 'btn-primary' : 'btn-outline-secondary'}`}>
            {tipo === '' ? 'Todos los tipos' : TIPO_CFG[tipo]?.label || tipo}
          </button>
        ))}
      </div>

      {/* Lista */}
      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {cargando ? (
        <div className="text-center py-5 text-muted">
          <span className="spinner-border spinner-border-sm me-2" />Cargando tareas...
        </div>
      ) : tareasFiltradas.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-inbox d-block mb-2" style={{ fontSize: 36 }} />
          <div className="small">No hay tareas en esta categoría</div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: '#f8fafc', fontSize: 11 }}>
                <tr>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Expediente</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Tipo</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Etapa</th>
                  {esAdmin && <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Asignado a</th>}
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Vence</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Estado</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {tareasFiltradas.map(t => {
                  const vencida = esVencida(t.fecha_vencimiento, t.estado_id);
                  return (
                    <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setTareaSeleccionada(t)}>
                      <td className="px-3 py-3">
                        <div className="fw-medium">{t.expediente_nombre}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>{t.correlativo} · {t.area_nombre}</div>
                      </td>
                      <td className="px-3 py-3"><TipoBadge tipo={t.tipo} /></td>
                      <td className="px-3 py-3 text-muted small">{t.etapa_titulo}</td>
                      {esAdmin && <td className="px-3 py-3 small">{t.asignado_a_nombre}</td>}
                      <td className="px-3 py-3 small">
                        {t.fecha_vencimiento
                          ? <span className={vencida ? 'text-danger fw-semibold' : ''}>
                              {vencida && <i className="bi bi-exclamation-circle me-1" />}
                              {new Date(t.fecha_vencimiento).toLocaleDateString('es-CL')}
                            </span>
                          : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-3 py-3"><EstadoBadge estado={t.estado} /></td>
                      <td className="px-3 py-3">
                        <button className="btn btn-sm btn-outline-primary"
                          onClick={e => { e.stopPropagation(); setTareaSeleccionada(t); }}>
                          <i className="bi bi-arrow-right" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Panel de acción */}
      {tareaSeleccionada && (
        <PanelAccion
          tarea={tareaSeleccionada}
          usuario={usuario}
          onCerrar={() => setTareaSeleccionada(null)}
          onAccionCompletada={handleAccionCompletada}
        />
      )}
    </>
  );
};

export default TareasPage;