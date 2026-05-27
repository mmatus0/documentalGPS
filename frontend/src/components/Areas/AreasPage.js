import React, { useState } from 'react';
import AreaList     from './AreaList';
import AreaCreate   from './AreaCreate';
import AreaEdit     from './AreaEdit';
import AreaUsuarios from './AreaUsuarios';

const AreasPage = ({ vistaActual, onNavegar, filtroContratistaId }) => {
    const [areaEditar,   setAreaEditar]   = useState(null);
    const [areaUsuarios, setAreaUsuarios] = useState(null);

    const irALista = () => onNavegar('areas-listado');
    const irACrear = () => onNavegar('areas-nueva');

    const irAEditar = (area) => {
        setAreaEditar(area);
        onNavegar('areas-editar');
    };

    const irAUsuarios = (area) => {
        setAreaUsuarios(area);
        onNavegar('areas-usuarios');
    };

    if (vistaActual === 'areas-nueva') {
        return <AreaCreate onVolver={irALista} />;
    }

    if (vistaActual === 'areas-editar' && areaEditar) {
        return <AreaEdit area={areaEditar} onVolver={irALista} />;
    }

    if (vistaActual === 'areas-usuarios' && areaUsuarios) {
        return (
            <AreaUsuarios
                areaId={areaUsuarios.id}
                areaNombre={areaUsuarios.nombre}
                onVolver={irALista}
            />
        );
    }

    return (
        <AreaList
            onNueva={irACrear}
            onEditar={irAEditar}
            onGestionarUsuarios={irAUsuarios}
            onVolver={() => onNavegar('mantenedores')}
            filtroContratistaId={filtroContratistaId}
        />
    );
};

export default AreasPage;