import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Auth', () => {
    it('/api/v1/auth/register (POST) - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com',
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.username).toBe('testuser');
    });

    it('/api/v1/auth/login (POST) - should login and return tokens', async () => {
      // 先注册
      await request(app.getHttpServer()).post('/api/v1/auth/register').send({
        username: 'logintest',
        password: 'password123',
      });

      // 再登录
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          username: 'logintest',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
    });
  });
});
