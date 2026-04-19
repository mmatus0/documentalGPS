const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/login', () => {
  it('debe rechazar credenciales incorrectas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'noexiste@test.com', contrasenia: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('debe rechazar si faltan campos', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(401);
  });
});