import React, { useState } from 'react';
import axios from '../services/axiosConfig';

const FORM_INICIAL = { nombre: '', rut: '', correo_contacto: '', telefono: '' };

const ContratistaCreate = ({ onVolver }) => {
    const [formData,  setFormData]  = useState(FORM_INICIAL);
    const [errors,    setErrors]    = useState({});
    const [apiError,  setApiError]  = useState('');
    const [guardando, setGuardando] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setApiError('');
    };

    const validar = () => {
        const e = {};
        if (!formData.nombre.trim()) e.nombre = 'La razón social es obligatoria';
        if (!formData.rut.trim())    e.rut    = 'El RUT es obligatorio';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errores = validar();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }
        try {
            setGuardando(true);
            await axios.post('/api/contratistas', formData);
            onVolver();
        } catch (error) {
            setApiError(error.response?.data?.error || 'Error al registrar el contratista');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Nuevo Contratista</h5>
                    <p className="text-muted small mb-0">Registra una nueva empresa contratista en el sistema</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>
                    <i className="bi bi-arrow-left me-1" />Volver al Listado
                </button>
            </div>

            <div className="card border">

                <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
                    <i className="bi bi-building" style={{ fontSize: 22, color: 'var(--primary)' }} />
                    <div>
                        <p className="fw-semibold mb-0 small">Crear Nuevo Contratista</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Complete la información para registrar la empresa en el sistema.</p>
                    </div>
                </div>

                {apiError && (
                    <div className="alert alert-danger py-2 small mx-4 mt-3 mb-0">{apiError}</div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-info-circle me-1" />Datos de la Empresa
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-12">
                                <label className="form-label small fw-medium">Razón Social <span className="text-danger">*</span></label>
                                <input type="text" name="nombre"
                                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    placeholder="Ej: Constructora Pérez SpA"
                                    value={formData.nombre} onChange={handleChange} />
                                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">RUT <span className="text-danger">*</span></label>
                                <input type="text" name="rut"
                                    className={`form-control ${errors.rut ? 'is-invalid' : ''}`}
                                    placeholder="Ej: 77.777.777-7"
                                    value={formData.rut} onChange={handleChange} />
                                {errors.rut && <div className="invalid-feedback">{errors.rut}</div>}
                                <div className="form-text">El RUT debe ser único en el sistema</div>
                            </div>
                        </div>
                    </div>

                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-telephone me-1" />Contacto
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Correo de contacto</label>
                                <input type="email" name="correo_contacto" className="form-control"
                                    placeholder="Ej: contacto@empresa.cl"
                                    value={formData.correo_contacto} onChange={handleChange} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Teléfono</label>
                                <input type="text" name="telefono" className="form-control"
                                    placeholder="Ej: +56 9 1234 5678"
                                    value={formData.telefono} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-center p-4 bg-light">
                        <button type="submit" className="btn btn-primary px-5" disabled={guardando}>
                            {guardando
                                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                                : <><i className="bi bi-floppy me-2" />Registrar Contratista</>
                            }
                        </button>
                    </div>

                </form>
            </div>
        </>
    );
};

export default ContratistaCreate;