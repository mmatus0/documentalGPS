import React, { useState } from 'react';
import ContratistaList   from './ContratistaList';
import ContratistaCreate from './ContratistaCreate';
import ContratistaEdit   from './ContratistaEdit';

/**
 * Sigue la misma metodología que UsuariosPage
 */
const ContratistasPage = ({ vistaActual, onNavegar }) => {
    const [contratistaEditar, setContratistaEditar] = useState(null);

    const irALista  = ()  => onNavegar('contratistas-listado');
    const irACrear  = ()  => onNavegar('contratistas-nuevo');
    const irAEditar = (c) => {
        setContratistaEditar(c);
        onNavegar('contratistas-editar');
    };

    if (vistaActual === 'contratistas-nuevo') {
        return <ContratistaCreate onVolver={irALista} />;
    }

    if (vistaActual === 'contratistas-editar' && contratistaEditar) {
        return <ContratistaEdit contratista={contratistaEditar} onVolver={irALista} />;
    }

    return <ContratistaList onNuevo={irACrear} onEditar={irAEditar} />;
};

export default ContratistasPage;