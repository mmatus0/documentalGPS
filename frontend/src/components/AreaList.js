import React, { useEffect, useState } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';
 
const AreaList = ({ onNueva, onEditar, onGestionarUsuarios, filtroContratistaId }) => {
    const [areas,        setAreas]        = useState([]);
    const [contratistas, setContratistas] = useState([]);
    const [tabActiva,    setTabActiva]    = useState('activos');
    const [busqueda,     setBusqueda]     = useState('');
    const [filtroC,      setFiltroC]      = useState(filtroContratistaId ? String(filtroContratistaId) : '');
    const [modal,        setModal]        = useState({
        visible: false, titulo: '', mensaje: '',
        labelConfirmar: '', variante: 'danger', onConfirmar: null,
    });
 
    const fetchAreas = async () => {
        try {
            const { data } = await axios.get('/api/areas');
            setAreas(data);
        } catch (error) {
            console.error('Error al cargar áreas:', error);
        }
    };
 
    useEffect(() => {
        fetchAreas();
        axios.get('/api/contratistas')
            .then(({ data }) => setContratistas(data.filter(c => c.estado_id === 1)))
            .catch(err => console.error(err));
    }, []);
 
    // Aplicar filtro de contratista si viene como prop (desde ContratistaList → Ver Áreas)
    useEffect(() => {
        if (filtroContratistaId) setFiltroC(String(filtroContratistaId));
    }, [filtroContratistaId]);
 
    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));
 
    const handleDesactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Área',
            mensaje: `¿Está seguro que desea desactivar el área "${nombre}"? Los expedientes históricos vinculados no se verán afectados.`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/areas/${id}`);
                cerrarModal();
                fetchAreas();
            },
        });
    };
 
    const handleReactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Reactivar Área',
            mensaje: `¿Desea reactivar el área "${nombre}"?`,
            labelConfirmar: 'Reactivar',
            variante: 'primary',
            onConfirmar: async () => {
                await axios.patch(`/api/areas/${id}/reactivar`);
                cerrarModal();
                fetchAreas();
            },
        });
    };
 
    const listaFiltrada = areas
        .filter(a => tabActiva === 'activos' ? a.estado_id === 1 : a.estado_id === 2)
        .filter(a => !filtroC || String(a.contratista_id) === filtroC)
        .filter(a => {
            const q = busqueda.toLowerCase();
            return (
                a.nombre?.toLowerCase().includes(q) ||
                a.contratista_nombre?.toLowerCase().includes(q)
            );
        });
 
    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Gestión de Unidades Organizativas</h5>
                    <p className="text-muted small mb-0">Áreas vinculadas a cada empresa contratista</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNueva}>
                    <i className="bi bi-plus-lg me-1" />Nueva Área
                </button>
            </div>
 
            <div className="card border">
                <div className="d-flex justify-content-between align-items-center px-4 border-bottom flex-wrap gap-2 py-1">
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
 
                    <div className="d-flex gap-2 align-items-center">
                        <select
                            className="form-select form-select-sm"
                            style={{ maxWidth: 200 }}
                            value={filtroC}
                            onChange={e => setFiltroC(e.target.value)}
                        >
                            <option value="">Todos los contratistas</option>
                            {contratistas.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Buscar área..."
                            style={{ maxWidth: 200 }}
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
 
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="small text-muted fw-semibold ps-4">Nombre del Área</th>
                                <th className="small text-muted fw-semibold">Contratista</th>
                                <th className="small text-muted fw-semibold">Estado</th>
                                <th className="small text-muted fw-semibold text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length > 0 ? (
                                listaFiltrada.map(a => (
                                    <tr key={a.id}>
                                        <td className="ps-4 small fw-medium">{a.nombre}</td>
                                        <td className="small text-muted">{a.contratista_nombre}</td>
                                        <td>
                                            <span className={`badge ${a.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                {a.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="text-end pe-4">
                                            {tabActiva === 'activos' ? (
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => onGestionarUsuarios(a)}
                                                    >
                                                        <i className="bi bi-people me-1" /> Gestionar Usuarios
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => onEditar(a)}>
                                                        <i className="bi bi-pencil me-1" />Editar
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(a.id, a.nombre)}>
                                                        <i className="bi bi-slash-circle me-1" />Desactivar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(a.id, a.nombre)}>
                                                    <i className="bi bi-arrow-clockwise me-1" />Reactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted py-5 small">
                                        {busqueda || filtroC
                                            ? 'No se encontraron áreas con ese criterio'
                                            : `No hay áreas ${tabActiva}`}
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
 
export default AreaList;