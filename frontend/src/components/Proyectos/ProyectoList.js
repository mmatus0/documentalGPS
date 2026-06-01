import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';
import Modales from '../Shared/Modales';

const ProyectoList = ({ onNuevo, onEditar, onVolver }) => {
    const [proyectos,    setProyectos]    = useState([]);
    const [contratistas, setContratistas] = useState([]);
    const [tabActiva,    setTabActiva]    = useState('activos');
    const [busqueda,     setBusqueda]     = useState('');
    const [filtroC,      setFiltroC]      = useState('');
    const [expandido,    setExpandido]    = useState(null);   // proyectoId expandido
    const [areas,        setAreas]        = useState({});     // { [proyectoId]: [...] }
    const [disponibles,  setDisponibles]  = useState([]);
    const [loadingAreas, setLoadingAreas] = useState(null);
    const [savingArea,   setSavingArea]   = useState(false);
    const [areaSelec,    setAreaSelec]    = useState('');
    const [feedbackArea, setFeedbackArea] = useState(null);
    const [modal, setModal] = useState({
        visible: false, titulo: '', mensaje: '',
        labelConfirmar: '', variante: 'danger', onConfirmar: null,
    });

    const fetchProyectos = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/proyectos');
            setProyectos(data);
        } catch {
            console.error('Error al cargar proyectos');
        }
    }, []);

    useEffect(() => {
        fetchProyectos();
        axios.get('/api/contratistas')
            .then(({ data }) => setContratistas(data.filter(c => c.estado_id === 1)))
            .catch(() => {});
    }, [fetchProyectos]);

    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));

    // ── Desactivar / Reactivar ────────────────────────────────────────────────
    const handleDesactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Proyecto',
            mensaje: `¿Está seguro que desea desactivar el proyecto "${nombre}"? Los expedientes históricos vinculados no se verán afectados.`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/proyectos/${id}`);
                cerrarModal();
                fetchProyectos();
            },
        });
    };

    const handleReactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Reactivar Proyecto',
            mensaje: `¿Desea reactivar el proyecto "${nombre}"?`,
            labelConfirmar: 'Reactivar',
            variante: 'primary',
            onConfirmar: async () => {
                await axios.patch(`/api/proyectos/${id}/reactivar`);
                cerrarModal();
                fetchProyectos();
            },
        });
    };

    // ── Áreas asociadas: expandir / cargar ────────────────────────────────────
    const toggleExpandir = async (proyectoId) => {
        if (expandido === proyectoId) {
            setExpandido(null);
            return;
        }
        setExpandido(proyectoId);
        setAreaSelec('');
        setFeedbackArea(null);
        setLoadingAreas(proyectoId);
        try {
            const [areasRes, dispRes] = await Promise.all([
                axios.get(`/api/proyectos/${proyectoId}/areas`),
                axios.get(`/api/proyectos/${proyectoId}/areas-disponibles`),
            ]);
            setAreas(prev => ({ ...prev, [proyectoId]: areasRes.data }));
            setDisponibles(dispRes.data);
        } catch {
            setFeedbackArea({ type: 'err', msg: 'No se pudieron cargar las áreas' });
        } finally {
            setLoadingAreas(null);
        }
    };

    const recargarAreas = async (proyectoId) => {
        try {
            const [areasRes, dispRes] = await Promise.all([
                axios.get(`/api/proyectos/${proyectoId}/areas`),
                axios.get(`/api/proyectos/${proyectoId}/areas-disponibles`),
            ]);
            setAreas(prev => ({ ...prev, [proyectoId]: areasRes.data }));
            setDisponibles(dispRes.data);
            fetchProyectos(); // actualiza contador
        } catch { /* silencioso */ }
    };

    // ── Áreas: asociar ────────────────────────────────────────────────────────
    const handleAsociar = async (proyectoId) => {
        if (!areaSelec) return;
        setSavingArea(true);
        try {
            await axios.post(`/api/proyectos/${proyectoId}/areas`, { area_id: Number(areaSelec) });
            setAreaSelec('');
            setFeedbackArea({ type: 'ok', msg: 'Área asociada correctamente.' });
            await recargarAreas(proyectoId);
        } catch (err) {
            setFeedbackArea({ type: 'err', msg: err.response?.data?.error || 'Error al asociar el área' });
        } finally {
            setSavingArea(false);
        }
    };

    // ── Áreas: desasociar ─────────────────────────────────────────────────────
    const handleDesasociar = async (proyectoId, asociacionId, areaNombre) => {
        if (!window.confirm(`¿Desasociar "${areaNombre}" de este proyecto?`)) return;
        try {
            await axios.delete(`/api/proyectos/${proyectoId}/areas/${asociacionId}`);
            setFeedbackArea({ type: 'ok', msg: `"${areaNombre}" desasociada correctamente.` });
            await recargarAreas(proyectoId);
        } catch {
            setFeedbackArea({ type: 'err', msg: 'No se pudo desasociar el área.' });
        }
    };

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const listaFiltrada = proyectos
        .filter(p => tabActiva === 'activos' ? p.estado_id === 1 : p.estado_id === 2)
        .filter(p => !filtroC || String(p.contratista_id) === filtroC)
        .filter(p => {
            const q = busqueda.toLowerCase();
            return (
                p.nombre?.toLowerCase().includes(q) ||
                p.contratista_nombre?.toLowerCase().includes(q)
            );
        });

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <button className="btn btn-link btn-sm text-muted p-0 mb-2" onClick={onVolver}>
                        <i className="bi bi-arrow-left me-1" />Volver a Mantenedores
                    </button>
                    <h5 className="fw-bold mb-1">Gestión de Proyectos</h5>
                    <p className="text-muted small mb-0">Proyectos vinculados a contratistas y sus unidades organizativas</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNuevo}>
                    <i className="bi bi-plus-lg me-1" />Nuevo Proyecto
                </button>
            </div>

            <div className="card border">
                <div className="d-flex justify-content-between align-items-center px-4 border-bottom flex-wrap gap-2 py-1">
                    <ul className="nav nav-tabs border-bottom-0">
                        {['activos', 'inactivos'].map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link border-0 ${tabActiva === tab ? 'active fw-semibold' : 'text-muted'}`}
                                    onClick={() => { setTabActiva(tab); setExpandido(null); }}
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
                            placeholder="Buscar proyecto..."
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
                                <th className="small text-muted fw-semibold ps-4" style={{ width: 32 }}></th>
                                <th className="small text-muted fw-semibold">Nombre del Proyecto</th>
                                <th className="small text-muted fw-semibold">Contratista</th>
                                <th className="small text-muted fw-semibold">Fecha Inicio</th>
                                <th className="small text-muted fw-semibold">Áreas</th>
                                <th className="small text-muted fw-semibold">Estado</th>
                                <th className="small text-muted fw-semibold text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-5 small">
                                        {busqueda || filtroC
                                            ? 'No se encontraron proyectos con ese criterio'
                                            : `No hay proyectos ${tabActiva}`}
                                    </td>
                                </tr>
                            ) : (
                                listaFiltrada.map(p => (
                                    <React.Fragment key={p.id}>
                                        {/* Fila del proyecto */}
                                        <tr className={expandido === p.id ? 'table-active' : ''}>
                                            <td className="ps-4">
                                                <button
                                                    className="btn btn-link btn-sm p-0 text-muted"
                                                    onClick={() => toggleExpandir(p.id)}
                                                    title={expandido === p.id ? 'Colapsar áreas' : 'Ver áreas asociadas'}
                                                >
                                                    <i className={`bi ${expandido === p.id ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                                                </button>
                                            </td>
                                            <td>
                                                <div className="small fw-medium">{p.nombre}</div>
                                                {p.descripcion && (
                                                    <div className="text-muted" style={{ fontSize: 11 }}>{p.descripcion}</div>
                                                )}
                                            </td>
                                            <td className="small text-muted">{p.contratista_nombre}</td>
                                            <td className="small text-muted">
                                                {p.fecha_inicio
                                                    ? new Date(p.fecha_inicio).toLocaleDateString('es-CL')
                                                    : '—'}
                                            </td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary">
                                                    {p.total_areas}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${p.estado_id === 1 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                    {p.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="text-end pe-4">
                                                {tabActiva === 'activos' ? (
                                                    <div className="d-flex gap-2 justify-content-end">
                                                        <button className="btn btn-sm btn-outline-warning" onClick={() => onEditar(p)}>
                                                            <i className="bi bi-pencil me-1" />Editar
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDesactivar(p.id, p.nombre)}>
                                                            <i className="bi bi-slash-circle me-1" />Desactivar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleReactivar(p.id, p.nombre)}>
                                                        <i className="bi bi-arrow-clockwise me-1" />Reactivar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Fila expandida: áreas asociadas */}
                                        {expandido === p.id && (
                                            <tr>
                                                <td colSpan="7" className="p-0 border-0">
                                                    <div className="bg-light border-bottom px-5 py-3">
                                                        <div className="d-flex align-items-center gap-2 mb-3">
                                                            <i className="bi bi-diagram-3-fill text-primary" style={{ fontSize: 14 }} />
                                                            <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: '0.05em' }}>
                                                                Unidades Organizativas de {p.nombre}
                                                            </span>
                                                        </div>

                                                        {feedbackArea && (
                                                            <div className={`alert alert-${feedbackArea.type === 'ok' ? 'success' : 'danger'} alert-dismissible py-2 small mb-3`}>
                                                                {feedbackArea.msg}
                                                                <button type="button" className="btn-close" onClick={() => setFeedbackArea(null)} />
                                                            </div>
                                                        )}

                                                        {loadingAreas === p.id ? (
                                                            <div className="text-muted small py-2">
                                                                <span className="spinner-border spinner-border-sm me-2" />Cargando…
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Chips de áreas asociadas */}
                                                                {(areas[p.id] || []).length === 0 ? (
                                                                    <p className="text-muted small mb-3">Sin unidades organizativas asociadas.</p>
                                                                ) : (
                                                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                                                        {(areas[p.id] || []).map(a => (
                                                                            <div
                                                                                key={a.asociacion_id}
                                                                                className="d-flex align-items-center gap-1 px-3 py-1 rounded-pill border bg-white"
                                                                                style={{ fontSize: 12 }}
                                                                            >
                                                                                <span>{a.area_nombre}</span>
                                                                                {tabActiva === 'activos' && (
                                                                                    <button
                                                                                        className="btn btn-link btn-sm p-0 text-danger ms-1"
                                                                                        title="Desasociar área"
                                                                                        onClick={() => handleDesasociar(p.id, a.asociacion_id, a.area_nombre)}
                                                                                    >
                                                                                        <i className="bi bi-x-lg" style={{ fontSize: 11 }} />
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Agregar área (solo proyecto activo) */}
                                                                {tabActiva === 'activos' && (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <select
                                                                            className="form-select form-select-sm"
                                                                            style={{ maxWidth: 280, fontSize: 12 }}
                                                                            value={areaSelec}
                                                                            onChange={e => setAreaSelec(e.target.value)}
                                                                        >
                                                                            <option value="">— Selecciona un área —</option>
                                                                            {disponibles.map(a => (
                                                                                <option key={a.id} value={a.id}>{a.nombre}</option>
                                                                            ))}
                                                                        </select>
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            style={{ fontSize: 12 }}
                                                                            disabled={!areaSelec || savingArea}
                                                                            onClick={() => handleAsociar(p.id)}
                                                                        >
                                                                            <i className="bi bi-plus-lg me-1" />Asociar
                                                                        </button>
                                                                        {disponibles.length === 0 && (
                                                                            <span className="text-muted small">
                                                                                Todas las áreas del contratista ya están asociadas
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
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

export default ProyectoList;