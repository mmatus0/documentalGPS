import React, { useState } from 'react';
import TipoDocList   from './TipoDocList';
import TipoDocCreate from './TipoDocCreate';
import TipoDocEdit   from './TipoDocEdit';

const TipoDocPage = ({ vistaActual, onNavegar }) => {
    const [tipoDocEditar, setTipoDocEditar] = useState(null);

    const irALista  = ()  => onNavegar('tipos-doc-listado');
    const irACrear  = ()  => onNavegar('tipos-doc-nuevo');
    const irAEditar = (t) => {
        setTipoDocEditar(t);
        onNavegar('tipos-doc-editar');
    };

    if (vistaActual === 'tipos-doc-nuevo') {
        return <TipoDocCreate onVolver={irALista} />;
    }

    if (vistaActual === 'tipos-doc-editar' && tipoDocEditar) {
        return <TipoDocEdit tipoDoc={tipoDocEditar} onVolver={irALista} />;
    }

    return (
        <TipoDocList
            onNuevo={irACrear}
            onEditar={irAEditar}
        />
    );
};

export default TipoDocPage;