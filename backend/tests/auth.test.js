const request = require('supertest');
const app = require('../src/server');

// ── helpers ──────────────────────────────────────────────────────────────────
let accessToken = '';
let refreshToken = '';

const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123',
  firstName: 'Test',
  lastName: 'User',
};

// ── tests ─────────────────────────────────────────────────────────────────────
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
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  test('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword!',
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
    expect(res.body.data.accessToken).toBeDefined();
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
  let token = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    token = res.body.data?.accessToken || '';
  });

  test('GET /api/students/me — returns student profile', async () => {
    const res = await request(app)
      .get('/api/students/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  test('PUT /api/students/me — updates profile', async () => {
    const res = await request(app)
      .put('/api/students/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'Updated bio from test', cgpa: 8.5 });
    expect(res.status).toBe(200);
  });
});

describe('Projects API', () => {
  let token = '';
  let projectId = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    token = res.body.data?.accessToken || '';
  });

  test('POST /api/projects — creates project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Project', description: 'A test project', technologies: ['React', 'Node.js'] });
    expect(res.status).toBe(201);
    projectId = res.body.data.id;
  });

  test('GET /api/projects — lists projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('PUT /api/projects/:id — updates project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Test Project' });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/projects/:id — deletes project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Health check', () => {
  test('GET /health — returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
