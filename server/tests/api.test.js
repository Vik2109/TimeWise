/**
 * TimeWise API Tests
 * Run: cd server && npm test
 * Uses: Jest + Supertest + MongoDB Memory Server
 *
 * Install test deps:
 * npm install --save-dev jest supertest @shelf/jest-mongodb
 */

const request  = require('supertest');
const mongoose = require('mongoose');
const app      = require('../index');
const User     = require('../models/User');
const Task     = require('../models/Task');

// ── Test helpers ──────────────────────────────────────────────
let authToken = '';
let userId    = '';
let taskId    = '';

const testUser = {
  firstName: 'Test',
  lastName:  'User',
  email:     `test_${Date.now()}@timewise.io`,
  password:  'password123',
};

// ══════════════════════════════════════════════════════════════
//   AUTH TESTS
// ══════════════════════════════════════════════════════════════
describe('Auth API', () => {
  it('POST /api/auth/register — creates a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.password).toBeUndefined(); // password must not be returned

    authToken = res.body.token;
    userId    = res.body.user._id;
  });

  it('POST /api/auth/register — rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register — validates required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.io' }) // missing name + password
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login — authenticates with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('POST /api/auth/login — rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me — returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.user.email).toBe(testUser.email);
  });

  it('GET /api/auth/me — rejects without token', async () => {
    await request(app)
      .get('/api/auth/me')
      .expect(401);
  });

  it('GET /api/auth/me — rejects with invalid token', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123')
      .expect(401);
  });

  it('PUT /api/auth/profile — updates user profile', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ firstName: 'Updated', settings: { pomoDuration: 30 } })
      .expect(200);

    expect(res.body.user.firstName).toBe('Updated');
    expect(res.body.user.settings.pomoDuration).toBe(30);
  });
});

// ══════════════════════════════════════════════════════════════
//   TASKS TESTS
// ══════════════════════════════════════════════════════════════
describe('Tasks API', () => {
  it('GET /api/tasks — returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/tasks — creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title:    'Test Task',
        category: 'Work',
        priority: 'High',
        dueDate:  new Date().toISOString(),
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Test Task');
    expect(res.body.data.user).toBe(userId);
    taskId = res.body.data._id;
  });

  it('POST /api/tasks — rejects task without title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ category: 'Work' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('GET /api/tasks/:id — returns a single task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data._id).toBe(taskId);
    expect(res.body.data.title).toBe('Test Task');
  });

  it('PUT /api/tasks/:id — updates a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Task', priority: 'Low' })
      .expect(200);

    expect(res.body.data.title).toBe('Updated Task');
    expect(res.body.data.priority).toBe('Low');
  });

  it('PATCH /api/tasks/:id/toggle — toggles task completion', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.status).toBe('completed');

    // Toggle back
    const res2 = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res2.body.data.status).toBe('pending');
  });

  it('GET /api/tasks — filters by tab=today', async () => {
    const res = await request(app)
      .get('/api/tasks?tab=today')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/tasks — filters by category', async () => {
    const res = await request(app)
      .get('/api/tasks?category=Work')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    res.body.data.forEach(t => expect(t.category).toBe('Work'));
  });

  it('DELETE /api/tasks/:id — deletes a task', async () => {
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify it's gone
    await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  it('GET /api/tasks/:id — cannot access another user\'s task', async () => {
    // Create second user
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ firstName:'Other', lastName:'User', email:`other_${Date.now()}@test.io`, password:'pass123456' });

    const token2 = res2.body.token;

    // Create task as user 2
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'User 2 task' });

    const user2TaskId = taskRes.body.data._id;

    // User 1 tries to access user 2's task
    await request(app)
      .get(`/api/tasks/${user2TaskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});

// ══════════════════════════════════════════════════════════════
//   HEALTH CHECK
// ══════════════════════════════════════════════════════════════
describe('Health Check', () => {
  it('GET /api/health — returns healthy status', async () => {
    const res = await request(app)
      .get('/api/health')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBeDefined();
    expect(res.body.uptime).toBeGreaterThan(0);
  });
});

// ── Cleanup ───────────────────────────────────────────────────
afterAll(async () => {
  await User.deleteMany({ email: /@timewise\.io|@test\.io/ });
  await Task.deleteMany({});
  await mongoose.connection.close();
});
