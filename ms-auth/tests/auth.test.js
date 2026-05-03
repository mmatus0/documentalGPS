process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_123';

const request = require('supertest');
const app = require('../app');
const bcrypt = require('bcryptjs');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const db = require('../config/db');

beforeEach(() => {
  db.query.mockReset();
});

describe('POST /api/auth/login', () => {
  it('debe rechazar credenciales incorrectas (usuario no existe)', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'noexiste@test.com', contrasenia: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar si faltan campos', async () => {
    db.query.mockResolvedValueOnce([[]]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(401);
  });

  it('debe rechazar si la contraseña es incorrecta', async () => {
    const hash = await bcrypt.hash('password_correcto', 10);
    db.query.mockResolvedValueOnce([[
      { id: 1, rol_id: 1, nombre_completo: 'Test', correo: 'test@test.com', password_hash: hash, estado_id: 1 }
    ]]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'test@test.com', contrasenia: 'password_incorrecto' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar token si las credenciales son correctas', async () => {
    const hash = await bcrypt.hash('password123', 10);
    db.query.mockResolvedValueOnce([[
      { id: 1, rol_id: 1, nombre_completo: 'Admin', correo: 'admin@test.com', password_hash: hash, estado_id: 1 }
    ]]);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'admin@test.com', contrasenia: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toHaveProperty('correo', 'admin@test.com');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'test@test.com', contrasenia: 'pass' });
    expect(res.statusCode).toBe(500);
  });
});