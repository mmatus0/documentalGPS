import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from '../../services/axiosConfig';

const ICONOS_TIPO = {
  '.pdf':  { icon: 'bi-file-earmark-pdf-fill',   color: '#ef4444' },
  '.docx': { icon: 'bi-file-earmark-word-fill',   color: '#2563eb' },
  '.xlsx': { icon: 'bi-file-earmark-excel-fill',  color: '#16a34a' },
  '.pbix': { icon: 'bi-file-earmark-bar-graph-fill', color: '#f59e0b' },
  '.txt':  { icon: 'bi-file-earmark-text-fill',   color: '#6b7280' },
  '.csv':  { icon: 'bi-file-earmark-spreadsheet-fill', color: '#059669' },
};

const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.xlsx', '.pbix', '.txt', '.csv'];
const TAMANO_MAXIMO_MB = 50;
const TAMANO_LOTE = 150; // archivos por request; el backend acepta hasta 200 por request

const IconoArchivo = ({ tipo, size = 24 }) => {
  const cfg = ICONOS_TIPO[tipo] || { icon: 'bi-file-earmark-fill', color: '#94a3b8' };
  return <i className={`bi ${cfg.icon}`} style={{ fontSize: size, color: cfg.color }} />;
};

const FilaDocumento = ({ doc, puedeEliminar, onDescargar, onEliminar }) => (
  <tr>
    <td className="ps-4 py-3">
      <div className="d-flex align-items-center gap-2">
        <IconoArchivo tipo={doc.tipo_archivo} size={20} />
        <div>
          <div className="small fw-medium">{doc.nombre_archivo}</div>
          <div className="text-muted" style={{ fontSize: 10 }}>{doc.tipo_archivo?.toUpperCase()}</div>
        </div>
      </div>
    </td>
    <td className="py-3 small text-muted">{doc.subido_por}</td>
    <td className="py-3 small text-muted">
      {doc.fecha_carga
        ? new Date(doc.fecha_carga).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
        : '—'}
    </td>
    <td className="pe-4 py-3">
      <div className="d-flex gap-2 justify-content-end">
        <button
          className="btn btn-sm btn-outline-primary"
          style={{ fontSize: 11 }}
          onClick={() => onDescargar(doc)}
          title="Descargar"
        >
          <i className="bi bi-download" />
        </button>
        {puedeEliminar && (
          <button
            className="btn btn-sm btn-outline-danger"
            style={{ fontSize: 11 }}
            onClick={() => onEliminar(doc)}
            title="Eliminar"
          >
            <i className="bi bi-trash" />
          </button>
        )}
      </div>
    </td>
  </tr>
);

