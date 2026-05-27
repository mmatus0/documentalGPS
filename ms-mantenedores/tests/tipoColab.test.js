const request = require('supertest');
const app     = require('../app');

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db = require('../config/db');

beforeEach(() => { db.query.mockReset(); });

// ─────────────────────────────────────────────
// GET /api/tipos-colab
// ─────────────────────────────────────────────
describe('GET /api/tipos-colab', () => {
  it('debe retornar lista de tipos de colaboración', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nombre: 'Revisión Técnica', descripcion: null, estado_id: 1, estado: 'Activo' },
      { id: 2, nombre: 'Visto Bueno',      descripcion: 'Aprobación formal', estado_id: 1, estado: 'Activo' },
    ]]);
    const res = await request(app).get('/api/tipos-colab');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('nombre');
    expect(res.body[0]).toHaveProperty('estado');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/tipos-colab');
    expect(res.statusCode).toBe(500);
  });
});

// ─────────────────────────────────────────────
// POST /api/tipos-colab
// ─────────────────────────────────────────────
describe('POST /api/tipos-colab', () => {
  it('debe crear tipo de colaboración correctamente', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 3 }]);
    const res = await request(app)
      .post('/api/tipos-colab')
      .send({ nombre: 'Revisión Legal', descripcion: 'Revisión por área legal' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 3);
  });

  it('debe crear sin descripción', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 4 }]);
    const res = await request(app)
      .post('/api/tipos-colab')
      .send({ nombre: 'Visto Bueno' });
    expect(res.statusCode).toBe(201);
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app)
      .post('/api/tipos-colab')
      .send({ descripcion: 'Sin nombre' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar si el nombre está vacío', async () => {
    const res = await request(app)
      .post('/api/tipos-colab')
      .send({ nombre: '   ' });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// PUT /api/tipos-colab/:id
// ─────────────────────────────────────────────
describe('PUT /api/tipos-colab/:id', () => {
  it('debe actualizar tipo de colaboración correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/tipos-colab/1')
      .send({ nombre: 'Revisión Técnica Actualizada' });
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 404 si no existe', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .put('/api/tipos-colab/999')
      .send({ nombre: 'No existe' });
    expect(res.statusCode).toBe(404);
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app)
      .put('/api/tipos-colab/1')
      .send({ descripcion: 'Solo descripción' });
    expect(res.statusCode).toBe(400);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/tipos-colab/:id (desactivar)
// ─────────────────────────────────────────────
describe('DELETE /api/tipos-colab/:id', () => {
  it('debe desactivar correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/tipos-colab/1');
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 404 si ya estaba inactivo', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/tipos-colab/1');
    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/tipos-colab/:id/reactivar
// ─────────────────────────────────────────────
describe('PATCH /api/tipos-colab/:id/reactivar', () => {
  it('debe reactivar correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).patch('/api/tipos-colab/1/reactivar');
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 404 si ya estaba activo', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).patch('/api/tipos-colab/1/reactivar');
    expect(res.statusCode).toBe(404);
  });
});