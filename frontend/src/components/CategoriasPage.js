import React, { useState } from 'react';
import CategoriaList   from './CategoriaList';
import CategoriaCreate from './CategoriaCreate';
import CategoriaEdit   from './CategoriaEdit';

const CategoriasPage = ({ vistaActual, onNavegar }) => {
    const [categoriaEditar, setCategoriaEditar] = useState(null);

    const irALista  = ()  => onNavegar('categorias-listado');
    const irACrear  = ()  => onNavegar('categorias-nueva');
    const irAEditar = (c) => {
        setCategoriaEditar(c);
        onNavegar('categorias-editar');
    };

    if (vistaActual === 'categorias-nueva') {
        return <CategoriaCreate onVolver={irALista} />;
    }

    if (vistaActual === 'categorias-editar' && categoriaEditar) {
        return <CategoriaEdit categoria={categoriaEditar} onVolver={irALista} />;
    }

    return (
        <CategoriaList
            onNuevo={irACrear}
            onEditar={irAEditar}
        />
    );
};

export default CategoriasPage;