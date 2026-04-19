const request = require('supertest');
const app = require('../app');

describe('GET /api/users', () => {
  it('debe retornar lista de usuarios', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/users', () => {
  it('debe rechazar usuario sin campos requeridos', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({});
    expect(res.statusCode).toBe(500);
  });
});