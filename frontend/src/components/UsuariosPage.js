import React, { useState } from 'react';
import UserList   from './UserList';
import UserCreate from './UserCreate';
import UserEdit   from './UserEdit';

/**
 * UsuariosPage
 * La vista se deriva de vistaActual que viene desde App.js.
 * Así el sidebar siempre manda.
 */
const UsuariosPage = ({ vistaActual, onNavegar }) => {
    const [usuarioEditar, setUsuarioEditar] = useState(null);

    const irALista  = ()      => onNavegar('usuarios-listado');
    const irACrear  = ()      => onNavegar('usuarios-nuevo');
    const irAEditar = (user)  => {
        setUsuarioEditar(user);
        onNavegar('usuarios-editar');
    };

    if (vistaActual === 'usuarios-nuevo') {
        return <UserCreate onVolver={irALista} />;
    }

    if (vistaActual === 'usuarios-editar' && usuarioEditar) {
        return <UserEdit usuario={usuarioEditar} onVolver={irALista} />;
    }

    // 'usuarios-listado' o cualquier otro caso
    return <UserList onNuevo={irACrear} onEditar={irAEditar} />;
};

export default UsuariosPage;