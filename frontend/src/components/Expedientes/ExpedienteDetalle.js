import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from '../../services/axiosConfig';

// ─── Utilidades ────────────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  'Borrador':        { color: '#64748b', bg: '#f1f5f9', icon: 'bi-file-earmark'       },
  'Derivado':        { color: '#2563eb', bg: '#eff6ff', icon: 'bi-arrow-right-circle'  },
  'En Revisión':     { color: '#d97706', bg: '#fffbeb', icon: 'bi-eye'                 },
  'En Colaboración': { color: '#ea580c', bg: '#fff7ed', icon: 'bi-people'              },
  'En Aprobación':   { color: '#16a34a', bg: '#f0fdf4', icon: 'bi-check-circle'        },
  'Terminado':       { color: '#0f766e', bg: '#f0fdfa', icon: 'bi-check-circle-fill'   },
};

const ICONOS_TIPO = {
  '.pdf':  { icon: 'bi-file-earmark-pdf-fill',      color: '#ef4444' },
  '.docx': { icon: 'bi-file-earmark-word-fill',      color: '#2563eb' },
  '.xlsx': { icon: 'bi-file-earmark-excel-fill',     color: '#16a34a' },
  '.pbix': { icon: 'bi-file-earmark-bar-graph-fill', color: '#f59e0b' },
};

const EstadoBadge = ({ estado, large }) => {
  const cfg = ESTADO_CONFIG[estado] || { color: '#64748b', bg: '#f1f5f9', icon: 'bi-circle' };
  return (
    <span className="d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
      style={{ background: cfg.bg, color: cfg.color, fontSize: large ? 13 : 11, fontWeight: 600, border: `1px solid ${cfg.color}33` }}>
      <i className={`bi ${cfg.icon}`} style={{ fontSize: large ? 12 : 10 }} />
      {estado}
    </span>
  );
};

const CampoDetalle = ({ label, valor, col = 3 }) => (
  <div className={`col-md-${col}`}>
    <div className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
    <div className="fw-medium small">{valor || <span className="text-muted">—</span>}</div>
  </div>
);

