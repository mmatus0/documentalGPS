import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';
import Modales from '../Shared/Modales';

const TipoDocList = ({ onNuevo, onEditar }) => {
    const [tipos,     setTipos]     = useState([]);
    const [tabActiva, setTabActiva] = useState('activos');
    const [busqueda,  setBusqueda]  = useState('');
    const [modal, setModal] = useState({
        visible: false, titulo: '', mensaje: '',
        labelConfirmar: '', variante: 'danger', onConfirmar: null,
    });

    const fetchTipos = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/tipos-doc');
            setTipos(data);
        } catch {
            console.error('Error al cargar tipos de documento');
        }
    }, []);

    useEffect(() => { fetchTipos(); }, [fetchTipos]);

    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));

    const handleDesactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Tipo de Documento',
            mensaje: `¿Desea desactivar "${nombre}"? Los expedientes que lo usan no se verán afectados.`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/tipos-doc/${id}`);
                cerrarModal();
                fetchTipos();
            },
        });
    };

    const handleReactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Reactivar Tipo de Documento',
            mensaje: `¿Desea reactivar "${nombre}"?`,
            labelConfirmar: 'Reactivar',
            variante: 'primary',
            onConfirmar: async () => {
                await axios.patch(`/api/tipos-doc/${id}/reactivar`);
                cerrarModal();
                fetchTipos();
            },
        });
    };

    const listaFiltrada = tipos
        .filter(t => tabActiva === 'activos' ? t.estado_id === 1 : t.estado_id === 2)
        .filter(t => t.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Tipos de Documento</h5>
                    <p className="text-muted small mb-0">
                        Define los tipos de documentos aceptados en el sistema (Carta, Oficio, Memo, etc.).
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNuevo}>
                    <i className="bi bi-plus-lg me-1" />Nuevo Tipo
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
                        placeholder="Buscar tipo de documento..."
                        style={{ maxWidth: 240 }}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="small text-muted fw-semibold ps-4">Nombre</th>
                                <th className="small text-muted fw-semibold">Descripción</th>
                                <th className="small text-muted fw-semibold text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center text-muted py-5 small">
                                        {busqueda
                                            ? 'No se encontraron tipos de documento con ese criterio'
                                            : `No hay tipos de documento ${tabActiva}`}
                                    </td>
                                </tr>
                            ) : (
                                listaFiltrada.map(t => (
                                    <tr key={t.id}>
                                        <td className="small fw-medium ps-4">{t.nombre}</td>
                                        <td className="small text-muted">{t.descripcion || '—'}</td>
                                        <td className="text-end pe-4">
                                            {tabActiva === 'activos' ? (
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button className="btn btn-sm btn-outline-warning" onClick={() => onEditar(t)}>
                                                        <i className="bi bi-pencil me-1" />Editar
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(t.id, t.nombre)}>
                                                        <i className="bi bi-slash-circle me-1" />Desactivar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(t.id, t.nombre)}>
                                                    <i className="bi bi-arrow-clockwise me-1" />Reactivar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modales {...modal} onCancelar={cerrarModal} />
        </>
    );
};

export default TipoDocList;