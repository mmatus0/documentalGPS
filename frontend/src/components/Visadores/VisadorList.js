import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../services/axiosConfig';

const VisadorList = ({ onNuevo, onEditar }) => {
  const [visadores, setVisadores] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState('');
  const [eliminando, setEliminando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const res = await axios.get('/api/visadores');
      setVisadores((res.data || []).filter(v => v.estado_id === 1));
    } catch { setError('Error al cargar los visadores'); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const handleDesactivar = async (id, nombre) => {
    if (!window.confirm(`¿Desactivar al visador ${nombre}?`)) return;
    try {
      setEliminando(id);
      await axios.delete(`/api/visadores/${id}`);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al desactivar');
    } finally { setEliminando(null); }
  };

  if (cargando) return (
    <div className="text-center py-5 text-muted">
      <span className="spinner-border spinner-border-sm me-2" />Cargando visadores...
    </div>
  );

  if (error) return <div className="alert alert-danger py-2 small">{error}</div>;

  return (
    <>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h5 className="fw-bold mb-1">
            <i className="bi bi-person-badge me-2" style={{ color: 'var(--primary)' }} />
            Visadores
          </h5>
          <p className="text-muted small mb-0">Usuarios habilitados para realizar visaciones en áreas específicas</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNuevo}>
          <i className="bi bi-plus-lg me-1" />Nuevo Visador
        </button>
      </div>

      {visadores.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-person-badge d-block mb-2" style={{ fontSize: 36 }} />
          <div className="small">No hay visadores registrados</div>
          <button className="btn btn-primary btn-sm mt-3" onClick={onNuevo}>
            <i className="bi bi-plus-lg me-1" />Registrar primero
          </button>
        </div>
      ) : (
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
              <thead style={{ background: '#f8fafc', fontSize: 11 }}>
                <tr>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Usuario</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Cargo</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Área</th>
                  <th className="px-3 py-3 text-muted fw-semibold" style={{ textTransform: 'uppercase', letterSpacing: '.05em' }}>Contratista</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {visadores.map(v => (
                  <tr key={v.id}>
                    <td className="px-3 py-3">
                      <div className="fw-medium">{v.usuario_nombre}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{v.usuario_correo}</div>
                    </td>
                    <td className="px-3 py-3 text-muted small">{v.cargo || <span className="text-muted">—</span>}</td>
                    <td className="px-3 py-3 small">{v.area_nombre}</td>
                    <td className="px-3 py-3 small text-muted">{v.contratista_nombre}</td>
                    <td className="px-3 py-3">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => onEditar(v)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-sm btn-outline-danger"
                          disabled={eliminando === v.id}
                          onClick={() => handleDesactivar(v.id, v.usuario_nombre)}>
                          {eliminando === v.id
                            ? <span className="spinner-border spinner-border-sm" />
                            : <i className="bi bi-trash" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default VisadorList;