import React, { useState } from 'react';
import TipoColabList   from './TipoColabList';
import TipoColabCreate from './TipoColabCreate';
import TipoColabEdit   from './TipoColabEdit';

const TipoColabPage = ({ vistaActual, onNavegar }) => {
    const [tipoColabEditar, setTipoColabEditar] = useState(null);

    const irALista  = ()  => onNavegar('tipos-colab-listado');
    const irACrear  = ()  => onNavegar('tipos-colab-nuevo');
    const irAEditar = (t) => {
        setTipoColabEditar(t);
        onNavegar('tipos-colab-editar');
    };

    if (vistaActual === 'tipos-colab-nuevo') {
        return <TipoColabCreate onVolver={irALista} />;
    }

    if (vistaActual === 'tipos-colab-editar' && tipoColabEditar) {
        return <TipoColabEdit tipoColab={tipoColabEditar} onVolver={irALista} />;
    }

    return (
        <TipoColabList
            onNuevo={irACrear}
            onEditar={irAEditar}
            onVolver={() => onNavegar('mantenedores')}
        />
    );
};

export default TipoColabPage;