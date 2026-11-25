import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', service: 'saaradhi-api', version: '0.1.0' });
  });

  it('GET /extract/status says whether photo reading is configured', async () => {
    const response = await request(app.getHttpServer()).get('/extract/status').expect(200);
    expect(response.body).toMatchObject({ configured: expect.any(Boolean), demoIds: expect.any(Array) });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('POST /extract/demo/bill returns sample fields', async () => {
    const response = await request(app.getHttpServer()).post('/extract/demo/bill').expect(200);
    expect(response.body).toMatchObject({
      source: 'demo',
      fields: { department: 'APSPDCL', amount: 1850, category: 'financial_utility' },
    });
  });

  it('POST /extract/demo/unknown is a 404', () => {
    return request(app.getHttpServer()).post('/extract/demo/unknown').expect(404);
  });

  it('POST /extract reads plain text without any key', async () => {
    const response = await request(app.getHttpServer())
      .post('/extract')
      .send({
        fileName: 'sample.txt',
        mimeType: 'text/plain',
        dataBase64: Buffer.from('Due date: 30/11/2026\nAmount: Rs. 1,850').toString('base64'),
      })
      .expect(200);

    expect(response.body.fields).toMatchObject({ amount: 1850, due_date: '2026-11-30' });
  });

  it('POST /extract rejects a body with no file', () => {
    return request(app.getHttpServer()).post('/extract').send({ mimeType: 'image/jpeg' }).expect(400);
  });

  it.skipIf(Boolean(process.env.GEMINI_API_KEY))(
    'POST /extract explains that photos need a key',
    async () => {
      const response = await request(app.getHttpServer())
        .post('/extract')
        .send({
          fileName: 'photo.jpg',
          mimeType: 'image/jpeg',
          dataBase64: Buffer.from('not-a-real-photo').toString('base64'),
        })
        .expect(503);

      expect(response.body).toMatchObject({ code: 'not_configured' });
    },
  );

  afterEach(async () => {
    await app.close();
  });
});
