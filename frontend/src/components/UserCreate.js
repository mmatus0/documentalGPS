import React, { useState } from 'react';
import axios from '../services/axiosConfig';

const UserCreate = ({ onVolver }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contrasenia: '',
        confirmar: '',
        rol_id: 2,
    });
    const [errors,       setErrors]       = useState({});
    const [mostrarPass,  setMostrarPass]  = useState(false);
    const [guardando,    setGuardando]    = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validar = () => {
        const e = {};
        if (!formData.nombre.trim())  e.nombre   = 'El nombre es obligatorio';
        if (!formData.correo.trim())  e.correo   = 'El correo es obligatorio';
        if (!formData.contrasenia)    e.contrasenia = 'La contraseña es obligatoria';
        else if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(formData.contrasenia))
            e.contrasenia = 'Mínimo 8 caracteres con letras y números';
        if (formData.confirmar !== formData.contrasenia)
            e.confirmar = 'Las contraseñas no coinciden';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errores = validar();
        if (Object.keys(errores).length > 0) { 
            setErrors(errores); return; 
        }

        try {
            setGuardando(true);
            await axios.post('/api/users', {
                nombre:     formData.nombre,
                correo:     formData.correo,
                contrasenia: formData.contrasenia,
                rol_id:     Number(formData.rol_id),
            });
            onVolver();
        } catch (error) {
            alert('Error al crear el usuario');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestión de Usuarios</h5>
                    <p className="text-muted small mb-0">Registra un nuevo acceso al sistema</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>
                    <i className="bi bi-arrow-left me-1" />Volver al Listado
                </button>
            </div>
 
            <div className="card border">

                <div className="card-header bg-light d-flex align-items-center gap-3 py-3">
                    <i className="bi bi-person" style={{ fontSize: 22, color: 'var(--primary)' }} />
                    <div>
                        <p className="fw-semibold mb-0 small">Crear Nuevo Perfil de Usuario</p>
                        <p className="text-muted mb-0" style={{ fontSize: 12 }}>Complete la información para registrar un nuevo acceso al sistema.</p>
                    </div>
                </div>
 
                <form onSubmit={handleSubmit}>
 
                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-info-circle me-1" />Datos Personales
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-12">
                                <label className="form-label small fw-medium">Nombre Completo</label>
                                <input type="text" name="nombre" className={`form-control ${errors.nombre ? 'is-invalid' : ''}`}
                                    placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={handleChange} />
                                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Correo Electrónico</label>
                                <input type="email" name="correo" className={`form-control ${errors.correo ? 'is-invalid' : ''}`}
                                    placeholder="juan@ejemplo.com" value={formData.correo} onChange={handleChange} />
                                {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
                            </div>
                        </div>
                    </div>
 
                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-lock me-1" />Seguridad
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Contraseña</label>
                                <div className="input-with-icon">
                                    <input type={mostrarPass ? 'text' : 'password'} name="contrasenia"
                                        className={`form-control ${errors.contrasenia ? 'is-invalid' : ''}`}
                                        placeholder="Mínimo 8 caracteres" value={formData.contrasenia} onChange={handleChange} />
                                    <button type="button" className="input-icon-btn" onClick={() => setMostrarPass(!mostrarPass)}>
                                        <i className={`bi ${mostrarPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                                {errors.contrasenia && <div className="text-danger" style={{ fontSize: 12 }}>{errors.contrasenia}</div>}
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Confirmar Contraseña</label>
                                <input type="password" name="confirmar"
                                    className={`form-control ${errors.confirmar ? 'is-invalid' : ''}`}
                                    placeholder="Repite la contraseña" value={formData.confirmar} onChange={handleChange} />
                                {errors.confirmar && <div className="invalid-feedback">{errors.confirmar}</div>}
                            </div>
                        </div>
                    </div>
 
                    <div className="border-bottom">
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-gear me-1" />Configuración de Cuenta
                            </span>
                        </div>
                        <div className="row g-3 p-4">
                            <div className="col-md-4">
                                <label className="form-label small fw-medium">Rol en Sistema</label>
                                <select name="rol_id" className="form-select" value={formData.rol_id} onChange={handleChange}>
                                    <option value={1}>Administrador</option>
                                    <option value={2}>Colaborador</option>
                                    <option value={3}>Lector</option>
                                </select>
                            </div>
                        </div>
                    </div>
 
                    {/* Submit */}
                    <div className="d-flex justify-content-center p-4 bg-light">
                        <button type="submit" className="btn btn-primary px-5" disabled={guardando}>
                            {guardando
                                ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                                : <><i className="bi bi-floppy me-2" />Crear Usuario</>
                            }
                        </button>
                    </div>
 
                </form>
            </div>
        </>
    );
};
 
export default UserCreate;