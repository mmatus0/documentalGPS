import React, { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';

const UserList = ({ onNuevo, onEditar }) => {
    const [users,      setUsers]      = useState([]);
    const [tabActiva,  setTabActiva]  = useState('activos');
    const [busqueda,   setBusqueda]   = useState('');

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDesactivar = async (id) => {
        if (window.confirm('¿Desactivar este usuario?')) {
            try {
                await axios.delete(`/api/users/${id}`);
                fetchUsers();
            } catch (error) {
                alert('Error al desactivar el usuario');
                console.error(error);
            }
        }
    };

    const handleReactivar = async (id) => {
        if (window.confirm('¿Reactivar este usuario?')) {
            try {
                await axios.patch(`/api/users/${id}/reactivar`);
                fetchUsers();
            } catch (error) {
                alert('Error al reactivar el usuario');
                console.error(error);
            }
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
                u.nombre_completo?.toLowerCase().includes(q) ||
                u.correo?.toLowerCase().includes(q)
            );
        });

    return (
        <>
            <div className="page-title-row">
                <div>
                    <p className="page-title">Gestión de Usuarios</p>
                    <p className="page-subtitle">Administración de accesos y roles del sistema</p>
                </div>
                <button className="btn btn-primary" onClick={onNuevo}>
                    + Nuevo usuario
                </button>
            </div>

            <div className="panel">
                <div className="panel-toolbar">
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
                                <tr key={user.id}>
                                    <td>{user.nombre_completo}</td>
                                    <td>{user.correo}</td>
                                    <td>
                                        <span className={getRolBadge(user.rol_id)}>
                                            {getRolNombre(user.rol_id)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.estado_id === 1 ? 'badge-activo' : 'badge-inactivo'}`}>
                                            {user.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            {tabActiva === 'activos' ? (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-warning"
                                                        onClick={() => onEditar(user)}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDesactivar(user.id)}
                                                    >
                                                        Desactivar
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => handleReactivar(user.id)}
                                                >
                                                    Reactivar
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    No se encontraron usuarios
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserList;