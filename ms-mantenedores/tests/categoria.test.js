const request = require('supertest');
const app     = require('../app');

jest.mock('../config/db', () => ({ query: jest.fn() }));
const db = require('../config/db');

beforeEach(() => { db.query.mockReset(); });

// ─────────────────────────────────────────────
// GET /api/categorias
// ─────────────────────────────────────────────
describe('GET /api/categorias', () => {
  it('debe retornar lista de categorías', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nombre: 'Seguridad', descripcion: 'Documentos de seguridad', estado_id: 1, estado: 'Activo', total_subtipos: 2 }
    ]]);
    const res = await request(app).get('/api/categorias');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('total_subtipos');
  });

  it('debe retornar 500 si falla la base de datos', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/categorias');
    expect(res.statusCode).toBe(500);
  });
});

// ─────────────────────────────────────────────
// POST /api/categorias
// ─────────────────────────────────────────────
describe('POST /api/categorias', () => {
  it('debe crear categoría correctamente', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 3 }]);
    const res = await request(app)
      .post('/api/categorias')
      .send({ nombre: 'Calidad', descripcion: 'Documentos ISO' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 3);
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app).post('/api/categorias').send({ descripcion: 'Sin nombre' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('debe crear sin descripción', async () => {
    db.query.mockResolvedValueOnce([{ insertId: 4 }]);
    const res = await request(app).post('/api/categorias').send({ nombre: 'Legal' });
    expect(res.statusCode).toBe(201);
  });
});

// ─────────────────────────────────────────────
// PUT /api/categorias/:id
// ─────────────────────────────────────────────
describe('PUT /api/categorias/:id', () => {
  it('debe actualizar categoría correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/categorias/1')
      .send({ nombre: 'Seguridad Actualizada' });
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 404 si no existe', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app)
      .put('/api/categorias/999')
      .send({ nombre: 'No existe' });
    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/categorias/:id (desactivar)
// ─────────────────────────────────────────────
describe('DELETE /api/categorias/:id', () => {
  it('debe desactivar correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/categorias/1');
    expect(res.statusCode).toBe(200);
  });

  it('debe retornar 404 si ya estaba inactiva', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/categorias/1');
    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// PATCH /api/categorias/:id/reactivar
// ─────────────────────────────────────────────
describe('PATCH /api/categorias/:id/reactivar', () => {
  it('debe reactivar correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).patch('/api/categorias/1/reactivar');
    expect(res.statusCode).toBe(200);
  });
});

// ─────────────────────────────────────────────
// GET /api/categorias/:categoriaId/subtipos
// ─────────────────────────────────────────────
describe('GET /api/categorias/:categoriaId/subtipos', () => {
  it('debe retornar subtipos de la categoría', async () => {
    db.query.mockResolvedValueOnce([[
      { id: 1, nombre: 'Charla 5 min', estado_id: 1, estado: 'Activo' }
    ]]);
    const res = await request(app).get('/api/categorias/1/subtipos');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─────────────────────────────────────────────
// POST /api/categorias/:categoriaId/subtipos
// ─────────────────────────────────────────────
describe('POST /api/categorias/:categoriaId/subtipos', () => {
  it('debe crear subtipo correctamente', async () => {
    db.query.mockResolvedValueOnce([[{ id: 1 }]]);   // categoria existe
    db.query.mockResolvedValueOnce([{ insertId: 5 }]);
    const res = await request(app)
      .post('/api/categorias/1/subtipos')
      .send({ nombre: 'Planos' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id', 5);
  });

  it('debe rechazar si falta el nombre', async () => {
    const res = await request(app)
      .post('/api/categorias/1/subtipos')
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it('debe retornar 404 si la categoría no existe', async () => {
    db.query.mockResolvedValueOnce([[]]); // categoria no encontrada
    const res = await request(app)
      .post('/api/categorias/999/subtipos')
      .send({ nombre: 'Algo' });
    expect(res.statusCode).toBe(404);
  });
});

// ─────────────────────────────────────────────
// PUT /api/categorias/:categoriaId/subtipos/:subtipoId
// ─────────────────────────────────────────────
describe('PUT /api/categorias/:categoriaId/subtipos/:subtipoId', () => {
  it('debe actualizar subtipo correctamente', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app)
      .put('/api/categorias/1/subtipos/1')
      .send({ nombre: 'Planos actualizados' });
    expect(res.statusCode).toBe(200);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/categorias/:categoriaId/subtipos/:subtipoId
// ─────────────────────────────────────────────
describe('DELETE /api/categorias/:categoriaId/subtipos/:subtipoId', () => {
  it('debe desactivar subtipo', async () => {
    db.query.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/categorias/1/subtipos/1');
    expect(res.statusCode).toBe(200);
  });
});