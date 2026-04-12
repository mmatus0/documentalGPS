import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [tabActiva, setTabActiva] = useState('activos');
    const [busqueda, setBusqueda] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        nombre: '', correo: '', contrasenia: '', rol_id: 2
    });

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API}/api/users`);
            setUsers(response.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validar = () => {
        const nuevosErrores = {};
        if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
        if (!formData.correo.trim()) nuevosErrores.correo = 'El correo es obligatorio';
        if (!isEditing) {
            if (!formData.contrasenia) {
                nuevosErrores.contrasenia = 'La contraseña es obligatoria';
            } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/.test(formData.contrasenia)) {
                nuevosErrores.contrasenia = 'Mínimo 8 caracteres, letras y números';
            }
        }
        return nuevosErrores;
    };

    const startEdit = (user) => {
        setIsEditing(true);
        setSelectedId(user.id_usuario);
        setFormData({
            nombre: user.nombre,
            correo: user.correo,
            contrasenia: '',
            rol_id: user.rol_id
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setSelectedId(null);
        setErrors({});
        setFormData({ nombre: '', correo: '', contrasenia: '', rol_id: 2 });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nuevosErrores = validar();
        if (Object.keys(nuevosErrores).length > 0) {
            setErrors(nuevosErrores);
            return;
        }
        try {
            const url = isEditing
                ? `${API}/api/users/${selectedId}`
                : `${API}/api/users`;
            const method = isEditing ? 'put' : 'post';
            await axios[method](url, {
                ...formData,
                rol_id: Number(formData.rol_id)
            });
            cancelEdit();
            fetchUsers();
        } catch (error) {
            alert('Error en la operación');
        }
    };

    const handleDesactivar = async (id) => {
        if (window.confirm('¿Desactivar este usuario?')) {
            await axios.delete(`${API}/api/users/${id}`);
            fetchUsers();
        }
    };

    const getRolNombre = (rol_id) => {
        if (rol_id === 1) return 'Administrador';
        if (rol_id === 2) return 'Colaborador';
        if (rol_id === 3) return 'Lector';
        return 'Desconocido';
    };

    const getRolBadge = (rol_id) => {
        if (rol_id === 1) return 'badge badge-admin';
        if (rol_id === 2) return 'badge badge-colaborador';
        return 'badge badge-lector';
    };

    const usuariosFiltrados = users
        .filter(u => tabActiva === 'activos' ? u.estado_id === 1 : u.estado_id === 2)
        .filter(u => {
            const q = busqueda.toLowerCase();
            return (
                u.nombre?.toLowerCase().includes(q) ||
                u.correo?.toLowerCase().includes(q)
            );
        });

    return (
        <>
            <p className="page-title">Gestión de Usuarios</p>
            <p className="page-subtitle">Administración de accesos y roles del sistema</p>

            <div className="panel">
                <div className="panel-header">
                    <h3>{isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="field">
                            <label>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Ej: María"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                            {errors.nombre && <span className="field-error">{errors.nombre}</span>}
                        </div>
                        
                        <div className="field">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                name="correo"
                                placeholder="Ej: usuario@correo.com"
                                value={formData.correo}
                                onChange={handleChange}
                            />
                            {errors.correo && <span className="field-error">{errors.correo}</span>}
                        </div>
                        {!isEditing && (
                            <div className="field">
                                <label>Contraseña</label>
                                <input
                                    type="password"
                                    name="contrasenia"
                                    placeholder="Mín. 8 caracteres con letras y números"
                                    value={formData.contrasenia}
                                    onChange={handleChange}
                                />
                                {errors.contrasenia && <span className="field-error">{errors.contrasenia}</span>}
                            </div>
                        )}
                        <div className="field">
                            <label>Rol</label>
                            <select name="rol_id" value={formData.rol_id} onChange={handleChange}>
                                <option value={1}>Administrador</option>
                                <option value={2}>Colaborador</option>
                                <option value={3}>Lector</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-actions">
                        {isEditing && (
                            <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className={`btn ${isEditing ? 'btn-warning' : 'btn-primary'}`}>
                            {isEditing ? 'Guardar cambios' : 'Registrar usuario'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="panel">
                <div className="table-toolbar">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${tabActiva === 'activos' ? 'active' : ''}`}
                            onClick={() => setTabActiva('activos')}
                        >
                            Activos
                        </button>
                        <button
                            className={`tab-btn ${tabActiva === 'inactivos' ? 'active' : ''}`}
                            onClick={() => setTabActiva('inactivos')}
                        >
                            Inactivos
                        </button>
                    </div>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Buscar por nombre o correo..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.length > 0 ? (
                            usuariosFiltrados.map(user => (
                                <tr key={user.id_usuario}>
                                    <td>{user.nombre} </td>
                                    <td>{user.correo}</td>
                                    <td><span className={getRolBadge(user.rol_id)}>{getRolNombre(user.rol_id)}</span></td>
                                    <td>
                                        <span className={`badge ${user.estado_id === 1 ? 'badge-activo' : 'badge-inactivo'}`}>
                                            {user.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            {tabActiva === 'activos' && (
                                                <>
                                                    <button className="btn btn-sm btn-warning" onClick={() => startEdit(user)}>Editar</button>
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleDesactivar(user.id_usuario)}>Desactivar</button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="empty-state">No se encontraron usuarios</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserList;