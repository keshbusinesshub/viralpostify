import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Viralpostify API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let apiKey: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('POST /api/auth/login - should login admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@viralpostify.com', password: 'admin123456' })
        .expect(201);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.email).toBe('admin@viralpostify.com');
      accessToken = res.body.accessToken;
    });

    it('POST /api/auth/login - should reject wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'admin@viralpostify.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /api/auth/me - should return user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe('admin@viralpostify.com');
      expect(res.body.role).toBe('ADMIN');
    });

    it('GET /api/auth/me - should reject without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });
  });

  describe('API Keys', () => {
    it('POST /api/api-keys - should create an API key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'E2E Test Key' })
        .expect(201);

      expect(res.body.key).toMatch(/^kp_live_/);
      expect(res.body.name).toBe('E2E Test Key');
      apiKey = res.body.key;
    });

    it('GET /api/api-keys - should list keys', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('API Key Authentication', () => {
    it('GET /api/accounts - should work with API key', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/accounts')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/accounts - should reject invalid API key', async () => {
      await request(app.getHttpServer())
        .get('/api/accounts')
        .set('x-api-key', 'kp_live_invalid_key')
        .expect(401);
    });

    it('GET /api/accounts - should reject without auth', async () => {
      await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(401);
    });
  });

  describe('Posts via API Key', () => {
    let postId: string;

    it('POST /api/posts - should create post via API key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set('x-api-key', apiKey)
        .send({ content: 'E2E test post', platform: 'twitter' })
        .expect(201);

      expect(res.body.content).toBe('E2E test post');
      expect(res.body.status).toBe('DRAFT');
      postId = res.body.id;
    });

    it('GET /api/posts - should list posts via API key', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts')
        .set('x-api-key', apiKey)
        .expect(200);

      expect(res.body.posts.length).toBeGreaterThan(0);
    });

    it('DELETE /api/posts/:id - should delete post via API key', async () => {
      await request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set('x-api-key', apiKey)
        .expect(200);
    });
  });

  describe('Validation', () => {
    it('POST /api/auth/register - should reject invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('POST /api/posts - should reject empty content', async () => {
      await request(app.getHttpServer())
        .post('/api/posts')
        .set('x-api-key', apiKey)
        .send({ platform: 'twitter' })
        .expect(400);
    });
  });
});
