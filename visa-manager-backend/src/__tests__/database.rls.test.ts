import { Pool } from 'pg';
import pool from '../db';

describe('Database RLS Integration Tests', () => {
  let testPool: Pool;
  let agencyUserId: string;
  let partnerUserId: string;
  let testClientId: number;

  beforeAll(async () => {
    testPool = pool;
    agencyUserId = 'test-agency-' + Date.now();
    partnerUserId = 'test-partner-' + Date.now();
  });

  afterAll(async () => {
    try {
      await testPool.query('DELETE FROM clients WHERE agency_id = $1', [agencyUserId]);
      await testPool.query('DELETE FROM users WHERE clerk_user_id IN ($1, $2)', [agencyUserId, partnerUserId]);
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  });

  beforeEach(async () => {
    await testPool.query(`
      INSERT INTO users (clerk_user_id, email, name, role) 
      VALUES ($1, $2, $3, $4) ON CONFLICT (clerk_user_id) DO NOTHING
    `, [agencyUserId, 'agency@test.com', 'Test Agency', 'agency']);

    const clientResult = await testPool.query(`
      INSERT INTO clients (name, email, visa_type, status, agency_id, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, ['Test Client', 'client@test.com', 'business', 'pending', agencyUserId, agencyUserId, agencyUserId]);

    testClientId = clientResult.rows[0].id;
  });

  afterEach(async () => {
    await testPool.query('DELETE FROM clients WHERE id = $1', [testClientId]);
  });

  describe('Client RLS Policies', () => {
    it('allows agency to access their own clients', async () => {
      await testPool.query(`SET request.jwt.claims = '{"sub": "${agencyUserId}"}'`);

      const result = await testPool.query(
        'SELECT * FROM clients WHERE id = $1',
        [testClientId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].agency_id).toBe(agencyUserId);
    });

    it('prevents agency from accessing other agencies clients', async () => {
      const otherAgencyId = 'other-agency-' + Date.now();
      
      const otherClientResult = await testPool.query(`
        INSERT INTO clients (name, email, visa_type, status, agency_id, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, ['Other Client', 'other@test.com', 'tourist', 'pending', otherAgencyId, otherAgencyId, otherAgencyId]);

      const otherClientId = otherClientResult.rows[0].id;

      try {
        await testPool.query(`SET request.jwt.claims = '{"sub": "${agencyUserId}"}'`);

        const result = await testPool.query(
          'SELECT * FROM clients WHERE id = $1',
          [otherClientId]
        );

        expect(result.rows).toHaveLength(0);
      } finally {
        await testPool.query('DELETE FROM clients WHERE id = $1', [otherClientId]);
      }
    });

    it('enforces RLS on INSERT operations', async () => {
      await testPool.query(`SET request.jwt.claims = '{"sub": "${agencyUserId}"}'`);

      const result = await testPool.query(`
        INSERT INTO clients (name, email, visa_type, status, agency_id, created_by, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, agency_id
      `, ['New Client', 'new@test.com', 'student', 'pending', agencyUserId, agencyUserId, agencyUserId]);

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].agency_id).toBe(agencyUserId);

      await testPool.query('DELETE FROM clients WHERE id = $1', [result.rows[0].id]);
    });
  });

  describe('Auth Schema Functions', () => {
    it('auth.user_id() returns current JWT subject', async () => {
      await testPool.query(`SET request.jwt.claims = '{"sub": "${agencyUserId}"}'`);

      const result = await testPool.query('SELECT auth.user_id() as user_id');

      expect(result.rows[0].user_id).toBe(agencyUserId);
    });
  });
});