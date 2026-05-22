import React, { useState, useEffect } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const ProyectoEdit = ({ proyecto, onVolver }) => {
    const [formData, setFormData] = useState({
        nombre:         proyecto.nombre,
        descripcion:    proyecto.descripcion    || '',
        fecha_inicio:   proyecto.fecha_inicio
                            ? proyecto.fecha_inicio.substring(0, 10)
                            : '',
        contratista_id: String(proyecto.contratista_id),
    });
    const [contratistas, setContratistas] = useState([]);
    const [errors,       setErrors]       = useState({});
    const [apiError,     setApiError]     = useState('');
    const [guardando,    setGuardando]    = useState(false);
    const [exito,        setExito]        = useState('');
    const [modal,        setModal]        = useState({ visible: false });

    useEffect(() => {
        axios.get('/api/contratistas')
            .then(({ data }) => setContratistas(data.filter(c => c.estado_id === 1)))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setApiError('');
    };

    const validar = () => {
        const e = {};
        if (!formData.nombre.trim())  e.nombre         = 'El nombre del proyecto es obligatorio';
        if (!formData.contratista_id) e.contratista_id = 'El contratista es obligatorio';
        return e;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errores = validar();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }
        setModal({ visible: true });
    };

    const confirmarGuardado = async () => {
        setModal({ visible: false });
        try {
            setGuardando(true);
            await axios.put(`/api/proyectos/${proyecto.id}`, {
                nombre:         formData.nombre.trim(),
                descripcion:    formData.descripcion.trim() || null,
                fecha_inicio:   formData.fecha_inicio || null,
                contratista_id: Number(formData.contratista_id),
            });
            setExito('Proyecto actualizado correctamente');
            setTimeout(() => onVolver(), 1500);
        } catch (error) {
            setApiError(error.response?.data?.error || 'Error al actualizar el proyecto');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <Modales
                visible={modal.visible}
                titulo="Confirmar Edición"
                mensaje={`¿Está seguro que desea guardar los cambios del proyecto "${formData.nombre}"?`}
                labelConfirmar="Guardar Cambios"
                variante="primary"
                onConfirmar={confirmarGuardado}
                onCancelar={() => setModal({ visible: false })}
            />

            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">
                        Editar Proyecto: <span style={{ color: 'var(--primary)' }}>{proyecto.nombre}</span>
                    </h5>
                    <p className="text-muted small mb-0">Modifica los datos del proyecto</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>
                    <i className="bi bi-arrow-left me-1" />Volver al Listado
                </button>
            </div>

            {exito && (
                <div className="alert alert-success py-2 small">
                    <i className="bi bi-check-lg me-1" />{exito}
                </div>
            )}

            <div className="card border">

                <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
                    <i className="bi bi-folder2-open" style={{ fontSize: 22, color: 'var(--primary)' }} />
                    <div>
                        <p className="fw-semibold mb-0 small">Datos del Proyecto</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Modifica los campos que necesites actualizar.</p>
                    </div>
                </div>

                {apiError && (
                    <div className="alert alert-danger py-2 small mx-4 mt-3 mb-0">{apiError}</div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-info-circle me-1" />Datos del Proyecto
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-12">
                                <label className="form-label small fw-medium">Nombre del Proyecto <span className="text-danger">*</span></label>
                                <input
                                    type="text" name="nombre"
                                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    value={formData.nombre} onChange={handleChange}
                                />
                                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-medium">Descripción</label>
                                <textarea
                                    name="descripcion" rows={3}
                                    className="form-control"
                                    value={formData.descripcion} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-building me-1" />Vinculación
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Contratista <span className="text-danger">*</span></label>
                                <select
                                    name="contratista_id"
                                    className={`form-select ${errors.contratista_id ? 'is-invalid' : ''}`}
                                    value={formData.contratista_id} onChange={handleChange}
                                >
                                    <option value="">— Selecciona un contratista —</option>
                                    {contratistas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                                {errors.contratista_id && <div className="invalid-feedback">{errors.contratista_id}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Fecha de Inicio</label>
                                <input
                                    type="date" name="fecha_inicio"
                                    className="form-control"
                                    value={formData.fecha_inicio} onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-center p-4 bg-light">
                        <button type="submit" className="btn btn-primary px-5" disabled={guardando}>
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

export default ProyectoEdit;