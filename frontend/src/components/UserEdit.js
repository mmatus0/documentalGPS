import React, { useState } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const TABS = ['Datos Generales', 'Seguridad'];

const UserEdit = ({ usuario, onVolver }) => {
    const [tabActiva,   setTabActiva]   = useState('Datos Generales');
    const [guardando,   setGuardando]   = useState(false);
    const [mostrarPass, setMostrarPass] = useState(false);
    const [errors,      setErrors]      = useState({});
    const [exito,       setExito]       = useState('');
    const [modal,       setModal]       = useState({ visible: false, tipo: null });

    const [formData, setFormData] = useState({
        nombre: usuario.nombre_completo || '',
        correo: usuario.correo          || '',
        rol_id: usuario.rol_id          || 2,
    });
    const [passData, setPassData] = useState({ contrasenia: '', confirmar: '' });

    const handleChange     = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setErrors({ ...errors, [e.target.name]: '' }); };
    const handlePassChange = (e) => { setPassData({ ...passData, [e.target.name]: e.target.value }); setErrors({ ...errors, [e.target.name]: '' }); };

    const validarDatos = () => {
        const e = {};
        if (!formData.nombre.trim()) e.nombre = 'El nombre es obligatorio';
        if (!formData.correo.trim()) e.correo = 'El correo es obligatorio';
        return e;
    };

    const validarPass = () => {
        const e = {};
        if (!passData.contrasenia) e.contrasenia = 'Ingresa la nueva contraseña';
        else if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(passData.contrasenia)) e.contrasenia = 'Mínimo 8 caracteres con letras y números';
        if (passData.confirmar !== passData.contrasenia) e.confirmar = 'Las contraseñas no coinciden';
        return e;
    };

    const handleSubmitDatos = (e) => {
        e.preventDefault();
        const errores = validarDatos();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }
        setModal({ visible: true, tipo: 'datos' });
    };

    const handleSubmitPassword = (e) => {
        e.preventDefault();
        const errores = validarPass();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }
        setModal({ visible: true, tipo: 'password' });
    };

    const cerrarModal = () => setModal({ visible: false, tipo: null });

    const confirmarGuardado = async () => {
        cerrarModal();
        try {
            setGuardando(true);
            if (modal.tipo === 'datos') {
                await axios.put(`/api/users/${usuario.id}`, { nombre: formData.nombre, correo: formData.correo, rol_id: Number(formData.rol_id) });
                setExito('Datos actualizados correctamente');
            } else {
                await axios.put(`/api/users/${usuario.id}`, { nombre: formData.nombre, correo: formData.correo, rol_id: Number(formData.rol_id), contrasenia: passData.contrasenia });
                setPassData({ contrasenia: '', confirmar: '' });
                setExito('Contraseña actualizada correctamente');
            }
            setTimeout(() => setExito(''), 3000);
        } catch { alert('Error al actualizar el usuario'); }
        finally { setGuardando(false); }
    };

    const modalConfig = modal.tipo === 'datos'
        ? { titulo: 'Confirmar edición', mensaje: `¿Estás seguro de que deseas guardar los cambios de ${formData.nombre}?`, labelConfirmar: 'Guardar cambios', variante: 'primary' }
        : { titulo: 'Cambiar contraseña', mensaje: 'La contraseña actual será reemplazada. Esta acción no se puede deshacer.', labelConfirmar: 'Actualizar contraseña', variante: 'danger' };

    const tabIcono = { 'Datos Generales': 'bi-gear', 'Seguridad': 'bi-lock' };

    return (
        <>
            <Modales visible={modal.visible} {...modalConfig} onConfirmar={confirmarGuardado} onCancelar={cerrarModal} />

            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">
                        Editar Usuario: <span style={{ color: 'var(--primary)' }}>{usuario.nombre_completo}</span>
                    </h5>
                    <p className="text-muted small mb-0">Modifica los datos del perfil seleccionado</p>
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={onVolver}>
                    <i className="bi bi-arrow-left me-1" />Volver al listado
                </button>
            </div>

            {exito && (
                <div className="alert alert-success py-2 small">
                    <i className="bi bi-check-lg me-1" />{exito}
                </div>
            )}

            <div className="card border">

                <div className="px-4 border-bottom">
                    <ul className="nav nav-tabs border-bottom-0">
                        {TABS.map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link border-0 ${tabActiva === tab ? 'active fw-medium' : 'text-muted'}`}
                                    onClick={() => { setTabActiva(tab); setErrors({}); }}
                                >
                                    <i className={`bi ${tabIcono[tab]} me-1`} />{tab}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {tabActiva === 'Datos Generales' && (
                    <form onSubmit={handleSubmitDatos}>
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
                            <div className="col-md-4">
                                <label className="form-label small fw-medium">Rol en el Sistema</label>
                                <select name="rol_id" className="form-select" value={formData.rol_id} onChange={handleChange}>
                                    <option value={1}>Administrador</option>
                                    <option value={2}>Colaborador</option>
                                    <option value={3}>Lector</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label small fw-medium">Estado</label>
                                <div className="pt-1">
                                    <span className={`badge ${usuario.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                        {usuario.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex justify-content-center p-4 border-top bg-light">
                            <button type="submit" className="btn btn-primary px-5" disabled={guardando}>
                                {guardando
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                                    : <><i className="bi bi-floppy me-2" />Guardar Cambios</>
                                }
                            </button>
                        </div>
                    </form>
                )}

                {tabActiva === 'Seguridad' && (
                    <form onSubmit={handleSubmitPassword}>
                        <div className="px-4 py-2 bg-light border-bottom">
                            <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.06em' }}>
                                <i className="bi bi-shield-lock me-1" />Cambiar Contraseña
                            </span>
                        </div>

                        <div className="row g-3 p-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Nueva Contraseña</label>
                                <div className="input-with-icon">
                                    <input type={mostrarPass ? 'text' : 'password'} name="contrasenia"
                                        className={`form-control ${errors.contrasenia ? 'is-invalid' : ''}`}
                                        placeholder="Mínimo 8 caracteres" value={passData.contrasenia} onChange={handlePassChange} />
                                    <button type="button" className="input-icon-btn" onClick={() => setMostrarPass(!mostrarPass)}>
                                        <i className={`bi ${mostrarPass ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                                <div className="form-text">Mínimo 8 caracteres con letras y números</div>
                                {errors.contrasenia && <div className="text-danger" style={{ fontSize: 12 }}>{errors.contrasenia}</div>}
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-medium">Confirmar Nueva Contraseña</label>
                                <input type="password" name="confirmar"
                                    className={`form-control ${errors.confirmar ? 'is-invalid' : ''}`}
                                    placeholder="Repite la nueva contraseña" value={passData.confirmar} onChange={handlePassChange} />
                                {errors.confirmar && <div className="invalid-feedback">{errors.confirmar}</div>}
                            </div>

                        </div>

                        <div className="d-flex justify-content-center p-4 border-top bg-light">
                            <button type="submit" className="btn btn-primary px-5" disabled={guardando}>
                                {guardando
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                                    : <><i className="bi bi-lock me-2" />Actualizar Contraseña</>
                                }
                            </button>
                        </div>

                    </form>
                )}

            </div>
        </>
    );
};

export default UserEdit;