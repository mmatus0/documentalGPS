import React, { useEffect, useState, useCallback } from 'react';
import axios from '../services/axiosConfig';
import Modales from './Modales';

const CategoriaList = ({ onNuevo, onEditar }) => {
    const [categorias,   setCategorias]   = useState([]);
    const [tabActiva,    setTabActiva]    = useState('activos');
    const [busqueda,     setBusqueda]     = useState('');
    const [expandida,    setExpandida]    = useState(null);   // categoriaId expandida
    const [subtipos,     setSubtipos]     = useState({});     // { [categoriaId]: [...] }
    const [loadingSub,   setLoadingSub]   = useState(null);
    const [nuevoSub,     setNuevoSub]     = useState('');
    const [editandoSub,  setEditandoSub]  = useState(null);   // { id, nombre, categoriaId }
    const [errorSub,     setErrorSub]     = useState('');
    const [modal, setModal] = useState({
        visible: false, titulo: '', mensaje: '',
        labelConfirmar: '', variante: 'danger', onConfirmar: null,
    });

    const fetchCategorias = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/categorias');
            setCategorias(data);
        } catch {
            console.error('Error al cargar categorías');
        }
    }, []);

    useEffect(() => { fetchCategorias(); }, [fetchCategorias]);

    const cerrarModal = () => setModal(m => ({ ...m, visible: false }));

    // ── Categoría: desactivar / reactivar ──────────────────────────────────────
    const handleDesactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Categoría',
            mensaje: `¿Desea desactivar "${nombre}"? Los expedientes que la usan no se verán afectados.`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/categorias/${id}`);
                cerrarModal();
                fetchCategorias();
            },
        });
    };

    const handleReactivar = (id, nombre) => {
        setModal({
            visible: true,
            titulo:  'Reactivar Categoría',
            mensaje: `¿Desea reactivar "${nombre}"?`,
            labelConfirmar: 'Reactivar',
            variante: 'primary',
            onConfirmar: async () => {
                await axios.patch(`/api/categorias/${id}/reactivar`);
                cerrarModal();
                fetchCategorias();
            },
        });
    };

    // ── Subtipos: expandir / cargar ────────────────────────────────────────────
    const toggleExpandir = async (categoriaId) => {
        if (expandida === categoriaId) {
            setExpandida(null);
            return;
        }
        setExpandida(categoriaId);
        setNuevoSub('');
        setEditandoSub(null);
        setErrorSub('');
        if (!subtipos[categoriaId]) {
            setLoadingSub(categoriaId);
            try {
                const { data } = await axios.get(`/api/categorias/${categoriaId}/subtipos`);
                setSubtipos(prev => ({ ...prev, [categoriaId]: data }));
            } catch {
                setErrorSub('No se pudieron cargar los subtipos');
            } finally {
                setLoadingSub(null);
            }
        }
    };

    const recargarSubtipos = async (categoriaId) => {
        try {
            const { data } = await axios.get(`/api/categorias/${categoriaId}/subtipos`);
            setSubtipos(prev => ({ ...prev, [categoriaId]: data }));
            fetchCategorias(); // actualiza contador
        } catch { /* silencioso */ }
    };

    // ── Subtipos: crear ────────────────────────────────────────────────────────
    const handleCrearSubtipo = async (categoriaId) => {
        if (!nuevoSub.trim()) { setErrorSub('El nombre no puede estar vacío'); return; }
        try {
            await axios.post(`/api/categorias/${categoriaId}/subtipos`, { nombre: nuevoSub.trim() });
            setNuevoSub('');
            setErrorSub('');
            await recargarSubtipos(categoriaId);
        } catch (err) {
            setErrorSub(err.response?.data?.error || 'Error al crear subtipo');
        }
    };

    // ── Subtipos: editar inline ────────────────────────────────────────────────
    const handleGuardarEdicion = async (categoriaId, subtipoId, nuevoNombre) => {
        if (!nuevoNombre.trim()) return;
        try {
            await axios.put(`/api/categorias/${categoriaId}/subtipos/${subtipoId}`, { nombre: nuevoNombre.trim() });
            setEditandoSub(null);
            await recargarSubtipos(categoriaId);
        } catch (err) {
            setErrorSub(err.response?.data?.error || 'Error al editar subtipo');
        }
    };

    // ── Subtipos: desactivar / reactivar ───────────────────────────────────────
    const handleDesactivarSub = (categoriaId, subtipoId, nombre) => {
        setModal({
            visible: true,
            titulo:  'Desactivar Subtipo',
            mensaje: `¿Desea desactivar el subtipo "${nombre}"?`,
            labelConfirmar: 'Desactivar',
            variante: 'danger',
            onConfirmar: async () => {
                await axios.delete(`/api/categorias/${categoriaId}/subtipos/${subtipoId}`);
                cerrarModal();
                await recargarSubtipos(categoriaId);
            },
        });
    };

    const handleReactivarSub = async (categoriaId, subtipoId) => {
        await axios.patch(`/api/categorias/${categoriaId}/subtipos/${subtipoId}/reactivar`);
        await recargarSubtipos(categoriaId);
    };

    // ── Filtrado ───────────────────────────────────────────────────────────────
    const listaFiltrada = categorias
        .filter(c => tabActiva === 'activos' ? c.estado_id === 1 : c.estado_id === 2)
        .filter(c => c.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

    return (
        <>
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Categorías y Subtipos</h5>
                    <p className="text-muted small mb-0">
                        Clasifica los documentos del sistema. Cada categoría puede tener múltiples subtipos.
                    </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onNuevo}>
                    <i className="bi bi-plus-lg me-1" />Nueva Categoría
                </button>
            </div>

            <div className="card border">
                <div className="d-flex justify-content-between align-items-center px-4 border-bottom">
                    <ul className="nav nav-tabs border-bottom-0">
                        {['activos', 'inactivos'].map(tab => (
                            <li className="nav-item" key={tab}>
                                <button
                                    className={`nav-link border-0 ${tabActiva === tab ? 'active fw-semibold' : 'text-muted'}`}
                                    onClick={() => { setTabActiva(tab); setExpandida(null); }}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Buscar categoría..."
                        style={{ maxWidth: 240 }}
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th className="small text-muted fw-semibold ps-4" style={{ width: 32 }}></th>
                                <th className="small text-muted fw-semibold">Nombre</th>
                                <th className="small text-muted fw-semibold">Descripción</th>
                                <th className="small text-muted fw-semibold">Subtipos activos</th>
                                <th className="small text-muted fw-semibold text-end pe-4">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listaFiltrada.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-5 small">
                                        {busqueda
                                            ? 'No se encontraron categorías con ese criterio'
                                            : `No hay categorías ${tabActiva}`}
                                    </td>
                                </tr>
                            ) : (
                                listaFiltrada.map(c => (
                                    <React.Fragment key={c.id}>
                                        {/* Fila de categoría */}
                                        <tr className={expandida === c.id ? 'table-active' : ''}>
                                            <td className="ps-4">
                                                <button
                                                    className="btn btn-link btn-sm p-0 text-muted"
                                                    onClick={() => toggleExpandir(c.id)}
                                                    title={expandida === c.id ? 'Colapsar subtipos' : 'Ver subtipos'}
                                                >
                                                    <i className={`bi ${expandida === c.id ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                                                </button>
                                            </td>
                                            <td className="small fw-medium">{c.nombre}</td>
                                            <td className="small text-muted">{c.descripcion || '—'}</td>
                                            <td>
                                                <span className="badge bg-primary-subtle text-primary">
                                                    {c.total_subtipos}
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

                                        {/* Fila expandida: gestión de subtipos */}
                                        {expandida === c.id && (
                                            <tr>
                                                <td colSpan="5" className="p-0 border-0">
                                                    <div className="bg-light border-bottom px-5 py-3">
                                                        <div className="d-flex align-items-center gap-2 mb-3">
                                                            <i className="bi bi-tags-fill text-primary" style={{ fontSize: 14 }} />
                                                            <span className="small fw-semibold text-muted text-uppercase" style={{ letterSpacing: '0.05em' }}>
                                                                Subtipos de {c.nombre}
                                                            </span>
                                                        </div>

                                                        {loadingSub === c.id ? (
                                                            <div className="text-muted small py-2">
                                                                <span className="spinner-border spinner-border-sm me-2" />Cargando…
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Lista de subtipos */}
                                                                {(subtipos[c.id] || []).length === 0 ? (
                                                                    <p className="text-muted small mb-3">Sin subtipos registrados.</p>
                                                                ) : (
                                                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                                                        {(subtipos[c.id] || []).map(s => (
                                                                            <div
                                                                                key={s.id}
                                                                                className={`d-flex align-items-center gap-1 px-3 py-1 rounded-pill border ${s.estado_id === 1 ? 'bg-white' : 'bg-secondary-subtle text-muted'}`}
                                                                                style={{ fontSize: 12 }}
                                                                            >
                                                                                {editandoSub?.id === s.id ? (
                                                                                    <>
                                                                                        <input
                                                                                            type="text"
                                                                                            className="form-control form-control-sm py-0"
                                                                                            style={{ fontSize: 12, width: 140, height: 24 }}
                                                                                            value={editandoSub.nombre}
                                                                                            autoFocus
                                                                                            onChange={e => setEditandoSub({ ...editandoSub, nombre: e.target.value })}
                                                                                            onKeyDown={e => {
                                                                                                if (e.key === 'Enter') handleGuardarEdicion(c.id, s.id, editandoSub.nombre);
                                                                                                if (e.key === 'Escape') setEditandoSub(null);
                                                                                            }}
                                                                                        />
                                                                                        <button className="btn btn-link btn-sm p-0 text-success" onClick={() => handleGuardarEdicion(c.id, s.id, editandoSub.nombre)}>
                                                                                            <i className="bi bi-check-lg" />
                                                                                        </button>
                                                                                        <button className="btn btn-link btn-sm p-0 text-muted" onClick={() => setEditandoSub(null)}>
                                                                                            <i className="bi bi-x-lg" />
                                                                                        </button>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <span>{s.nombre}</span>
                                                                                        {s.estado_id === 2 && (
                                                                                            <span className="badge bg-secondary ms-1" style={{ fontSize: 9 }}>inactivo</span>
                                                                                        )}
                                                                                        {s.estado_id === 1 && (
                                                                                            <button
                                                                                                className="btn btn-link btn-sm p-0 ms-1 text-warning"
                                                                                                title="Editar subtipo"
                                                                                                onClick={() => setEditandoSub({ id: s.id, nombre: s.nombre, categoriaId: c.id })}
                                                                                            >
                                                                                                <i className="bi bi-pencil" style={{ fontSize: 11 }} />
                                                                                            </button>
                                                                                        )}
                                                                                        {s.estado_id === 1 ? (
                                                                                            <button
                                                                                                className="btn btn-link btn-sm p-0 text-danger"
                                                                                                title="Desactivar"
                                                                                                onClick={() => handleDesactivarSub(c.id, s.id, s.nombre)}
                                                                                            >
                                                                                                <i className="bi bi-dash-circle" style={{ fontSize: 11 }} />
                                                                                            </button>
                                                                                        ) : (
                                                                                            <button
                                                                                                className="btn btn-link btn-sm p-0 text-success"
                                                                                                title="Reactivar"
                                                                                                onClick={() => handleReactivarSub(c.id, s.id)}
                                                                                            >
                                                                                                <i className="bi bi-arrow-clockwise" style={{ fontSize: 11 }} />
                                                                                            </button>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Agregar subtipo inline (solo si categoría activa) */}
                                                                {tabActiva === 'activos' && (
                                                                    <div className="d-flex align-items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className={`form-control form-control-sm ${errorSub ? 'is-invalid' : ''}`}
                                                                            style={{ maxWidth: 240, fontSize: 12 }}
                                                                            placeholder="Nombre del nuevo subtipo…"
                                                                            value={nuevoSub}
                                                                            onChange={e => { setNuevoSub(e.target.value); setErrorSub(''); }}
                                                                            onKeyDown={e => e.key === 'Enter' && handleCrearSubtipo(c.id)}
                                                                        />
                                                                        <button
                                                                            className="btn btn-sm btn-outline-primary"
                                                                            style={{ fontSize: 12 }}
                                                                            onClick={() => handleCrearSubtipo(c.id)}
                                                                        >
                                                                            <i className="bi bi-plus-lg me-1" />Agregar
                                                                        </button>
                                                                        {errorSub && (
                                                                            <span className="text-danger small">{errorSub}</span>
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

export default CategoriaList;