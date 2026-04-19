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
            <div className="d-flex justify-content-between align-items-start mb-5">
                <div>
                    <h4 className="fw-bold mb-0">Nuevo Contratista</h4>
                    <p className="text-muted small mb-0">Rellene los datos de empresa contratista</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>← Volver</button>
            </div>

            <div className="card border-10 shadow-sm" style={{ maxWidth: 1100 }}>
                <div className="card-body p-4">
                    {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">

                            <div className="col-12">
                                <label className="form-label fw-medium">Razón Social <span className="text-danger">*</span></label>
                                <input type="text" name="nombre"
                                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    placeholder="Ej: Constructora Pérez SpA"
                                    value={formData.nombre} onChange={handleChange} />
                                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-medium">RUT <span className="text-danger">*</span></label>
                                <input type="text" name="rut"
                                    className={`form-control ${errors.rut ? 'is-invalid' : ''}`}
                                    placeholder="Ej: 77777777-7"
                                    value={formData.rut} onChange={handleChange} />
                                {errors.rut && <div className="invalid-feedback">{errors.rut}</div>}
                                <div className="form-text">El RUT debe ser único en sistema</div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-medium">Teléfono</label>
                                <input type="text" name="telefono" className="form-control"
                                    placeholder="Ej: +912345678"
                                    value={formData.telefono} onChange={handleChange} />
                            </div>

                            <div className="col-12">
                                <label className="form-label fw-medium">Correo</label>
                                <input type="email" name="correo_contacto" className="form-control"
                                    placeholder="Ej: contacto@empresa.cl"
                                    value={formData.correo_contacto} onChange={handleChange} />
                            </div>

                        </div>
                        <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={onVolver} disabled={guardando}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Registrar Contratista'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ContratistaCreate;