import React, { useState } from 'react';
import VisadorList   from './VisadorList';
import VisadorCreate from './VisadorCreate';
import VisadorEdit   from './VisadorEdit';

const VisadoresPage = ({ onVolver }) => {
  const [vista,            setVista]            = useState('listado');
  const [visadorEditando,  setVisadorEditando]  = useState(null);

  const handleEditar = (visador) => {
    setVisadorEditando(visador);
    setVista('editar');
  };

  const handleVolver = () => {
    setVisadorEditando(null);
    setVista('listado');
  };

  if (vista === 'nuevo')  return <VisadorCreate onVolver={handleVolver} />;
  if (vista === 'editar' && visadorEditando)
    return <VisadorEdit visador={visadorEditando} onVolver={handleVolver} />;

  return (
    <>
      <div className="mb-3">
        <button className="btn btn-sm btn-outline-secondary" onClick={onVolver}>
          <i className="bi bi-arrow-left me-1" />Volver a Mantenedores
        </button>
      </div>
      <VisadorList
        onNuevo={() => setVista('nuevo')}
        onEditar={handleEditar}
      />
    </>
  );
};

export default VisadoresPage;