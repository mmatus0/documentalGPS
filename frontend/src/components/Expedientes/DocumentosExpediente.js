import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from '../../services/axiosConfig';

const ICONOS_TIPO = {
  '.pdf':  { icon: 'bi-file-earmark-pdf-fill',   color: '#ef4444' },
  '.docx': { icon: 'bi-file-earmark-word-fill',   color: '#2563eb' },
  '.xlsx': { icon: 'bi-file-earmark-excel-fill',  color: '#16a34a' },
  '.pbix': { icon: 'bi-file-earmark-bar-graph-fill', color: '#f59e0b' },
};

const EXTENSIONES_PERMITIDAS = ['.pdf', '.docx', '.xlsx', '.pbix'];
const TAMANO_MAXIMO_MB = 50;

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
  const [archivoSelec,  setArchivoSelec]  = useState(null);
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

  const handleSeleccionarArchivo = (file) => {
    setErrorSubida(null);
    setExitoSubida(null);
    const err = validarArchivo(file);
    if (err) { setErrorSubida(err); return; }
    setArchivoSelec(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleSeleccionarArchivo(file);
  };

  const handleSubir = async () => {
    if (!archivoSelec) return;
    setSubiendo(true);
    setErrorSubida(null);
    setExitoSubida(null);

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
                cursor: 'pointer',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="d-flex justify-content-center gap-3 mb-2">
                {EXTENSIONES_PERMITIDAS.map(ext => (
                  <IconoArchivo key={ext} tipo={ext} size={28} />
                ))}
              </div>
              <p className="mb-1 small fw-medium">
                {archivoSelec
                  ? <><i className="bi bi-check-circle-fill text-success me-1" />{archivoSelec.name}</>
                  : 'Arrastra un archivo aquí o haz clic para seleccionar'}
              </p>
              <p className="text-muted mb-0" style={{ fontSize: 11 }}>
                PDF, DOCX, XLSX, PBIX · Máximo {TAMANO_MAXIMO_MB}MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept=".pdf,.docx,.xlsx,.pbix"
                onChange={e => e.target.files[0] && handleSeleccionarArchivo(e.target.files[0])}
              />
            </div>

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

            {archivoSelec && !errorSubida && (
              <div className="d-flex gap-2 mt-3">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSubir}
                  disabled={subiendo}
                >
                  {subiendo
                    ? <><span className="spinner-border spinner-border-sm me-1" />Subiendo…</>
                    : <><i className="bi bi-cloud-upload me-1" />Subir archivo</>}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => { setArchivoSelec(null); setErrorSubida(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
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
          {!expediente.documentos || expediente.documentos.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-paperclip text-muted" style={{ fontSize: 36, display: 'block', marginBottom: 12 }} />
              <p className="text-muted small mb-0">
                {puedeSubir
                  ? 'No hay documentos adjuntos. Sube el primero.'
                  : 'No hay documentos adjuntos en este expediente.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
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
                  {expediente.documentos.map(doc => (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentosExpediente;
