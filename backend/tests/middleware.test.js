process.env.JWT_SECRET = 'secret_test';
const jwt = require('jsonwebtoken');
const { verificarToken, soloAdmin } = require('../middleware/authMiddleware');

describe('verificarToken', () => {
  it('debe rechazar si no hay token', () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    verificarToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('debe rechazar token inválido', () => {
    const req = { headers: { authorization: 'Bearer tokeninvalido' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    verificarToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('debe aceptar token válido', () => {
    const token = jwt.sign({ id: 1, rol_id: 1 }, 'secret_test');
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    verificarToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

describe('soloAdmin', () => {
  it('debe rechazar si el rol no es administrador', () => {
    const req = { usuario: { rol_id: 2 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    soloAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('debe permitir si el rol es administrador', () => {
    const req = { usuario: { rol_id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    soloAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});