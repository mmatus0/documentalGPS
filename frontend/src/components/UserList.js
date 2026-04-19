import React, { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const UserList = ({ onNuevo, onEditar }) => {
    const [users,      setUsers]      = useState([]);
    const [tabActiva,  setTabActiva]  = useState('activos');
    const [busqueda,   setBusqueda]   = useState('');
    const [modal,     setModal]     = useState({ visible: false, titulo: '', 
        mensaje: '', labelConfirmar: '', variante: 'danger', onConfirmar: null });

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));

    const handleDesactivar = async (id) => {
        setModal({
            visible:        true,
            titulo:         'Desactivar Usuario',
            mensaje:        '¿Está seguro que desea desactivar esta cuenta? El usuario no podrá iniciar sesión.',
            labelConfirmar: 'Desactivar',
            variante:       'danger',
            onConfirmar:    async () => {
                await axios.delete(`/api/users/${id}`);
                cerrarModal();
                fetchUsers();
            },
        });
    };

    const handleReactivar = (id) => {
        setModal({
            visible:        true,
            titulo:         'Reactivar Usuario',
            mensaje:        '¿Desea reactivar la cuenta? El usuario podrá volver iniciar sesión.',
            labelConfirmar: 'Reactivar',
            variante:       'primary',
            onConfirmar:    async () => {
                await axios.patch(`/api/users/${id}/reactivar`);
                cerrarModal();
                fetchUsers();
            },
        });
    };

    const rolBadge = (rol_id) => {
        const map = { 1: ['primary', 'Administrador'], 2: ['success', 'Colaborador'], 3: ['secondary', 'Lector'] };
        const [color, label] = map[rol_id] || ['secondary', 'Desconocido'];
        return <span className={`badge bg-${color}`}>{label}</span>;
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
            <Modales {...modal} onCancelar={cerrarModal} />
 
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestión de Usuarios</h5>
                    <p className="text-muted small mb-0">Administración de accesos y roles del sistema</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNuevo}>
                    <i className="bi bi-plus-lg me-1" />Nuevo usuario
                </button>
            </div>
 
            <div className="card border">
 
                <div className="d-flex justify-content-between align-items-center px-4 border-bottom">
                    <ul className="nav nav-tabs border-bottom-0">
                        {['activos', 'inactivos'].map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link border-0 ${tabActiva === tab ? 'active fw-semibold' : 'text-muted'}`}
                                    onClick={() => setTabActiva(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Buscar por nombre o correo..."
                        style={{ maxWidth: 260 }}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>
 
                {/* Tabla */}
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="small text-muted fw-semibold">Nombre</th>
                                <th className="small text-muted fw-semibold">Correo</th>
                                <th className="small text-muted fw-semibold">Rol</th>
                                <th className="small text-muted fw-semibold">Estado</th>
                                <th className="small text-muted fw-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.length > 0 ? usuariosFiltrados.map(user => (
                                <tr key={user.id}>
                                    <td className="small fw-medium">{user.nombre_completo}</td>
                                    <td className="small text-muted">{user.correo}</td>
                                    <td>{rolBadge(user.rol_id)}</td>
                                    <td>
                                        <span className={`badge ${user.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                            {user.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            {tabActiva === 'activos' ? (
                                                <>
                                                    <button className="btn btn-outline-warning btn-sm" onClick={() => onEditar(user)}>Editar</button>
                                                    <button className="btn btn-outline-danger btn-sm"  onClick={() => handleDesactivar(user.id)}>Desactivar</button>
                                                </>
                                            ) : (
                                                <button className="btn btn-outline-primary btn-sm" onClick={() => handleReactivar(user.id)}>Reactivar</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-5 small">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
 
            </div>
        </>
    );
};
export default UserList;