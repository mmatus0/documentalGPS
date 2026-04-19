import React from 'react';

const ConfirmModal = ({ visible, titulo, mensaje, labelConfirmar = 'Confirmar', 
                        variante = 'danger', onConfirmar, onCancelar }) => {
                            
    if (!visible){
        return null; 
    }

    const btnClass = variante === 'primary' ? 'btn btn-primary' : `btn btn-${variante}`;

    return (
        <div className="modal-overlay" onClick={onCancelar}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-titulo">{titulo}</span>
                    <button className="modal-close" onClick={onCancelar}>✕</button>
                </div>
                <div className="modal-body">
                    <p className="modal-mensaje">{mensaje}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancelar}>Cancelar</button>
                    <button className={btnClass} onClick={onConfirmar}>{labelConfirmar}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;