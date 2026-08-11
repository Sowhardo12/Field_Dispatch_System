import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Field Dispatch Marketplace Lifecycle (e2e)', () => {
  let app: INestApplication;

  let clientToken: string;
  let dispatcherToken: string;
  let technicianToken: string;
  let workOrderId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('1. Register Users for Each Role', async () => {
    // Client
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'client_e2e@test.com', password: 'password123', full_name: 'Client E2E', role: 'CLIENT' })
      .expect(201);

    // Dispatcher
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'dispatcher_e2e@test.com', password: 'password123', full_name: 'Dispatcher E2E', role: 'DISPATCHER' })
      .expect(201);

    // Technician
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'tech_e2e@test.com', password: 'password123', full_name: 'Tech E2E', role: 'TECHNICIAN' })
      .expect(201);
  });

  it('2. Login and Obtain Access Tokens', async () => {
    const clientLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'client_e2e@test.com', password: 'password123' })
      .expect(200);
    clientToken = clientLogin.body.data.access_token;

    const dispatcherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'dispatcher_e2e@test.com', password: 'password123' })
      .expect(200);
    dispatcherToken = dispatcherLogin.body.data.access_token;

    const techLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'tech_e2e@test.com', password: 'password123' })
      .expect(200);
    technicianToken = techLogin.body.data.access_token;
  });

  it('3. Client Creates Work Order (CREATED state)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/work-orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ title: 'HVAC Repair Unit 4', description: 'AC unit blowing warm air.' })
      .expect(201);
    
    console.log('Create Work Order Response:', {
    status: res.status,
    body: res.body
    });

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CREATED');
    workOrderId = res.body.data.id;
     console.log('Work Order ID created:', workOrderId);
  });

  it('4. Dispatcher Dispatches Work Order (DISPATCHED state)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/work-orders/${workOrderId}/dispatch`)
      .set('Authorization', `Bearer ${dispatcherToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DISPATCHED');
  });

  it('5. Technician Accepts Work Order (IN_PROGRESS state)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/work-orders/${workOrderId}/accept`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('6. Technician Submits Execution Log to MongoDB', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/work-orders/${workOrderId}/logs`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .send({
        checklists: ['Power verified', 'Capacitor replaced', 'Air pressure tested'],
        hardware_metadata: { serial: 'HVAC-9921', refrigerant: 'R410A' },
        technician_notes: 'Replaced faulty dual-run capacitor. Unit operating normally.',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.work_order_id).toBe(workOrderId);
  });

  it('7. Technician Completes Work Order (COMPLETED state)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/work-orders/${workOrderId}/complete`)
      .set('Authorization', `Bearer ${technicianToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('8. Client Closes Work Order (CLOSED state)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/work-orders/${workOrderId}/close`)
      .set('Authorization', `Bearer ${clientToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('CLOSED');
  });
});