import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Authors E2E', () => {
  let app: INestApplication;
  let authorId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /authors', () => {
    it('should create a new author', async () => {
      interface CreateAuthorResponse {
        id: string;
        firstName: string;
        lastName: string;
        bio: string;
        birthDate: string;
      }

      const response = await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Jane',
          lastName: 'Austen',
          bio: 'English novelist',
          birthDate: '1775-12-16',
        })
        .expect(201);

      const body = response.body as CreateAuthorResponse;
      expect(body).toHaveProperty('id');
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Austen');
      authorId = body.id;
    });

    it('should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/authors')
        .send({
          firstName: 'Jane',
        })
        .expect(400);
    });
  });

  describe('GET /authors/:id', () => {
    it('should retrieve the created author', async () => {
      interface AuthorResponse {
        id: string;
        firstName: string;
      }

      const response = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      const body = response.body as AuthorResponse;
      expect(body.id).toBe(authorId);
      expect(body.firstName).toBe('Jane');
    });

    it('should return 404 for non-existent author', async () => {
      await request(app.getHttpServer())
        .get('/authors/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });
  });

  describe('GET /authors', () => {
    it('should return list of authors', async () => {
      interface AuthorListResponse {
        data: unknown[];
        total: number;
        page: number;
        limit: number;
      }

      const response = await request(app.getHttpServer())
        .get('/authors')
        .expect(200);

      const body = response.body as AuthorListResponse;
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('total');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      interface PaginatedResponse {
        page: number;
        limit: number;
        data: unknown[];
        total: number;
      }

      const response = await request(app.getHttpServer())
        .get('/authors?page=1&limit=5')
        .expect(200);

      const body = response.body as PaginatedResponse;
      expect(body.page).toBe(1);
      expect(body.limit).toBe(5);
    });
  });

  describe('PATCH /authors/:id', () => {
    it('should update an author', async () => {
      interface UpdateAuthorResponse {
        bio: string;
      }

      const response = await request(app.getHttpServer())
        .patch(`/authors/${authorId}`)
        .send({
          bio: 'Updated biography',
        })
        .expect(200);

      const body = response.body as UpdateAuthorResponse;
      expect(body.bio).toBe('Updated biography');
    });
  });

  describe('DELETE /authors/:id', () => {
    it('should delete an author', async () => {
      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .expect(204);
    });
  });
});
