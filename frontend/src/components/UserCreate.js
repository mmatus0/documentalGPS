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
        if (Object.keys(errores).length > 0) { setErrors(errores); return; }

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
            {/* Encabezado */}
            <div className="page-title-row">
                <div>
                    <p className="page-title">Gestión de Usuarios</p>
                    <p className="page-subtitle">Registra un nuevo acceso al sistema</p>
                </div>
                <button className="btn btn-secondary" onClick={onVolver}>
                    ← Volver al listado
                </button>
            </div>

            <div className="panel">
                {/* Header de la card */}
                <div className="panel-header">
                    <span className="panel-icon">👤</span>
                    <div>
                        <p className="panel-header-title">Crear Nuevo Perfil de Usuario</p>
                        <p className="panel-header-sub">Complete la información para registrar un nuevo acceso al sistema.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>

                    {/* Sección: Datos Personales */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span>ℹ</span> Datos Personales
                        </div>
                        <div className="form-section-body">
                            <div className="field field-full">
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                />
                                {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                            </div>
                            <div className="field">
                                <label>Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correo"
                                    placeholder="juan@ejemplo.com"
                                    value={formData.correo}
                                    onChange={handleChange}
                                />
                                {errors.correo && <span className="field-error">{errors.correo}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Sección: Seguridad */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span>🔒</span> Seguridad
                        </div>
                        <div className="form-section-body">
                            <div className="field">
                                <label>Contraseña</label>
                                <div className="input-with-icon">
                                    <input
                                        type={mostrarPass ? 'text' : 'password'}
                                        name="contrasenia"
                                        placeholder="Mínimo 8 caracteres"
                                        value={formData.contrasenia}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="input-icon-btn"
                                        onClick={() => setMostrarPass(!mostrarPass)}
                                    >
                                        {mostrarPass ? '🙈' : '👁'}
                                    </button>
                                </div>
                                {errors.contrasenia && <span className="field-error">{errors.contrasenia}</span>}
                            </div>
                            <div className="field">
                                <label>Confirmar Contraseña</label>
                                <input
                                    type="password"
                                    name="confirmar"
                                    placeholder="Repite la contraseña"
                                    value={formData.confirmar}
                                    onChange={handleChange}
                                />
                                {errors.confirmar && <span className="field-error">{errors.confirmar}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Sección: Configuración de Cuenta */}
                    <div className="form-section">
                        <div className="form-section-title">
                            <span>⚙</span> Configuración de Cuenta
                        </div>
                        <div className="form-section-body">
                            <div className="field">
                                <label>Rol en el Sistema</label>
                                <select name="rol_id" value={formData.rol_id} onChange={handleChange}>
                                    <option value={1}>Administrador</option>
                                    <option value={2}>Colaborador</option>
                                    <option value={3}>Lector</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer con botón */}
                    <div className="form-submit-row">
                        <button type="submit" className="btn btn-primary btn-lg" disabled={guardando}>
                            {guardando ? 'Guardando...' : '💾 Crear Usuario'}
                        </button>
                    </div>

                </form>
            </div>
        </>
    );
};

export default UserCreate;