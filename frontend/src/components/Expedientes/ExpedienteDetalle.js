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
  '.txt':  { icon: 'bi-file-earmark-text-fill',      color: '#6b7280' },
  '.csv':  { icon: 'bi-file-earmark-spreadsheet-fill', color: '#059669' },
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
      <div style={{
        position: 'absolute', left: 11, top: 8, bottom: 8,
        width: 2, background: 'var(--border)',
      }} />
      {historial.map((h, i) => {
        const cfgNuevo = ESTADO_CONFIG[h.estado_nuevo] || { color: '#64748b', bg: '#f1f5f9', icon: 'bi-circle' };
        return (
          <div key={h.id} style={{ position: 'relative', marginBottom: i < historial.length - 1 ? 24 : 0 }}>
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

// ─── Modal de Derivación (HU-20) ───────────────────────────────────────────────
const ModalDerivar = ({ visible, areas, derivando, errorDerivar, onConfirmar, onCerrar }) => {
  const [areaDestinoId, setAreaDestinoId] = useState('');
  const [comentario,    setComentario]    = useState('');

  useEffect(() => {
    if (!visible) { setAreaDestinoId(''); setComentario(''); }
  }, [visible]);

  if (!visible) return null;

  const handleConfirmar = () => onConfirmar(areaDestinoId, comentario);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 12 }}>
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <div>
              <h5 className="modal-title fw-bold mb-0">
                <i className="bi bi-arrow-right-circle-fill me-2 text-primary" />
                Derivar Expediente
              </h5>
              <p className="text-muted small mb-0 mt-1">
                El expediente cambiará a estado <strong>Derivado</strong> y se generará una tarea para el área seleccionada.
              </p>
            </div>
            <button className="btn-close ms-auto" onClick={onCerrar} disabled={derivando} />
          </div>
          <div className="modal-body px-4 pt-3 pb-2">
            {errorDerivar && (
              <div className="alert alert-danger py-2 small mb-3">
                <i className="bi bi-exclamation-triangle-fill me-1" />{errorDerivar}
              </div>
            )}
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Unidad Organizativa destino <span className="text-danger">*</span>
              </label>
              <select className="form-select form-select-sm" value={areaDestinoId}
                onChange={e => setAreaDestinoId(e.target.value)} disabled={derivando}>
                <option value="">Seleccionar área…</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre} — {a.contratista_nombre}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Comentario <span className="text-danger">*</span>
              </label>
              <textarea className="form-control form-control-sm" rows={3}
                placeholder="Motivo o instrucciones para el área destino…"
                value={comentario} onChange={e => setComentario(e.target.value)}
                disabled={derivando} style={{ resize: 'none' }} />
            </div>
          </div>
          <div className="modal-footer border-0 px-4 pb-4 pt-2 gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={onCerrar} disabled={derivando}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleConfirmar}
              disabled={derivando || !areaDestinoId || !comentario.trim()}>
              {derivando
                ? <><span className="spinner-border spinner-border-sm me-1" />Derivando…</>
                : <><i className="bi bi-arrow-right-circle me-1" />Confirmar derivación</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────────────────────
const ExpedienteDetalle = ({ expedienteId, usuario, onVolver }) => {
  const [expediente,    setExpediente]    = useState(null);
  const [historial,     setHistorial]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [tabActiva,     setTabActiva]     = useState('detalle');
  const [subiendo,      setSubiendo]      = useState(false);
  const [errorSubida,   setErrorSubida]   = useState(null);
  const [exitoSubida,   setExitoSubida]   = useState(null);
  const [archivosSelec,     setArchivosSelec]     = useState([]);   // File[] válidos, listos para subir
  const [archivosInvalidos, setArchivosInvalidos] = useState([]);   // [{ name, motivo }]
  const [progresoLote,      setProgresoLote]      = useState(null); // { loteActual, totalLotes, subidos, total }
  const [resultadoLote,     setResultadoLote]     = useState(null); // { exitosos, fallidos, errores }
  const [dragOver,      setDragOver]      = useState(false);
  const [eliminando,    setEliminando]    = useState(null);

  // Búsqueda y paginación de la lista de documentos
  const [busquedaDoc, setBusquedaDoc] = useState('');
  const [paginaDoc,   setPaginaDoc]   = useState(1);
  const [porPaginaDoc, setPorPaginaDoc] = useState(10);

  // HU-20: Derivación
  const [modalDerivar,  setModalDerivar]  = useState(false);
  const [areas,         setAreas]         = useState([]);
  const [derivando,     setDerivando]     = useState(false);
  const [errorDerivar,  setErrorDerivar]  = useState(null);
  const [exitoDerivar,  setExitoDerivar]  = useState(null);

  // HU-21: PDF export
  const [exportandoPDF, setExportandoPDF] = useState(false);

  const fileInputRef = useRef();

  const esColaborador = usuario.rol_id === 2;
  const esAdmin       = usuario.rol_id === 1;
  const puedeSubir    = esColaborador || esAdmin;

  const EXTENSIONES = ['.pdf', '.docx', '.xlsx', '.pbix', '.txt', '.csv'];
  const TAMANO_MAX_MB = 50;
  const TAMANO_LOTE = 150; // archivos por request; el backend acepta hasta 200 por request

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

  // Al cambiar el término de búsqueda o el tamaño de página, volvemos a la página 1
  useEffect(() => { setPaginaDoc(1); }, [busquedaDoc, porPaginaDoc]);

  // Cargar áreas cuando se abre el modal de derivar
  const abrirModalDerivar = async () => {
    setErrorDerivar(null);
    try {
      const res = await axios.get('/api/areas');
      setAreas(res.data || []);
    } catch {
      setAreas([]);
    }
    setModalDerivar(true);
  };

  // HU-20: Confirmar derivación
  const handleDerivar = async (areaDestinoId, comentario) => {
    if (!areaDestinoId || !comentario.trim()) {
      setErrorDerivar('Todos los campos son obligatorios.');
      return;
    }
    setDerivando(true);
    setErrorDerivar(null);
    try {
      await axios.post(`/api/expedientes/${expedienteId}/derivar`, {
        area_destino_id: areaDestinoId,
        comentario: comentario.trim(),
      });
      setModalDerivar(false);
      onVolver();
    } catch (err) {
      setErrorDerivar(err.response?.data?.error || 'Error al derivar el expediente.');
    } finally {
      setDerivando(false);
    }
  };

  // HU-21: Exportar PDF
  const handleExportarPDF = async () => {
    setExportandoPDF(true);
    try {
      const res = await axios.get(`/api/expedientes/${expedienteId}/exportar-pdf`, {
        responseType: 'blob',
      });
      const contentType = res.headers['content-type'] || '';
      const blob = new Blob([res.data], { type: contentType });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;

      // Si es HTML (fallback), abrir en ventana nueva para imprimir a PDF
      if (contentType.includes('text/html')) {
        window.open(url, '_blank');
      } else {
        link.setAttribute('download', `${expediente.correlativo}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo generar el PDF. Intenta nuevamente.');
    } finally {
      setExportandoPDF(false);
    }
  };

  const validarArchivo = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES.includes(ext)) return `Extensión no permitida. Solo: ${EXTENSIONES.join(', ')}`;
    if (file.size > TAMANO_MAX_MB * 1024 * 1024) return `El archivo supera ${TAMANO_MAX_MB}MB`;
    return null;
  };

  // Valida cada archivo seleccionado; separa los válidos de los que no cumplen extensión/tamaño.
  const handleSeleccionarArchivos = (fileList) => {
    setErrorSubida(null); setExitoSubida(null); setResultadoLote(null);
    const validos = [];
    const invalidos = [];
    Array.from(fileList).forEach(file => {
      const err = validarArchivo(file);
      if (err) invalidos.push({ name: file.name, motivo: err });
      else validos.push(file);
    });
    setArchivosSelec(validos);
    setArchivosInvalidos(invalidos);
  };

  // Sube los archivos seleccionados en lotes de TAMANO_LOTE, secuencialmente, mostrando
  // progreso. Si un lote completo falla (ej. corte de red), no aborta los siguientes lotes:
  // se registra como fallido y se continúa, para no perder lo que ya se subió.
  const handleSubir = async () => {
    if (archivosSelec.length === 0) return;
    setSubiendo(true); setErrorSubida(null); setExitoSubida(null); setResultadoLote(null);

    const lotes = [];
    for (let i = 0; i < archivosSelec.length; i += TAMANO_LOTE) {
      lotes.push(archivosSelec.slice(i, i + TAMANO_LOTE));
    }

    let exitosos = 0;
    let fallidos  = 0;
    const errores = [];

    for (let i = 0; i < lotes.length; i++) {
      setProgresoLote({ loteActual: i + 1, totalLotes: lotes.length, subidos: exitosos + fallidos, total: archivosSelec.length });
      const formData = new FormData();
      lotes[i].forEach(file => formData.append('archivos', file));
      try {
        const { data } = await axios.post(`/api/expedientes/${expedienteId}/documentos/lote`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        exitosos += data.exitosos || 0;
        fallidos  += data.fallidos  || 0;
        if (data.errores?.length) errores.push(...data.errores);
      } catch (err) {
        fallidos += lotes[i].length;
        lotes[i].forEach(f => errores.push({
          nombre_archivo: f.name,
          error: err.response?.data?.error || 'Error de red al subir el lote',
        }));
      }
    }

    setProgresoLote({ loteActual: lotes.length, totalLotes: lotes.length, subidos: exitosos + fallidos, total: archivosSelec.length });
    setResultadoLote({ exitosos, fallidos, errores });
    setArchivosSelec([]);
    setArchivosInvalidos([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSubiendo(false);
    await fetchExpediente();
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
  const esBorrador = expediente.estado === 'Borrador';
  const puedeExportar = esColaborador || esAdmin;

  return (
    <div>
      {/* Modal de derivación HU-20 */}
      <ModalDerivar
        visible={modalDerivar}
        areas={areas}
        derivando={derivando}
        errorDerivar={errorDerivar}
        onConfirmar={handleDerivar}
        onCerrar={() => { setModalDerivar(false); setErrorDerivar(null); }}
      />

      {/* Botón volver */}
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={onVolver}>
        <i className="bi bi-arrow-left me-1" />Volver a expedientes
      </button>

      {/* Alertas de acciones */}
      {exitoDerivar && (
        <div className="alert alert-success alert-dismissible py-2 small mb-3">
          <i className="bi bi-check-circle-fill me-1" />{exitoDerivar}
          <button type="button" className="btn-close btn-sm" onClick={() => setExitoDerivar(null)} />
        </div>
      )}

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
              <div className="d-flex flex-column align-items-md-end gap-2">
                <EstadoBadge estado={expediente.estado} large />
                {/* Acciones principales */}
                <div className="d-flex gap-2 flex-wrap justify-content-md-end mt-1">
                  {/* HU-20: Botón Derivar — solo Colaborador y solo en Borrador */}
                  {esColaborador && esBorrador && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={abrirModalDerivar}
                      style={{ fontSize: 12 }}>
                      <i className="bi bi-arrow-right-circle me-1" />
                      Derivar
                    </button>
                  )}
                  {/* HU-21: Botón exportar PDF — Colaborador y Admin */}
                  {puedeExportar && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleExportarPDF}
                      disabled={exportandoPDF}
                      title="Exportar expediente a PDF"
                      style={{ fontSize: 12 }}>
                      {exportandoPDF
                        ? <><span className="spinner-border spinner-border-sm me-1" />Generando…</>
                        : <><i className="bi bi-file-earmark-pdf me-1" />Exportar PDF</>}
                    </button>
                  )}
                </div>
              </div>
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
              <CampoDetalle label="Correlativo"    valor={expediente.correlativo} />
              <CampoDetalle label="Tipo Documento" valor={expediente.tipo_documento} />
              <CampoDetalle label="Categoría"      valor={expediente.categoria} />
              <CampoDetalle label="Origen"         valor={expediente.origen} />
              <CampoDetalle label="Emisor"         valor={expediente.emisor} col={6} />
              <CampoDetalle label="Materia"        valor={expediente.materia} col={6} />
              <CampoDetalle label="Fecha Documento" valor={expediente.fecha_documento ? new Date(expediente.fecha_documento).toLocaleDateString('es-CL') : null} />
              <CampoDetalle label="Fecha Ingreso"  valor={expediente.fecha_ingreso ? new Date(expediente.fecha_ingreso).toLocaleDateString('es-CL') : null} />
              <CampoDetalle label="Creado por"     valor={expediente.creado_por_nombre} />
              <CampoDetalle label="Reservado"      valor={expediente.reservado ? 'Sí' : 'No'} />
            </div>
          )}

          {/* Tab Historial (HU-19) */}
          {tabActiva === 'historial' && <LineaTiempo historial={historial} />}

          {/* Tab Documentos */}
          {tabActiva === 'documentos' && (
            <div>
              {puedeSubir && (
                <div className="mb-4">
                  <div
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--primary)' : '#cbd5e1'}`,
                      borderRadius: 10, padding: '20px', textAlign: 'center',
                      background: dragOver ? 'var(--primary-light)' : '#f8fafc',
                      transition: 'all 0.2s', cursor: subiendo ? 'default' : 'pointer',
                    }}
                    onDragOver={e => { e.preventDefault(); if (!subiendo) setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault(); setDragOver(false);
                      if (subiendo) return;
                      if (e.dataTransfer.files?.length) handleSeleccionarArchivos(e.dataTransfer.files);
                    }}
                    onClick={() => !subiendo && fileInputRef.current?.click()}
                  >
                    <div className="d-flex justify-content-center gap-3 mb-2">
                      {EXTENSIONES.map(ext => {
                        const c = ICONOS_TIPO[ext] || {};
                        return <i key={ext} className={`bi ${c.icon}`} style={{ fontSize: 24, color: c.color }} />;
                      })}
                    </div>
                    <p className="mb-1 small fw-medium">
                      {archivosSelec.length > 0
                        ? <><i className="bi bi-check-circle-fill text-success me-1" />{archivosSelec.length} archivo{archivosSelec.length !== 1 ? 's' : ''} listo{archivosSelec.length !== 1 ? 's' : ''} para subir</>
                        : 'Arrastra archivos o haz clic para seleccionar'}
                    </p>
                    <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                      PDF, DOCX, XLSX, PBIX, TXT, CSV · Máximo {TAMANO_MAX_MB}MB por archivo · Hasta 10.000 archivos (carga masiva por lotes)
                    </p>
                    <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }}
                      accept=".pdf,.docx,.xlsx,.pbix,.txt,.csv"
                      onChange={e => e.target.files?.length && handleSeleccionarArchivos(e.target.files)} />
                  </div>

                  {archivosInvalidos.length > 0 && (
                    <div className="alert alert-warning py-2 mt-2 mb-0 small">
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      {archivosInvalidos.length} archivo{archivosInvalidos.length !== 1 ? 's' : ''} no se subirá{archivosInvalidos.length !== 1 ? 'n' : ''} (extensión o tamaño no permitido):
                      <div className="mt-1" style={{ fontSize: 11 }}>
                        {archivosInvalidos.slice(0, 5).map((f, i) => (
                          <div key={i}>• {f.name} — {f.motivo}</div>
                        ))}
                        {archivosInvalidos.length > 5 && <div>… y {archivosInvalidos.length - 5} más</div>}
                      </div>
                    </div>
                  )}

                  {errorSubida && <div className="alert alert-danger py-2 mt-2 mb-0 small"><i className="bi bi-exclamation-triangle-fill me-1" />{errorSubida}</div>}
                  {exitoSubida && <div className="alert alert-success py-2 mt-2 mb-0 small"><i className="bi bi-check-circle-fill me-1" />{exitoSubida}</div>}

                  {subiendo && progresoLote && (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Lote {progresoLote.loteActual} de {progresoLote.totalLotes}</span>
                        <span>{progresoLote.subidos}/{progresoLote.total} archivos</span>
                      </div>
                      <div className="progress" style={{ height: 8 }}>
                        <div className="progress-bar progress-bar-striped progress-bar-animated"
                          style={{ width: `${Math.round((progresoLote.subidos / progresoLote.total) * 100)}%` }} />
                      </div>
                    </div>
                  )}

                  {resultadoLote && (
                    <div className={`alert py-2 mt-3 mb-0 small ${resultadoLote.fallidos > 0 ? 'alert-warning' : 'alert-success'}`}>
                      <i className={`bi ${resultadoLote.fallidos > 0 ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} me-1`} />
                      {resultadoLote.exitosos} de {resultadoLote.exitosos + resultadoLote.fallidos} archivos subidos correctamente.
                      {resultadoLote.fallidos > 0 && (
                        <div className="mt-1" style={{ fontSize: 11 }}>
                          {resultadoLote.errores.slice(0, 5).map((e, i) => (
                            <div key={i}>• {e.nombre_archivo} — {e.error}</div>
                          ))}
                          {resultadoLote.errores.length > 5 && <div>… y {resultadoLote.errores.length - 5} más</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {archivosSelec.length > 0 && (
                    <div className="d-flex gap-2 mt-2">
                      <button className="btn btn-primary btn-sm" onClick={handleSubir} disabled={subiendo}>
                        {subiendo
                          ? <><span className="spinner-border spinner-border-sm me-1" />Subiendo…</>
                          : <><i className="bi bi-cloud-upload me-1" />Subir {archivosSelec.length} archivo{archivosSelec.length !== 1 ? 's' : ''}</>}
                      </button>
                      <button className="btn btn-outline-secondary btn-sm"
                        onClick={() => { setArchivosSelec([]); setArchivosInvalidos([]); setErrorSubida(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        disabled={subiendo}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const documentos = expediente.documentos || [];
                const documentosFiltrados = busquedaDoc.trim()
                  ? documentos.filter(d => d.nombre_archivo.toLowerCase().includes(busquedaDoc.trim().toLowerCase()))
                  : documentos;
                const totalPaginas = Math.max(1, Math.ceil(documentosFiltrados.length / porPaginaDoc));
                const paginaSegura = Math.min(paginaDoc, totalPaginas);
                const inicio = (paginaSegura - 1) * porPaginaDoc;
                const documentosPagina = documentosFiltrados.slice(inicio, inicio + porPaginaDoc);

                if (documentos.length === 0) {
                  return (
                    <div className="text-center py-4 text-muted small">
                      <i className="bi bi-paperclip d-block mb-2" style={{ fontSize: 24 }} />
                      {puedeSubir ? 'No hay documentos. Sube el primero.' : 'No hay documentos adjuntos.'}
                    </div>
                  );
                }

                return (
                  <>
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                      <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
                        <span className="input-group-text bg-white border-end-0">
                          <i className="bi bi-search text-muted" />
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Buscar por nombre de archivo…"
                          value={busquedaDoc}
                          onChange={e => setBusquedaDoc(e.target.value)}
                        />
                        {busquedaDoc && (
                          <button className="btn btn-outline-secondary" type="button" onClick={() => setBusquedaDoc('')}>
                            <i className="bi bi-x-lg" />
                          </button>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small">Mostrar</span>
                        <select className="form-select form-select-sm" style={{ width: 80 }}
                          value={porPaginaDoc} onChange={e => setPorPaginaDoc(Number(e.target.value))}>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                        </select>
                      </div>
                    </div>

                    {documentosFiltrados.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-search d-block mb-2" style={{ fontSize: 24 }} />
                        No se encontraron archivos que coincidan con "{busquedaDoc}".
                      </div>
                    ) : (
                      <>
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
                              {documentosPagina.map(doc => (
                                <FilaDocumento key={doc.id} doc={doc} puedeEliminar={puedeSubir}
                                  onDescargar={handleDescargar} onEliminar={handleEliminar} eliminando={eliminando} />
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 px-1">
                          <span className="text-muted small">
                            Mostrando {inicio + 1}–{Math.min(inicio + porPaginaDoc, documentosFiltrados.length)} de {documentosFiltrados.length}
                          </span>
                          <div className="d-flex align-items-center gap-2">
                            <button className="btn btn-sm btn-outline-secondary" disabled={paginaSegura <= 1}
                              onClick={() => setPaginaDoc(p => Math.max(1, p - 1))}>
                              <i className="bi bi-chevron-left" />
                            </button>
                            <span className="small text-muted">Página {paginaSegura} de {totalPaginas}</span>
                            <button className="btn btn-sm btn-outline-secondary" disabled={paginaSegura >= totalPaginas}
                              onClick={() => setPaginaDoc(p => Math.min(totalPaginas, p + 1))}>
                              <i className="bi bi-chevron-right" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpedienteDetalle;