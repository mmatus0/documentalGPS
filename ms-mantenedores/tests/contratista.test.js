const request = require('supertest');
const app = require('../app');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const db = require('../config/db');

beforeEach(() => {
  db.query.mockReset();
});

// ─────────────────────────────────────────────
// GET /api/contratistas
// ─────────────────────────────────────────────
describe('GET /api/contratistas', () => {
  it('debe retornar lista de contratistas', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nombre: 'Empresa A', rut: '12345678-9', correo_contacto: 'a@a.com', telefono: '999', estado_id: 1, estado: 'Activo' }
    ]]);
    const res = await request(app).get('/api/contratistas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('nombre');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/contratistas');
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

// ─────────────────────────────────────────────
// POST /api/contratistas
// ─────────────────────────────────────────────
describe('POST /api/contratistas', () => {
  it('debe crear contratista correctamente', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 5 }]);
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: 'Nueva Empresa', rut: '98765432-1', correo_contacto: 'c@c.com', telefono: '123' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 5);
    expect(res.body).toHaveProperty('message');
  });

  it('debe crear contratista sin correo ni telefono', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 6 }]);
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: 'Empresa Sin Contacto', rut: '11111111-1' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app)
      .post('/api/contratistas')
      .send({ rut: '12345678-9' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar si falta el RUT', async () => {
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: 'Empresa Sin RUT' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar si el nombre es solo espacios', async () => {
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: '   ', rut: '12345678-9' });
    expect(res.statusCode).toBe(400);
  });

  it('debe retornar 409 si el RUT ya existe', async () => {
    const dupError = new Error('Duplicate entry');
    dupError.code = 'ER_DUP_ENTRY';
    db.query.mockRejectedValueOnce(dupError);
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: 'Empresa Dup', rut: '12345678-9' });
    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .post('/api/contratistas')
      .send({ nombre: 'Empresa Error', rut: '99999999-9' });
    expect(res.statusCode).toBe(500);
  });
});

// ─────────────────────────────────────────────
// PUT /api/contratistas/:id
// ─────────────────────────────────────────────
describe('PUT /api/contratistas/:id', () => {
  it('debe actualizar contratista correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/contratistas/1')
      .send({ nombre: 'Empresa Editada', correo_contacto: 'nuevo@test.com', telefono: '456' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('debe actualizar sin correo ni telefono', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/contratistas/1')
      .send({ nombre: 'Solo Nombre' });
    expect(res.statusCode).toBe(200);
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app)
      .put('/api/contratistas/1')
      .send({ correo_contacto: 'x@x.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar 404 si el contratista no existe', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .put('/api/contratistas/999')
      .send({ nombre: 'No Existe' });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .put('/api/contratistas/1')
      .send({ nombre: 'Error DB' });
    expect(res.statusCode).toBe(500);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/contratistas/:id
// ─────────────────────────────────────────────
describe('DELETE /api/contratistas/:id', () => {
  it('debe desactivar contratista correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .delete('/api/contratistas/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('debe retornar 404 si no existe o ya esta inactivo', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .delete('/api/contratistas/999');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .delete('/api/contratistas/1');
    expect(res.statusCode).toBe(500);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/contratistas/:id/reactivar
// ─────────────────────────────────────────────
describe('PATCH /api/contratistas/:id/reactivar', () => {
  it('debe reactivar contratista correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .patch('/api/contratistas/1/reactivar');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('debe retornar 404 si no existe o ya esta activo', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .patch('/api/contratistas/999/reactivar');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .patch('/api/contratistas/1/reactivar');
    expect(res.statusCode).toBe(500);
  });
});