// ─── Timeline de historial ─────────────────────────────────────────────────────
const LineaTiempo = ({ historial }) => {
  if (!historial || historial.length === 0) {
    return (
      <div className="text-center py-4 text-muted small">
        <i className="bi bi-clock-history d-block mb-2" style={{ fontSize: 24 }} />
        Sin historial de cambios registrado
      </div>
    );
  }
  return (
    <div style={{ position: 'relative', paddingLeft: 32 }}>
      {/* Línea vertical */}
      <div style={{
        position: 'absolute', left: 11, top: 8, bottom: 8,
        width: 2, background: 'var(--border)',
      }} />
      {historial.map((h, i) => {
        const cfgNuevo = ESTADO_CONFIG[h.estado_nuevo] || { color: '#64748b', bg: '#f1f5f9', icon: 'bi-circle' };
        return (
          <div key={h.id} style={{ position: 'relative', marginBottom: i < historial.length - 1 ? 24 : 0 }}>
            {/* Punto en la línea */}
            <div style={{
              position: 'absolute', left: -32, top: 4,
              width: 22, height: 22, borderRadius: '50%',
              background: cfgNuevo.bg, border: `2px solid ${cfgNuevo.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className={`bi ${cfgNuevo.icon}`} style={{ fontSize: 9, color: cfgNuevo.color }} />
            </div>
            <div className="card border-0" style={{ background: '#f8fafc', borderRadius: 8 }}>
              <div className="card-body px-3 py-2">
                <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      {h.estado_anterior && (
                        <>
                          <EstadoBadge estado={h.estado_anterior} />
                          <i className="bi bi-arrow-right text-muted" style={{ fontSize: 11 }} />
                        </>
                      )}
                      <EstadoBadge estado={h.estado_nuevo} />
                    </div>
                    <div className="small text-muted">
                      <i className="bi bi-person me-1" style={{ fontSize: 11 }} />
                      {h.usuario}
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: 11, flexShrink: 0 }}>
                    {h.fecha ? new Date(h.fecha).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </div>
                </div>
                {h.comentario && (
                  <div className="mt-2 px-2 py-1 rounded small"
                    style={{ background: 'white', border: '1px solid var(--border)', fontStyle: 'italic', color: '#475569' }}>
                    <i className="bi bi-chat-left-text me-1" style={{ fontSize: 10 }} />
                    {h.comentario}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Fila de documento ─────────────────────────────────────────────────────────
const FilaDocumento = ({ doc, puedeEliminar, onDescargar, onEliminar, eliminando }) => {
  const cfg = ICONOS_TIPO[doc.tipo_archivo] || { icon: 'bi-file-earmark-fill', color: '#94a3b8' };
  return (
    <tr>
      <td className="ps-4 py-3">
        <div className="d-flex align-items-center gap-2">
          <i className={`bi ${cfg.icon}`} style={{ fontSize: 20, color: cfg.color, flexShrink: 0 }} />
          <div>
            <div className="small fw-medium">{doc.nombre_archivo}</div>
            <div className="text-muted" style={{ fontSize: 10 }}>{doc.tipo_archivo?.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td className="py-3 small text-muted">{doc.subido_por}</td>
      <td className="py-3 small text-muted">
        {doc.fecha_carga ? new Date(doc.fecha_carga).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
      </td>
      <td className="pe-4 py-3">
        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-sm btn-outline-primary" style={{ fontSize: 11 }} onClick={() => onDescargar(doc)} title="Descargar">
            <i className="bi bi-download" />
          </button>
          {puedeEliminar && (
            <button className="btn btn-sm btn-outline-danger" style={{ fontSize: 11 }}
              onClick={() => onEliminar(doc)} disabled={eliminando === doc.id} title="Eliminar">
              {eliminando === doc.id
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-trash" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const ExpedienteDetalle = ({ expedienteId, usuario, onVolver }) => {
  const [expediente,  setExpediente]  = useState(null);
  const [historial,   setHistorial]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [tabActiva,   setTabActiva]   = useState('detalle');
  const [subiendo,    setSubiendo]    = useState(false);
  const [errorSubida, setErrorSubida] = useState(null);
  const [exitoSubida, setExitoSubida] = useState(null);
  const [archivoSelec, setArchivoSelec] = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [eliminando,  setEliminando]  = useState(null);
  const fileInputRef = useRef();

  const esColaborador = usuario.rol_id === 2;
  const esAdmin       = usuario.rol_id === 1;
  const puedeSubir    = esColaborador || esAdmin;

  const EXTENSIONES = ['.pdf', '.docx', '.xlsx', '.pbix'];
  const TAMANO_MAX_MB = 50;

  const fetchExpediente = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [expRes, histRes] = await Promise.all([
        axios.get(`/api/expedientes/${expedienteId}`),
        axios.get(`/api/expedientes/${expedienteId}/historial`),
      ]);
      setExpediente(expRes.data);
      setHistorial(histRes.data);
    } catch {
      setError('No se pudo cargar el expediente.');
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => { fetchExpediente(); }, [fetchExpediente]);

  const validarArchivo = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES.includes(ext)) return `Extensión no permitida. Solo: ${EXTENSIONES.join(', ')}`;
    if (file.size > TAMANO_MAX_MB * 1024 * 1024) return `El archivo supera ${TAMANO_MAX_MB}MB`;
    return null;
  };

  const handleSeleccionar = (file) => {
    setErrorSubida(null); setExitoSubida(null);
    const err = validarArchivo(file);
    if (err) { setErrorSubida(err); return; }
    setArchivoSelec(file);
  };

  const handleSubir = async () => {
    if (!archivoSelec) return;
    setSubiendo(true); setErrorSubida(null); setExitoSubida(null);
    const formData = new FormData();
    formData.append('archivo', archivoSelec);
    try {
      await axios.post(`/api/expedientes/${expedienteId}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExitoSubida(`"${archivoSelec.name}" subido correctamente`);
      setArchivoSelec(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchExpediente();
    } catch (err) {
      setErrorSubida(err.response?.data?.error || 'Error al subir el archivo');
    } finally {
      setSubiendo(false);
    }
  };

  const handleDescargar = async (doc) => {
    try {
      const res = await axios.get(`/api/expedientes/${expedienteId}/documentos/${doc.id}/descargar`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', doc.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch { alert('No se pudo descargar el archivo'); }
  };

  const handleEliminar = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.nombre_archivo}"?`)) return;
    setEliminando(doc.id);
    try {
      await axios.delete(`/api/expedientes/${expedienteId}/documentos/${doc.id}`);
      await fetchExpediente();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally { setEliminando(null); }
  };

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <div className="spinner-border spinner-border-sm me-2" role="status" />Cargando expediente…
    </div>
  );

  if (error) return (
    <div>
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={onVolver}>
        <i className="bi bi-arrow-left me-1" />Volver
      </button>
      <div className="alert alert-danger">{error}</div>
    </div>
  );

  const cfg = ESTADO_CONFIG[expediente.estado] || {};

  return (
    <div>
      {/* Botón volver */}
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={onVolver}>
        <i className="bi bi-arrow-left me-1" />Volver a expedientes
      </button>

      {/* Encabezado */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${cfg.color || 'var(--primary)'}, var(--primary))` }} />
        <div className="card-body px-4 py-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-8">
              <div className="d-flex align-items-start gap-3">
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: cfg.bg || 'var(--primary-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={`bi ${cfg.icon || 'bi-file-earmark-text-fill'}`} style={{ fontSize: 26, color: cfg.color || 'var(--primary)' }} />
                </div>
                <div>
                  <div className="text-muted small mb-1">{expediente.correlativo}</div>
                  <h4 className="fw-bold mb-1">{expediente.nombre}</h4>
                  <div className="d-flex align-items-center gap-2 text-muted small flex-wrap">
                    <span><i className="bi bi-building me-1" />{expediente.contratista_nombre}</span>
                    <span>·</span>
                    <span><i className="bi bi-diagram-3-fill me-1" />{expediente.area_nombre}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4 text-md-end">
              <EstadoBadge estado={expediente.estado} large />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="d-flex border-bottom px-4">
          {[
            { key: 'detalle',    label: 'Detalle',    icon: 'bi-info-circle'    },
            { key: 'historial',  label: 'Historial',  icon: 'bi-clock-history', badge: historial.length },
            { key: 'documentos', label: 'Documentos', icon: 'bi-paperclip',     badge: expediente.documentos?.length },
          ].map(tab => (
            <button key={tab.key}
              className={`btn btn-link text-decoration-none px-3 py-3 border-0 border-bottom d-flex align-items-center gap-1 ${tabActiva === tab.key ? 'fw-semibold border-primary' : 'text-muted'}`}
              style={{ borderBottomWidth: tabActiva === tab.key ? 2 : 0, borderBottomColor: 'var(--primary)', borderRadius: 0, fontSize: 13 }}
              onClick={() => setTabActiva(tab.key)}>
              <i className={`bi ${tab.icon}`} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="badge bg-secondary-subtle text-secondary ms-1" style={{ fontSize: 10 }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        <div className="card-body px-4 py-4">
          {/* Tab Detalle */}
          {tabActiva === 'detalle' && (
            <div className="row g-3">
              <CampoDetalle label="Correlativo"   valor={expediente.correlativo} />
              <CampoDetalle label="Tipo Documento" valor={expediente.tipo_documento} />
              <CampoDetalle label="Categoría"     valor={expediente.categoria} />
              <CampoDetalle label="Origen"        valor={expediente.origen} />
              <CampoDetalle label="Emisor"        valor={expediente.emisor} col={6} />
              <CampoDetalle label="Materia"       valor={expediente.materia} col={6} />
              <CampoDetalle label="Fecha Documento" valor={expediente.fecha_documento ? new Date(expediente.fecha_documento).toLocaleDateString('es-CL') : null} />
              <CampoDetalle label="Fecha Ingreso"  valor={expediente.fecha_ingreso ? new Date(expediente.fecha_ingreso).toLocaleDateString('es-CL') : null} />
              <CampoDetalle label="Creado por"    valor={expediente.creado_por_nombre} />
              <CampoDetalle label="Reservado"     valor={expediente.reservado ? 'Sí' : 'No'} />
            </div>
          )}

          {/* Tab Historial (HU-19) */}
          {tabActiva === 'historial' && <LineaTiempo historial={historial} />}

          {/* Tab Documentos */}
          {tabActiva === 'documentos' && (
            <div>
              {/* Zona de subida */}
              {puedeSubir && (
                <div className="mb-4">
                  <div
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--primary)' : '#cbd5e1'}`,
                      borderRadius: 10, padding: '20px', textAlign: 'center',
                      background: dragOver ? 'var(--primary-light)' : '#f8fafc',
                      transition: 'all 0.2s', cursor: 'pointer',
                    }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleSeleccionar(f); }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="d-flex justify-content-center gap-3 mb-2">
                      {['.pdf', '.docx', '.xlsx', '.pbix'].map(ext => {
                        const c = ICONOS_TIPO[ext] || {};
                        return <i key={ext} className={`bi ${c.icon}`} style={{ fontSize: 24, color: c.color }} />;
                      })}
                    </div>
                    <p className="mb-1 small fw-medium">
                      {archivoSelec
                        ? <><i className="bi bi-check-circle-fill text-success me-1" />{archivoSelec.name}</>
                        : 'Arrastra un archivo o haz clic para seleccionar'}
                    </p>
                    <p className="text-muted mb-0" style={{ fontSize: 11 }}>PDF, DOCX, XLSX, PBIX · Máximo {TAMANO_MAX_MB}MB</p>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }}
                      accept=".pdf,.docx,.xlsx,.pbix"
                      onChange={e => e.target.files[0] && handleSeleccionar(e.target.files[0])} />
                  </div>
                  {errorSubida && <div className="alert alert-danger py-2 mt-2 mb-0 small"><i className="bi bi-exclamation-triangle-fill me-1" />{errorSubida}</div>}
                  {exitoSubida && <div className="alert alert-success py-2 mt-2 mb-0 small"><i className="bi bi-check-circle-fill me-1" />{exitoSubida}</div>}
                  {archivoSelec && !errorSubida && (
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm" onClick={handleSubir} disabled={subiendo}>
                        {subiendo ? <><span className="spinner-border spinner-border-sm me-1" />Subiendo…</> : <><i className="bi bi-cloud-upload me-1" />Subir</>}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => { setArchivoSelec(null); setErrorSubida(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} disabled={subiendo}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de documentos */}
              {!expediente.documentos || expediente.documentos.length === 0 ? (
                <div className="text-center py-4 text-muted small">
                  <i className="bi bi-paperclip d-block mb-2" style={{ fontSize: 24 }} />
                  {puedeSubir ? 'No hay documentos. Sube el primero.' : 'No hay documentos adjuntos.'}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4 small text-muted fw-semibold">Archivo</th>
                        <th className="small text-muted fw-semibold">Subido por</th>
                        <th className="small text-muted fw-semibold">Fecha</th>
                        <th className="pe-4 small text-muted fw-semibold text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expediente.documentos.map(doc => (
                        <FilaDocumento key={doc.id} doc={doc} puedeEliminar={puedeSubir}
                          onDescargar={handleDescargar} onEliminar={handleEliminar} eliminando={eliminando} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpedienteDetalle;
