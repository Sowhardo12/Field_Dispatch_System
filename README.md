/backend 
npm run test
npm run test:e2e (check db conn, for 2nd time will face error: do : docker-compose down -v)

registering : 
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dispatcher@example.com",
    "password": "securepassword123",
    "full_name": "Dispatcher One",
    "role": "DISPATCHER"
  }'


  check in running postgres container : 
  docker exec -it dispatch_postgres psql -U postgres -d dispatch_db
  navigate: \dt    -show tables 



FLOW: 

1. Client Creates order status: CREATED
2. Admin/Dispatcher accepts and dispatches status: DISPATCHED 
3. Assigned to a technician status: OFFERED    
4. Technician accepts the order status: IN_PROGRESS    /accept
5. Completed the work status: COMPLETED 
6. finalized by Client or Admin status: CLOSED 



logic Decision: in workorder service, when technician wants to accept an order
what cases should he consider ? 

solution : the technician should only care if the order status is OFFERED, in any
other case, the code should throw an error. 


How do we assign work-order to a technician? on what basis? 
ans: we order the technician with least active work orders, and choose the first one in the list. 

Problem: Does not consider the type of work, and location


The issue was that NestJS couldn't resolve the PG_CONNECTION dependency for PostgresService because when you register a service class directly (providers: [PostgresService]), NestJS has to scan the class at runtime to figure out its dependencies, which sometimes fails due to timing issues or TypeScript metadata problems. I solved it by using an explicit factory provider pattern: instead of letting NestJS figure out the dependencies automatically, I explicitly told it that PostgresService depends on PG_CONNECTION using the inject array, and used a factory function to create the service instance. This made the dependency relationship crystal clear to NestJS, ensured the correct instantiation order (PG_CONNECTION gets created first, then PostgresService), and eliminated any ambiguity in the dependency resolution process.