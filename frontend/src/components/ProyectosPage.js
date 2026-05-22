import React, { useState } from 'react';
import ProyectoList   from './ProyectoList';
import ProyectoCreate from './ProyectoCreate';
import ProyectoEdit   from './ProyectoEdit';

const ProyectosPage = ({ vistaActual, onNavegar }) => {
    const [proyectoEditar, setProyectoEditar] = useState(null);

    const irALista  = ()  => onNavegar('proyectos-listado');
    const irACrear  = ()  => onNavegar('proyectos-nuevo');
    const irAEditar = (p) => {
        setProyectoEditar(p);
        onNavegar('proyectos-editar');
    };

    if (vistaActual === 'proyectos-nuevo') {
        return <ProyectoCreate onVolver={irALista} />;
    }

    if (vistaActual === 'proyectos-editar' && proyectoEditar) {
        return <ProyectoEdit proyecto={proyectoEditar} onVolver={irALista} />;
    }

    return (
        <ProyectoList
            onNuevo={irACrear}
            onEditar={irAEditar}
        />
    );
};

export default ProyectosPage;