import React, { useState } from 'react';
import axios from '../services/axiosConfig';

const TABS = ['Datos Generales', 'Seguridad'];

const UserEdit = ({ usuario, onVolver }) => {
    const [tabActiva,   setTabActiva]   = useState('Datos Generales');
    const [guardando,   setGuardando]   = useState(false);
    const [mostrarPass, setMostrarPass] = useState(false);
    const [errors,      setErrors]      = useState({});
    const [exito,       setExito]       = useState('');

    const [formData, setFormData] = useState({
        nombre:    usuario.nombre_completo || '',
        correo:    usuario.correo          || '',
        rol_id:    usuario.rol_id          || 2,
    });

    const [passData, setPassData] = useState({
        contrasenia: '',
        confirmar:   '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validarDatos = () => {
        const e = {};
        if (!formData.nombre.trim()) e.nombre = 'El nombre es obligatorio';
        if (!formData.correo.trim()) e.correo = 'El correo es obligatorio';
        return e;
    };

    const validarPass = () => {
        const e = {};
        if (!passData.contrasenia)
            e.contrasenia = 'Ingresa la nueva contraseña';
        else if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(passData.contrasenia))
            e.contrasenia = 'Mínimo 8 caracteres con letras y números';
        if (passData.confirmar !== passData.contrasenia)
            e.confirmar = 'Las contraseñas no coinciden';
        return e;
    };

    const guardarDatos = async (e) => {
        e.preventDefault();
        const errores = validarDatos();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }

        try {
            setGuardando(true);
            await axios.put(`/api/users/${usuario.id}`, {
                nombre: formData.nombre,
                correo: formData.correo,
                rol_id: Number(formData.rol_id),
            });
            setExito('Datos actualizados correctamente');
            setTimeout(() => setExito(''), 3000);
        } catch (error) {
            alert('Error al actualizar el usuario');
        } finally {
            setGuardando(false);
        }
    };

    const guardarPassword = async (e) => {
        e.preventDefault();
        const errores = validarPass();
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }

        try {
            setGuardando(true);
            await axios.put(`/api/users/${usuario.id}`, {
                nombre: formData.nombre,
                correo: formData.correo,
                rol_id: Number(formData.rol_id),
                contrasenia: passData.contrasenia,
            });
            setPassData({ contrasenia: '', confirmar: '' });
            setExito('Contraseña actualizada correctamente');
            setTimeout(() => setExito(''), 3000);
        } catch (error) {
            alert('Error al actualizar la contraseña');
        } finally {
            setGuardando(false);
        }
    };

    const getRolNombre = (rol_id) => {
        if (rol_id === 1) return 'Administrador';
        if (rol_id === 2) return 'Colaborador';
        return 'Lector';
    };

    return (
        <>
            {/* Encabezado */}
            <div className="page-title-row">
                <div>
                    <p className="page-title">
                        Editar Usuario: <span style={{ color: 'var(--primary)' }}>{usuario.nombre_completo}</span>
                    </p>
                    <p className="page-subtitle">Modifica los datos del perfil seleccionado</p>
                </div>
                <button className="btn btn-secondary" onClick={onVolver}>
                    ← Volver al listado
                </button>
            </div>

            {/* Mensaje de éxito */}
            {exito && (
                <div className="alert-success">
                    ✓ {exito}
                </div>
            )}

            <div className="panel">
                {/* Tabs */}
                <div className="panel-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            className={`panel-tab-btn ${tabActiva === tab ? 'active' : ''}`}
                            onClick={() => { setTabActiva(tab); setErrors({}); }}
                        >
                            {tab === 'Datos Generales' && '⚙ '}
                            {tab === 'Seguridad'       && '🔒 '}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab: Datos Generales */}
                {tabActiva === 'Datos Generales' && (
                    <form onSubmit={guardarDatos}>
                        <div className="form-section">
                            <div className="form-section-body">
                                <div className="field field-full">
                                    <label>Nombre Completo</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        placeholder="Ej: Juan Pérez"
                                    />
                                    {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                                </div>
                                <div className="field">
                                    <label>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        placeholder="juan@ejemplo.com"
                                    />
                                    {errors.correo && <span className="field-error">{errors.correo}</span>}
                                </div>
                                <div className="field">
                                    <label>Rol en el Sistema</label>
                                    <select name="rol_id" value={formData.rol_id} onChange={handleChange}>
                                        <option value={1}>Administrador</option>
                                        <option value={2}>Colaborador</option>
                                        <option value={3}>Lector</option>
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Estado actual</label>
                                    <div className="field-readonly">
                                        <span className={`badge ${usuario.estado_id === 1 ? 'badge-activo' : 'badge-inactivo'}`}>
                                            {usuario.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-submit-row">
                            <button type="submit" className="btn btn-primary btn-lg" disabled={guardando}>
                                {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Tab: Seguridad */}
                {tabActiva === 'Seguridad' && (
                    <form onSubmit={guardarPassword}>
                        <div className="form-section">
                            <div className="form-section-title" style={{ color: 'var(--primary)' }}>
                                Cambiar Contraseña
                            </div>
                            <div className="form-section-body">
                                <div className="field">
                                    <label>Nueva Contraseña</label>
                                    <div className="input-with-icon">
                                        <input
                                            type={mostrarPass ? 'text' : 'password'}
                                            name="contrasenia"
                                            placeholder="Dejar en blanco para no cambiar"
                                            value={passData.contrasenia}
                                            onChange={handlePassChange}
                                        />
                                        <button
                                            type="button"
                                            className="input-icon-btn"
                                            onClick={() => setMostrarPass(!mostrarPass)}
                                        >
                                            {mostrarPass ? '🙈' : '👁'}
                                        </button>
                                    </div>
                                    <span className="field-hint">Mínimo 8 caracteres</span>
                                    {errors.contrasenia && <span className="field-error">{errors.contrasenia}</span>}
                                </div>
                                <div className="field">
                                    <label>Confirmar Nueva Contraseña</label>
                                    <input
                                        type="password"
                                        name="confirmar"
                                        placeholder="Repite la nueva contraseña"
                                        value={passData.confirmar}
                                        onChange={handlePassChange}
                                    />
                                    {errors.confirmar && <span className="field-error">{errors.confirmar}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="form-submit-row">
                            <button type="submit" className="btn btn-primary btn-lg" disabled={guardando}>
                                {guardando ? 'Guardando...' : '🔒 Actualizar Contraseña'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
};

export default UserEdit;