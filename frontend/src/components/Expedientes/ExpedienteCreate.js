import React, { useEffect, useState } from 'react';
import axios from '../../services/axiosConfig';

const FORM_VACIO = {
  nombre:          '',
  materia:         '',
  n_documento:     '',
  emisor:          '',
  origen:          'Externo',
  reservado:       false,
  tipo_doc_id:     '',
  categoria_id:    '',
  subtipo_id:      '',
  fecha_documento: '',
  fecha_ingreso:   new Date().toISOString().slice(0, 10),
  comentario:      '',
};

const ExpedienteCreate = ({ unidad, usuario, onVolver, onCreado }) => {
  const [form,       setForm]       = useState(FORM_VACIO);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState('');
  const [guardando,  setGuardando]  = useState(false);
  const [exito,      setExito]      = useState('');

  const [tiposDoc,   setTiposDoc]   = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subtipos,   setSubtipos]   = useState([]);

  useEffect(() => {
    axios.get('/api/tipos-doc')
      .then(({ data }) => setTiposDoc(data.filter(t => t.estado_id === 1)))
      .catch(() => {});
    axios.get('/api/categorias')
      .then(({ data }) => setCategorias(data.filter(c => c.estado_id === 1)))
      .catch(() => {});
  }, []);

  // Cargar subtipos cuando cambia la categoría
  useEffect(() => {
    if (!form.categoria_id) { setSubtipos([]); return; }
    axios.get(`/api/categorias/${form.categoria_id}/subtipos`)
      .then(({ data }) => setSubtipos(data.filter(s => s.estado_id === 1)))
      .catch(() => setSubtipos([]));
  }, [form.categoria_id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Resetear subtipo si cambia la categoría
      ...(name === 'categoria_id' ? { subtipo_id: '' } : {}),
    }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setApiError('');
  };

  const validar = () => {
    const e = {};
    if (!form.nombre.trim())      e.nombre       = 'El nombre es obligatorio';
    if (!form.tipo_doc_id)        e.tipo_doc_id  = 'El tipo de documento es obligatorio';
    if (!form.categoria_id)       e.categoria_id = 'La categoría es obligatoria';
    if (!form.fecha_ingreso)      e.fecha_ingreso = 'La fecha de ingreso es obligatoria';
    if (!form.origen)             e.origen        = 'El origen es obligatorio';
    return e;
  };

  const handleGuardar = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    setGuardando(true);
    setApiError('');
    try {
      const { data } = await axios.post('/api/expedientes', {
        area_id:         unidad.area_id,
        tipo_doc_id:     Number(form.tipo_doc_id),
        categoria_id:    Number(form.categoria_id),
        subtipo_id:      form.subtipo_id     ? Number(form.subtipo_id)  : null,
        n_documento:     form.n_documento.trim()    || null,
        nombre:          form.nombre.trim(),
        materia:         form.materia.trim()        || null,
        emisor:          form.emisor.trim()         || null,
        origen:          form.origen,
        reservado:       form.reservado,
        fecha_documento: form.fecha_documento       || null,
        fecha_ingreso:   form.fecha_ingreso,
        comentario:      form.comentario.trim()     || null,
      });
      setExito(`Expediente creado con correlativo ${data.correlativo}`);
      setTimeout(() => onCreado(), 1500);
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al crear el expediente');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-4">
        <button className="btn btn-link btn-sm text-muted p-0 mb-2" onClick={onVolver}>
          <i className="bi bi-arrow-left me-1" />Volver a expedientes
        </button>
        <h5 className="fw-bold mb-0">Nuevo Expediente</h5>
        <p className="text-muted small mb-0">
          <i className="bi bi-diagram-3-fill me-1" />{unidad.area_nombre}
          <span className="mx-1">·</span>
          <i className="bi bi-building me-1" />{unidad.contratista_nombre}
        </p>
      </div>

      {exito && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-check-circle-fill" />
          {exito}
        </div>
      )}
      {apiError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-exclamation-triangle-fill" />
          {apiError}
        </div>
      )}

      <div className="card border shadow-sm" style={{ borderRadius: 10 }}>
        <div className="card-body px-4 py-4">

          {/* Fila 1: Nombre + Materia */}
          <div className="row g-3 mb-3">
            <div className="col-md-7">
              <label className="form-label small fw-semibold">
                Nombre <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                className={`form-control form-control-sm ${errors.nombre ? 'is-invalid' : ''}`}
                value={form.nombre}
                onChange={handleChange}
                placeholder="Título o descripción del expediente"
              />
              {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
            </div>
            <div className="col-md-5">
              <label className="form-label small fw-semibold">Materia</label>
              <input
                type="text"
                name="materia"
                className="form-control form-control-sm"
                value={form.materia}
                onChange={handleChange}
                placeholder="Asunto o materia"
              />
            </div>
          </div>

          {/* Fila 2: Tipo Documento + N° Documento */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Tipo de Documento <span className="text-danger">*</span>
              </label>
              <select
                name="tipo_doc_id"
                className={`form-select form-select-sm ${errors.tipo_doc_id ? 'is-invalid' : ''}`}
                value={form.tipo_doc_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar tipo…</option>
                {tiposDoc.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
              {errors.tipo_doc_id && <div className="invalid-feedback">{errors.tipo_doc_id}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">N° de Documento</label>
              <input
                type="text"
                name="n_documento"
                className="form-control form-control-sm"
                value={form.n_documento}
                onChange={handleChange}
                placeholder="Número o folio del documento"
              />
            </div>
          </div>

          {/* Fila 3: Categoría + Subtipo */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Categoría <span className="text-danger">*</span>
              </label>
              <select
                name="categoria_id"
                className={`form-select form-select-sm ${errors.categoria_id ? 'is-invalid' : ''}`}
                value={form.categoria_id}
                onChange={handleChange}
              >
                <option value="">Seleccionar categoría…</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.categoria_id && <div className="invalid-feedback">{errors.categoria_id}</div>}
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Subtipo</label>
              <select
                name="subtipo_id"
                className="form-select form-select-sm"
                value={form.subtipo_id}
                onChange={handleChange}
                disabled={subtipos.length === 0}
              >
                <option value="">
                  {subtipos.length === 0 ? '— Sin subtipos disponibles —' : 'Seleccionar subtipo…'}
                </option>
                {subtipos.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 4: Emisor + Origen */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Emisor</label>
              <input
                type="text"
                name="emisor"
                className="form-control form-control-sm"
                value={form.emisor}
                onChange={handleChange}
                placeholder="Entidad o persona que emite"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Origen <span className="text-danger">*</span>
              </label>
              <select
                name="origen"
                className={`form-select form-select-sm ${errors.origen ? 'is-invalid' : ''}`}
                value={form.origen}
                onChange={handleChange}
              >
                <option value="Externo">Externo</option>
                <option value="Interno">Interno</option>
              </select>
              {errors.origen && <div className="invalid-feedback">{errors.origen}</div>}
            </div>
          </div>

          {/* Fila 5: Fecha Documento + Fecha Ingreso */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Fecha del Documento</label>
              <input
                type="date"
                name="fecha_documento"
                className="form-control form-control-sm"
                value={form.fecha_documento}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">
                Fecha de Ingreso <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="fecha_ingreso"
                className={`form-control form-control-sm ${errors.fecha_ingreso ? 'is-invalid' : ''}`}
                value={form.fecha_ingreso}
                onChange={handleChange}
              />
              {errors.fecha_ingreso && <div className="invalid-feedback">{errors.fecha_ingreso}</div>}
            </div>
          </div>

          {/* Fila 6: Reservado */}
          <div className="mb-3">
            <div className="form-check">
              <input
                type="checkbox"
                name="reservado"
                id="reservado"
                className="form-check-input"
                checked={form.reservado}
                onChange={handleChange}
              />
              <label className="form-check-label small fw-semibold" htmlFor="reservado">
                Reservado
                <span className="text-muted fw-normal ms-1">
                  (solo visible para usuarios con acceso reservado)
                </span>
              </label>
            </div>
          </div>

          {/* Comentario */}
          <div className="mb-4">
            <label className="form-label small fw-semibold">Comentario inicial</label>
            <textarea
              name="comentario"
              className="form-control form-control-sm"
              rows={3}
              value={form.comentario}
              onChange={handleChange}
              placeholder="Observaciones opcionales al crear el expediente"
            />
          </div>

          {/* Acciones */}
          <div className="d-flex gap-2 justify-content-end">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={onVolver}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleGuardar}
              disabled={guardando}
            >
              {guardando
                ? <><span className="spinner-border spinner-border-sm me-1" />Guardando…</>
                : <><i className="bi bi-check-lg me-1" />Crear Expediente</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExpedienteCreate;