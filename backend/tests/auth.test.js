const request = require('supertest');
const app = require('../src/server');
const { pool } = require('../src/config/database');

const testUser = {
  email: `ci_test_${Date.now()}@example.com`,
  password: 'TestPass123',
  firstName: 'CI',
  lastName: 'Tester',
};

let accessToken = '';
let refreshToken = '';
let projectId = '';

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  } catch {}
  await pool.end();
});

describe('Health check', () => {
  test('GET /health — returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Auth API', () => {
  test('POST /api/auth/register — creates a student', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login — returns tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword999',
    });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me — returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testUser.email);
  });

  test('GET /api/auth/me — rejects without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/refresh — issues new tokens', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/logout — succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });
    expect(res.status).toBe(200);
  });
});

describe('Students API', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = res.body.data?.accessToken || '';
  });

  test('GET /api/students/me — returns student profile', async () => {
    const res = await request(app)
      .get('/api/students/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  test('PUT /api/students/me — updates profile', async () => {
    const res = await request(app)
      .put('/api/students/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bio: 'CI test bio', cgpa: 8.5 });
    expect(res.status).toBe(200);
  });
});

describe('Projects API', () => {
  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    accessToken = res.body.data?.accessToken || '';
  });

  test('POST /api/projects — creates project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'CI Test Project', technologies: ['React', 'Node.js'] });
    expect(res.status).toBe(201);
    projectId = res.body.data.id;
  });

  test('GET /api/projects — lists projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('DELETE /api/projects/:id — deletes project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });
});