const DocumentosExpediente = ({ expedienteId, usuario, onVolver }) => {
  const [expediente,    setExpediente]    = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [subiendo,      setSubiendo]      = useState(false);
  const [errorSubida,   setErrorSubida]   = useState(null);
  const [exitoSubida,   setExitoSubida]   = useState(null);
  const [eliminando,    setEliminando]    = useState(null);

  // Búsqueda y paginación de la lista de documentos
  const [busquedaDoc, setBusquedaDoc] = useState('');
  const [paginaDoc,   setPaginaDoc]   = useState(1);
  const [porPaginaDoc, setPorPaginaDoc] = useState(10);
  const [archivosSelec,     setArchivosSelec]     = useState([]);   // File[] válidos, listos para subir
  const [archivosInvalidos, setArchivosInvalidos] = useState([]);   // [{ name, motivo }]
  const [progresoLote,      setProgresoLote]      = useState(null); // { loteActual, totalLotes, subidos, total }
  const [resultadoLote,     setResultadoLote]     = useState(null); // { exitosos, fallidos, errores }
  const [dragOver,      setDragOver]      = useState(false);
  const fileInputRef = useRef();

  const esColaborador = usuario.rol_id === 2;
  const esAdmin       = usuario.rol_id === 1;
  const puedeSubir    = esColaborador || esAdmin;

  const fetchExpediente = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/expedientes/${expedienteId}`);
      setExpediente(data);
    } catch (err) {
      setError('No se pudo cargar el expediente.');
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => { fetchExpediente(); }, [fetchExpediente]);

  // Al cambiar el término de búsqueda o el tamaño de página, volvemos a la página 1
  useEffect(() => { setPaginaDoc(1); }, [busquedaDoc, porPaginaDoc]);

  const validarArchivo = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(ext)) {
      return `Extensión no permitida. Solo: ${EXTENSIONES_PERMITIDAS.join(', ')}`;
    }
    if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      return `El archivo supera el límite de ${TAMANO_MAXIMO_MB}MB`;
    }
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

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (subiendo) return;
    if (e.dataTransfer.files?.length) handleSeleccionarArchivos(e.dataTransfer.files);
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
      const response = await axios.get(
        `/api/expedientes/${expedienteId}/documentos/${doc.id}/descargar`,
        { responseType: 'blob' }
      );
      const url  = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', doc.nombre_archivo);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el archivo');
    }
  };

  const handleEliminar = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.nombre_archivo}"?`)) return;
    setEliminando(doc.id);
    try {
      await axios.delete(`/api/expedientes/${expedienteId}/documentos/${doc.id}`);
      await fetchExpediente();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setEliminando(null);
    }
  };

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <div className="spinner-border spinner-border-sm me-2" role="status" />
      Cargando expediente…
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

  return (
    <div>
      {/* Botón volver */}
      <button className="btn btn-sm btn-outline-secondary mb-4" onClick={onVolver}>
        <i className="bi bi-arrow-left me-1" />
        Volver a expedientes
      </button>

      {/* Encabezado del expediente */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
        <div className="card-body px-4 py-4">
          <div className="row g-3">
            <div className="col-md-8">
              <div className="d-flex align-items-start gap-3">
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                  background: '#fef3c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className="bi bi-file-earmark-text-fill" style={{ fontSize: 26, color: '#d97706' }} />
                </div>
                <div>
                  <div className="text-muted small mb-1">{expediente.correlativo}</div>
                  <h4 className="fw-bold mb-1">{expediente.nombre}</h4>
                  <div className="d-flex flex-wrap gap-2 align-items-center text-muted small">
                    <span><i className="bi bi-building me-1" />{expediente.contratista_nombre}</span>
                    <span>·</span>
                    <span><i className="bi bi-diagram-3-fill me-1" />{expediente.area_nombre}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex flex-column gap-1" style={{ fontSize: 12 }}>
                <div><span className="text-muted">Tipo: </span><strong>{expediente.tipo_documento}</strong></div>
                <div><span className="text-muted">Categoría: </span><strong>{expediente.categoria}</strong></div>
                <div><span className="text-muted">Origen: </span><strong>{expediente.origen}</strong></div>
                <div><span className="text-muted">Ingreso: </span>
                  <strong>
                    {expediente.fecha_ingreso
                      ? new Date(expediente.fecha_ingreso).toLocaleDateString('es-CL')
                      : '—'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Zona de subida (solo Colaborador y Admin) */}
      {puedeSubir && (
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 12 }}>
          <div className="card-body px-4 py-3">
            <h6 className="fw-bold mb-3">
              <i className="bi bi-cloud-upload me-2 text-primary" />
              Subir documento
            </h6>

            {/* Drop zone */}
            <div
              style={{
                border: `2px dashed ${dragOver ? 'var(--primary)' : '#cbd5e1'}`,
                borderRadius: 10,
                padding: '24px',
                textAlign: 'center',
                background: dragOver ? 'var(--primary-light)' : '#f8fafc',
                transition: 'all 0.2s',
                cursor: subiendo ? 'default' : 'pointer',
              }}
              onDragOver={e => { e.preventDefault(); if (!subiendo) setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !subiendo && fileInputRef.current?.click()}
            >
              <div className="d-flex justify-content-center gap-3 mb-2">
                {EXTENSIONES_PERMITIDAS.map(ext => (
                  <IconoArchivo key={ext} tipo={ext} size={28} />
                ))}
              </div>
              <p className="mb-1 small fw-medium">
                {archivosSelec.length > 0
                  ? <><i className="bi bi-check-circle-fill text-success me-1" />{archivosSelec.length} archivo{archivosSelec.length !== 1 ? 's' : ''} listo{archivosSelec.length !== 1 ? 's' : ''} para subir</>
                  : 'Arrastra archivos aquí o haz clic para seleccionar'}
              </p>
              <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                PDF, DOCX, XLSX, PBIX, TXT, CSV · Máximo {TAMANO_MAXIMO_MB}MB por archivo · Hasta 10.000 archivos (carga masiva por lotes)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                accept=".pdf,.docx,.xlsx,.pbix,.txt,.csv"
                onChange={e => e.target.files?.length && handleSeleccionarArchivos(e.target.files)}
              />
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

            {errorSubida && (
              <div className="alert alert-danger py-2 mt-2 mb-0 small">
                <i className="bi bi-exclamation-triangle-fill me-1" />{errorSubida}
              </div>
            )}
            {exitoSubida && (
              <div className="alert alert-success py-2 mt-2 mb-0 small">
                <i className="bi bi-check-circle-fill me-1" />{exitoSubida}
              </div>
            )}

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
              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubir}
                  disabled={subiendo}
                >
                  {subiendo
                    ? <><span className="spinner-border spinner-border-sm me-1" />Subiendo…</>
                    : <><i className="bi bi-cloud-upload me-1" />Subir {archivosSelec.length} archivo{archivosSelec.length !== 1 ? 's' : ''}</>}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setArchivosSelec([]); setArchivosInvalidos([]); setErrorSubida(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  disabled={subiendo}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      <div className="card border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <h6 className="fw-bold mb-0">
            <i className="bi bi-paperclip me-2" />
            Documentos adjuntos
            <span className="badge bg-secondary-subtle text-secondary ms-2" style={{ fontSize: 11 }}>
              {expediente.documentos?.length || 0}
            </span>
          </h6>
        </div>
        <div className="card-body p-0">
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
                <div className="text-center py-5">
                  <i className="bi bi-paperclip text-muted" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                  <p className="text-muted small mb-0">
                    {puedeSubir
                      ? 'No hay documentos adjuntos. Sube el primero.'
                      : 'No hay documentos adjuntos en este expediente.'}
                  </p>
                </div>
              );
            }

            return (
              <>
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 pt-3">
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
                  <div className="text-center py-5">
                    <i className="bi bi-search text-muted" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
                    <p className="text-muted small mb-0">No se encontraron archivos que coincidan con "{busquedaDoc}".</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive mt-3">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="ps-4 small text-muted fw-semibold">Archivo</th>
                            <th className="small text-muted fw-semibold">Subido por</th>
                            <th className="small text-muted fw-semibold">Fecha de carga</th>
                            <th className="pe-4 small text-muted fw-semibold text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentosPagina.map(doc => (
                            <FilaDocumento
                              key={doc.id}
                              doc={doc}
                              puedeEliminar={puedeSubir && eliminando !== doc.id}
                              onDescargar={handleDescargar}
                              onEliminar={handleEliminar}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-4 py-3">
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
      </div>
    </div>
  );
};

export default DocumentosExpediente;