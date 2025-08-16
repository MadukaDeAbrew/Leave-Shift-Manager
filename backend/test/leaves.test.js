const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function registerAndLogin(email, role = 'user') {
  // create directly via model to avoid extra controller logic in this helper
  const hash = await bcrypt.hash('Passw0rd!', 10);
  const u = await User.create({ name: 'U', email, password: hash, role });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Passw0rd!' });

  return res.body.token;
}

describe('Leaves', () => {
  test('creates and lists leaves for the user', async () => {
    const token = await registerAndLogin('user1@example.com');

    const create = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: '2030-08-20',
        endDate: '2030-08-22',
        reason: 'Family',
        leaveType: 'Annual',
      });
    expect([200, 201]).toContain(create.status);

    const list = await request(app)
      .get('/api/leaves')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBe(1);
    expect(list.body[0].reason).toBe('Family');
  });

  test('rejects update of another user’s leave', async () => {
    const tokenA = await registerAndLogin('a@example.com');
    const tokenB = await registerAndLogin('b@example.com');

    const leave = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        startDate: '2030-08-25',
        endDate: '2030-08-26',
        reason: 'Trip',
        leaveType: 'Annual',
      });

    const upd = await request(app)
      .put(`/api/leaves/${leave.body._id}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ reason: 'Hacked' });

    expect([403, 404]).toContain(upd.status);
  });
});
