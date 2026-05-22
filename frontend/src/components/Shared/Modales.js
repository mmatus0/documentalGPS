import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ICONOS = {
    danger:  { emoji: '🗑️', color: '#dc2626' },
    primary: { emoji: '✅', color: '#0f766e' },
};

const ConfirmModal = ({ visible, titulo, mensaje, labelConfirmar = 'Confirmar', variante = 'danger', onConfirmar, onCancelar }) => {
    const icono = ICONOS[variante] || ICONOS.danger;

       return (
        <Modal show={visible} onHide={onCancelar} centered size="sm">
            <Modal.Body className="text-center px-4 pt-4 pb-2">
                <i
                    className={`bi ${icono.icon}`}
                    style={{ fontSize: 52, color: icono.color, display: 'block', marginBottom: 16 }}
                />
                <h5 className="fw-bold mb-2">{titulo}</h5>
                <p className="text-muted small mb-0">{mensaje}</p>
            </Modal.Body>
            <Modal.Footer className="border-0 justify-content-center pb-4 gap-2">
                <Button variant="outline-secondary" onClick={onCancelar} style={{ minWidth: 120 }}>
                    Cancelar
                </Button>
                <Button onClick={onConfirmar} style={{ backgroundColor: icono.color, borderColor: icono.color, minWidth: 120 }}>
                    {labelConfirmar}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmModal;