const request = require('supertest');
const app = require('../app');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const db = require('../config/db');

beforeEach(() => {
  db.query.mockReset();
});

describe('GET /api/users', () => {
  it('debe retornar lista de usuarios', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nombre_completo: 'Test User', correo: 'test@test.com', rol_id: 1, estado_id: 1 }
    ]]);
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(500);
  });
});

describe('POST /api/users', () => {
  it('debe crear usuario correctamente', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 1 }]);
    const res = await request(app)
      .post('/api/users')
      .send({ nombre: 'Nuevo', correo: 'nuevo@test.com', contrasenia: 'pass123', rol_id: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('debe rechazar usuario sin campos requeridos', async () => {
    db.query.mockRejectedValueOnce(new Error('Campos requeridos faltantes'));
    const res = await request(app)
      .post('/api/users')
      .send({});
    expect(res.statusCode).toBe(500);
  });
});

describe('PUT /api/users/:id', () => {
  it('debe actualizar usuario sin cambiar contraseña', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/users/1')
      .send({ nombre: 'Editado', correo: 'editado@test.com', rol_id: 1, contrasenia: '' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('debe actualizar usuario cambiando contraseña', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/users/1')
      .send({ nombre: 'Editado', correo: 'editado@test.com', rol_id: 1, contrasenia: 'nuevapass123' });
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 500 si falla la actualización', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .put('/api/users/1')
      .send({ nombre: 'Editado', correo: 'editado@test.com', rol_id: 1, contrasenia: '' });
    expect(res.statusCode).toBe(500);
  });
});

describe('DELETE /api/users/:id', () => {
  it('debe desactivar usuario correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/users/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('debe retornar 500 si falla la desactivación', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/users/1');
    expect(res.statusCode).toBe(500);
  });
});