import React, { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const ContratistaList = ({ onNuevo, onEditar }) => {
    const [contratistas, setContratistas] = useState([]);
    const [tabActiva,    setTabActiva]    = useState('activos');
    const [busqueda,     setBusqueda]     = useState('');
    const [modal,        setModal]        = useState({
        visible: false, titulo: '', mensaje: '',
        labelConfirmar: '', variante: 'danger', onConfirmar: null,
    });

    const fetchContratistas = async () => {
        try {
            const { data } = await axios.get('/api/contratistas');
            setContratistas(data);
        } catch (error) {
            console.error('Error al cargar contratistas:', error);
        }
    };

    useEffect(() => { fetchContratistas(); }, []);

    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));

    const handleDesactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Contratista',
            mensaje: `¿Está seguro que desea desactivar a "${nombre}"? Los expedientes vinculados no se verán afectados.`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/contratistas/${id}`);
                cerrarModal();
                fetchContratistas();
            },
        });
    };

    const handleReactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Reactivar Contratista',
            mensaje: `¿Desea reactivar a "${nombre}"?`,
            labelConfirmar: 'Reactivar',
            variante: 'primary',
            onConfirmar: async () => {
                await axios.patch(`/api/contratistas/${id}/reactivar`);
                cerrarModal();
                fetchContratistas();
            },
        });
    };

    const listaFiltrada = contratistas
        .filter(c => tabActiva === 'activos' ? c.estado_id === 1 : c.estado_id === 2)
        .filter(c => {
            const q = busqueda.toLowerCase();
            return c.nombre?.toLowerCase().includes(q) || c.rut?.toLowerCase().includes(q);
        });

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestión de Contratistas</h5>
                    <p className="text-muted small mb-0">Directorio centralizado de empresas contratistas del sistema</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNuevo}>
                    <i className="bi bi-plus-lg me-1" />Nuevo Contratista
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
                        placeholder="Buscar por nombre o RUT..."
                        style={{ maxWidth: 260 }}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="small text-muted fw-semibold ps-4">Razón Social</th>
                                <th className="small text-muted fw-semibold">RUT</th>
                                <th className="small text-muted fw-semibold">Correo de contacto</th>
                                <th className="small text-muted fw-semibold">Teléfono</th>
                                <th className="small text-muted fw-semibold">Estado</th>
                                <th className="small text-muted fw-semibold text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length > 0 ? (
                                listaFiltrada.map(c => (
                                    <tr key={c.id}>
                                        <td className="ps-4 small fw-medium">{c.nombre}</td>
                                        <td><code className="text-secondary small">{c.rut}</code></td>
                                        <td className="small text-muted">{c.correo_contacto || '—'}</td>
                                        <td className="small text-muted">{c.telefono || '—'}</td>
                                        <td>
                                            <span className={`badge ${c.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {c.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            {tabActiva === 'activos' ? (
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => onEditar(c)}>
                                                        <i className="bi bi-pencil me-1" />Editar
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(c.id, c.nombre)}>
                                                        <i className="bi bi-slash-circle me-1" />Desactivar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(c.id, c.nombre)}>
                                                    <i className="bi bi-arrow-clockwise me-1" />Reactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-5 small">
                                        {busqueda ? 'No se encontraron contratistas con ese criterio' : `No hay contratistas ${tabActiva}`}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modales {...modal} onCancelar={cerrarModal} />
        </>
    );
};

export default ContratistaList;