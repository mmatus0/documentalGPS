import React, { useEffect, useState } from 'react';
import axios from 'axios';
const API = process.env.REACT_APP_API_URL;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '', correo: '', contrasenia: '', rol_id: 2, estado_id: 1
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
    };

    const startEdit = (user) => {
        setIsEditing(true);
        setSelectedId(user.id_usuario);
        setFormData({
            nombre: user.nombre,
            correo: user.correo,
            contrasenia: '',
            rol_id: user.rol_id,
            estado_id: user.estado_id
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`${API}/api/users/${selectedId}`, formData);
                alert("Usuario actualizado");
            } else {
                await axios.post(`${API}/api/users`, formData);
                alert("Usuario creado");
            }
            cancelEdit();
            fetchUsers();
        } catch (error) { alert("Error en la operación"); }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setSelectedId(null);
        setFormData({ nombre: '', correo: '', contrasenia: '', rol_id: 2, estado_id: 1 });
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Desactivar usuario?")) {
            await axios.delete(`${API}/api/users/${id}`);
            fetchUsers();
        }
    };

    return (
        <div className="container mt-4">
            <div className={`card mb-4 shadow-sm border-${isEditing ? 'warning' : 'primary'}`}>
                <div className={`card-header text-white bg-${isEditing ? 'warning' : 'primary'}`}>
                    <h5 className="mb-0">{isEditing ? 'Editando Usuario' : 'Registrar Nuevo Usuario'}</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-3">
                            <input type="text" name="nombre" placeholder="Nombre" className="form-control" onChange={handleChange} value={formData.nombre} required />
                        </div>
                        <div className="col-md-3">
                            <input type="email" name="correo" placeholder="Correo" className="form-control" onChange={handleChange} value={formData.correo} required />
                        </div>
                        {!isEditing && (
                            <div className="col-md-2">
                                <input type="password" name="contrasenia" placeholder="Contraseña" className="form-control" onChange={handleChange} value={formData.contrasenia} required />
                            </div>
                        )}
                        <div className="col-md-2">
                            <select name="rol_id" className="form-select" onChange={handleChange} value={formData.rol_id}>
                                <option value="1">Admin</option>
                                <option value="2">Colaborador</option>
                            </select>
                        </div>
                        <div className="col-md-2 d-flex gap-2">
                            <button type="submit" className={`btn btn-${isEditing ? 'warning' : 'success'} w-100`}>
                                {isEditing ? 'Guardar' : 'Añadir'}
                            </button>
                            {isEditing && <button type="button" className="btn btn-secondary" onClick={cancelEdit}>X</button>}
                        </div>
                    </form>
                </div>
            </div>

            <table className="table table-hover shadow-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id_usuario}>
                            <td>{user.id_usuario}</td>
                            <td>{user.nombre}</td>
                            <td>{user.correo}</td>
                            <td>{user.rol_id === 1 ? 'Admin' : 'Colaborador'}</td>
                            <td>
                                <span className={`badge ${user.estado_id === 1 ? 'bg-success' : 'bg-danger'}`}>
                                    {user.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td className="d-flex gap-2">
                                <button className="btn btn-info btn-sm text-white" onClick={() => startEdit(user)}>Editar</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(user.id_usuario)} disabled={user.estado_id === 2}>
                                    Desactivar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserList;