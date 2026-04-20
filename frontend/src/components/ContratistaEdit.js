import React, { useState } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const ContratistaEdit = ({ contratista, onVolver }) => {
    const [formData,  setFormData]  = useState({
        nombre:          contratista.nombre,
        correo_contacto: contratista.correo_contacto || '',
        telefono:        contratista.telefono        || '',
    });
    const [errors,    setErrors]    = useState({});
    const [apiError,  setApiError]  = useState('');
    const [guardando, setGuardando] = useState(false);
    const [exito,     setExito]     = useState('');
    const [modal,     setModal]     = useState({ visible: false });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setApiError('');
    };

    const validar = () => {
        const e = {};
        if (!formData.nombre.trim()) e.nombre = 'La razón social es obligatoria';
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
            await axios.put(`/api/contratistas/${contratista.id}`, formData);
            setExito('Contratista actualizado correctamente');
            setTimeout(() => onVolver(), 1500);
        } catch (error) {
            setApiError(error.response?.data?.error || 'Error al actualizar el contratista');
        } finally {
            setGuardando(false);
        }
    };

    const cerrarModal = () => setModal({ visible: false });

    return (
        <>
            <Modales
                visible={modal.visible}
                titulo="Confirmar Edición"
                mensaje={`¿Está seguro que desea guardar los cambios de empresa: "${formData.nombre}"?`}
                labelConfirmar="Guardar Cambios"
                variante="primary"
                onConfirmar={confirmarGuardado}
                onCancelar={cerrarModal}
            />

            <div className="d-flex justify-content-between align-items-start mb-5">
                
                <div>
                    <h4 className="fw-bold mb-0">Editar Contratista</h4>
                    <p className="text-muted small mb-0">Modifica datos de empresa contratista</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}> ← Volver</button>
            </div>

            <div className="card border-1 shadow-sm" style={{ maxWidth: 1100 }}>
                <div className="card-body p-4">
                    {apiError && <div className="alert alert-danger py-2 small">{apiError}</div>}

                    <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-4 small">
                        <span className="text-muted">RUT (no editable):</span>
                        <code className="fw-bold text-dark">{contratista.rut}</code>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">

                            <div className="col-12">
                                <label className="form-label fw-medium">Razón Social <span className="text-danger">*</span></label>
                                <input type="text" name="nombre"
                                    className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    value={formData.nombre} onChange={handleChange} />
                                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-medium">Teléfono</label>
                                <input type="text" name="telefono" className="form-control"
                                    placeholder="Ej: +56 9 1234 5678"
                                    value={formData.telefono} onChange={handleChange} />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-medium">Correo de contacto</label>
                                <input type="email" name="correo_contacto" className="form-control"
                                    placeholder="Ej: contacto@empresa.cl"
                                    value={formData.correo_contacto} onChange={handleChange} />
                            </div>

                        </div>
                        <div className="d-flex gap-2 justify-content-end mt-4 pt-3 border-top">
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={onVolver} disabled={guardando}>Cancelar</button>
                            <button type="submit" className="btn btn-warning" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ContratistaEdit;