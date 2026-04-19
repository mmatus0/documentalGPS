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
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="fw-bold mb-1">Gestión de Contratistas</h4>
                    <p className="text-muted small mb-0">
                        Directorio centralizado de empresas contratistas del sistema
                    </p>
                </div>
                <button className="btn btn-primary" onClick={onNuevo}>
                    + Nuevo Contratista
                </button>
            </div>

            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center px-4 py-0">
                    <ul className="nav nav-tabs border-0">
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'activos' ? 'active' : ''}`} onClick={() => setTabActiva('activos')}>
                                Activos
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${tabActiva === 'inactivos' ? 'active' : ''}`} onClick={() => setTabActiva('inactivos')}>
                                Inactivos
                            </button>
                        </li>
                    </ul>
                    <input type="text" className="form-control form-control-sm" style={{ width: 240 }}
                        placeholder="Buscar por nombre o RUT..." value={busqueda}
                        onChange={e => setBusqueda(e.target.value)} />
                </div>

                <div className="card-body p-0">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="ps-4">Razón Social</th>
                                <th>RUT</th>
                                <th>Correo de contacto</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                                <th className="text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length > 0 ? (
                                listaFiltrada.map(c => (
                                    <tr key={c.id}>
                                        <td className="ps-4 fw-medium">{c.nombre}</td>
                                        <td><code className="text-secondary">{c.rut}</code></td>
                                        <td>{c.correo_contacto || <span className="text-muted">—</span>}</td>
                                        <td>{c.telefono        || <span className="text-muted">—</span>}</td>
                                        <td>
                                            <span className={`badge bg-${c.estado_id === 1 ? 'success' : 'secondary'}`}>
                                                {c.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            {tabActiva === 'activos' ? (
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => onEditar(c)}>Editar</button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(c.id, c.nombre)}>Desactivar</button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(c.id, c.nombre)}>Reactivar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center text-muted py-5">
                                    {busqueda ? 'No se encontraron contratistas con ese criterio' : `No hay contratistas ${tabActiva}`}
                                </td></tr>
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