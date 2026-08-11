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


API documentation:  example data is given only
################################################################################
Register :  TESTED
url : localhost:3000/api/v1/auth/register
body: { email: 'client_e2e@test.com', password: 'password123', full_name: 'Client E2E', role: 'CLIENT' }

task: one client, One Dispatcher, One Admin, One Technician creation

-----------------------------------------------------------------------curl code
curl -X POST localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"asir@gmail.com","password":"password123","full_name":"Client","role":"CLIENT"}'

curl -X POST localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"shafim@gmail.com","password":"password123","full_name":"admin","role":"ADMIN"}'

curl -X POST localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ridwan@gmail.com","password":"password123","full_name":"dispatcher","role":"DISPATCHER"}'

curl -X POST localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"siam@gmail.com","password":"password123","full_name":"pipe technician","role":"TECHNICIAN"}'  



################################################################################
Login:  TESTED
url:  localhost:3000/api/v1/auth/login
body: { email: 'dispatcher_e2e@test.com', password: 'password123' }

----------------------------------------------------------------------
///token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImVtYWlsIjoiYXNpckBnbWFpbC5jb20iLCJyb2xlIjoiQ0xJRU5UIiwiaWF0IjoxNzg2NDc2NzgxLCJleHAiOjE3ODY1NjMxODF9.ypCq1lpyLCuw1TFdcl4jcBD7h84mM-vJJ7znO4xAAnY
curl -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"asir@gmail.com","password":"password123"}'


///token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsImVtYWlsIjoic2hhZmltQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NjQ3NjgwMCwiZXhwIjoxNzg2NTYzMjAwfQ.TGt7NsYWDAq0MsQ5rhgiZ2_CTZpCOFefQArsS3crEIg
curl -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shafim@gmail.com","password":"password123"}'


///token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsImVtYWlsIjoicmlkd2FuQGdtYWlsLmNvbSIsInJvbGUiOiJESVNQQVRDSEVSIiwiaWF0IjoxNzg2NDc2ODE0LCJleHAiOjE3ODY1NjMyMTR9.Ela_x9yLyFXp6P3gBJSf16s_Bkr9SCPnDk2sBwFtngI
curl -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ridwan@gmail.com","password":"password123"}'


///token:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoic2lhbUBnbWFpbC5jb20iLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTc4NjQ3NjgyNywiZXhwIjoxNzg2NTYzMjI3fQ.hI3CHM-lUEIDZuEM1atrlHyk6jazPtKKKg6jZLag9y8
curl -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"siam@gmail.com","password":"password123"}'  



################################################################################

Client Creating Order:  
localhost:3000/api/v1/work-orders
body: { title: 'HVAC Repair Unit 4', description: 'AC unit blowing warm air.' } 
Authorization: Bearer Token

client: asir will order something
curl -X POST localhost:3000/api/v1/work-orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjYsImVtYWlsIjoiYXNpckBnbWFpbC5jb20iLCJyb2xlIjoiQ0xJRU5UIiwiaWF0IjoxNzg2NDc2NzgxLCJleHAiOjE3ODY1NjMxODF9.ypCq1lpyLCuw1TFdcl4jcBD7h84mM-vJJ7znO4xAAnY" \
  -H "Content-Type: application/json" \
  -d '{"title":"REPAIR AC","description":"AC unit blowing warm air."}'

response : {"success":true,"data":{"id":8,"title":"REPAIR AC","description":"AC unit blowing warm air.","status":"CREATED","client_id":6,"technician_id":null,"created_at":"2026-08-11T19:36:50.678Z","updated_at":"2026-08-11T19:36:50.678Z"},"error":null,"timestamp":"2026-08-11T19:36:50.689Z"}

################################################################################

Dispatcher Dispatches Work Order 
localhost:3000/api/v1/work-orders/${workOrderId}/dispatch
Authorization: Bearer Token

Dispatcher : {"email":"ridwan@gmail.com","password":"password123"}  this guy 
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsImVtYWlsIjoicmlkd2FuQGdtYWlsLmNvbSIsInJvbGUiOiJESVNQQVRDSEVSIiwiaWF0IjoxNzg2NDc2ODE0LCJleHAiOjE3ODY1NjMyMTR9.Ela_x9yLyFXp6P3gBJSf16s_Bkr9SCPnDk2sBwFtngI

------------------------------------------------------------------------
curl -X PATCH localhost:3000/api/v1/work-orders/8/dispatch \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsImVtYWlsIjoicmlkd2FuQGdtYWlsLmNvbSIsInJvbGUiOiJESVNQQVRDSEVSIiwiaWF0IjoxNzg2NDc2ODE0LCJleHAiOjE3ODY1NjMyMTR9.Ela_x9yLyFXp6P3gBJSf16s_Bkr9SCPnDk2sBwFtngI"


response: {"success":true,"data":{"id":8,"title":"REPAIR AC","description":"AC unit blowing warm air.","status":"DISPATCHED","client_id":6,"technician_id":null,"created_at":"2026-08-11T19:36:50.678Z","updated_at":"2026-08-11T19:42:30.857Z"},"error":null,"timestamp":"2026-08-11T19:42:30.872Z"}

################################################################################
Technician Accepts Work Order
localhost:3000/api/v1/work-orders/${workOrderId}/accept
Authorization: Bearer Token

technician siam will accept
siams token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoic2lhbUBnbWFpbC5jb20iLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTc4NjQ3NjgyNywiZXhwIjoxNzg2NTYzMjI3fQ.hI3CHM-lUEIDZuEM1atrlHyk6jazPtKKKg6jZLag9y8

new: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoic2lhbUBnbWFpbC5jb20iLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTc4NjQ3NzY4OCwiZXhwIjoxNzg2NTY0MDg4fQ.WrHcAh70AeX5z_vmS7iOBurm63dz3XK8q-TZZzdZkPg

curl -X PATCH localhost:3000/api/v1/work-orders/8/accept \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjksImVtYWlsIjoic2lhbUBnbWFpbC5jb20iLCJyb2xlIjoiVEVDSE5JQ0lBTiIsImlhdCI6MTc4NjQ3NzY4OCwiZXhwIjoxNzg2NTY0MDg4fQ.WrHcAh70AeX5z_vmS7iOBurm63dz3XK8q-TZZzdZkPg"



actually technician sajid accepted work-order : 9 ; technician_id: 3 (userid :3) sajid221@gmail.com password: securepassword123 
token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic2FqaWQyMjFAZ21haWwuY29tIiwicm9sZSI6IlRFQ0hOSUNJQU4iLCJpYXQiOjE3ODY0ODEzODIsImV4cCI6MTc4NjU2Nzc4Mn0.69rztwqOM7h20p80YitlXqEiPa26cCDwJPONHHUVyZQ

updated accept code: 
curl -X PATCH localhost:3000/api/v1/work-orders/9/accept \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic2FqaWQyMjFAZ21haWwuY29tIiwicm9sZSI6IlRFQ0hOSUNJQU4iLCJpYXQiOjE3ODY0ODEzODIsImV4cCI6MTc4NjU2Nzc4Mn0.69rztwqOM7h20p80YitlXqEiPa26cCDwJPONHHUVyZQ"

################################################################################
Technician submits execution log to MongoDb 
localhost:3000/api/v1/work-orders/${workOrderId}/logs
body: {
checklists: ['Power verified', 'Capacitor replaced', 'Air pressure tested'],
hardware_metadata: { serial: 'HVAC-9921', refrigerant: 'R410A' },
technician_notes: 'Replaced faulty dual-run capacitor. Unit operating normally.',
}
Authorization: Bearer Token

technician sajids token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic2FqaWQyMjFAZ21haWwuY29tIiwicm9sZSI6IlRFQ0hOSUNJQU4iLCJpYXQiOjE3ODY0ODEzODIsImV4cCI6MTc4NjU2Nzc4Mn0.69rztwqOM7h20p80YitlXqEiPa26cCDwJPONHHUVyZQ


curl -X POST localhost:3000/api/v1/work-orders/9/logs \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic2FqaWQyMjFAZ21haWwuY29tIiwicm9sZSI6IlRFQ0hOSUNJQU4iLCJpYXQiOjE3ODY0ODEzODIsImV4cCI6MTc4NjU2Nzc4Mn0.69rztwqOM7h20p80YitlXqEiPa26cCDwJPONHHUVyZQ" \
  -H "Content-Type: application/json" \
  -d '{"checklists":["DUST removed","fiter cleaned","Air pressure tested"],"hardware_metadata":{"serial":"HVAC-9921","model":"WALTON R410A"},"technician_notes":"Replaced faulty dual-run capacitor. Unit operating normally."}'
################################################################################

Technician Completes Work Order
localhost:3000/api/v1/work-orders/${workOrderId}/complete
Authorization: Bearer Token


curl -X PATCH localhost:3000/api/v1/work-orders/9/complete \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoic2FqaWQyMjFAZ21haWwuY29tIiwicm9sZSI6IlRFQ0hOSUNJQU4iLCJpYXQiOjE3ODY0ODEzODIsImV4cCI6MTc4NjU2Nzc4Mn0.69rztwqOM7h20p80YitlXqEiPa26cCDwJPONHHUVyZQ"
################################################################################
Client Closes Work Order 
localhost:3000/api/v1/work-orders/${workOrderId}/close
Authorization: Bearer Token

admin will close lets say
admin: shafim token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsImVtYWlsIjoic2hhZmltQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NjQ3NjgwMCwiZXhwIjoxNzg2NTYzMjAwfQ.TGt7NsYWDAq0MsQ5rhgiZ2_CTZpCOFefQArsS3crEIg

curl -X PATCH localhost:3000/api/v1/work-orders/9/close \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsImVtYWlsIjoic2hhZmltQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc4NjQ3NjgwMCwiZXhwIjoxNzg2NTYzMjAwfQ.TGt7NsYWDAq0MsQ5rhgiZ2_CTZpCOFefQArsS3crEIg"
################################################################################
################################################################################


FULL simulation passed 



  issue:  to create order, clientId is required, and the clientid is fetched/extracted from the payload 
  of JWT token 

  CLIENT create order -> work-order.controller[create] -> work-order.service[createWorkOrder] -> 
  work-order.repository[create] 

  in work order service: @CurrentUser('id') clientId:number, this decorator gets the clientId
  @CurrentUser('id') clientId:number :-> common/decorator/current-user-decorator.ts file 

  potential bug : if(!request.use) return null;
correct:if(!request.user) return null;  WORKED



another issue: When the Order was dispatched by ADMIN/DISPATCHER, it was needed to be OFFERED before 
being accepted by a TECHNICIAN. So the mechanism was, when order is dispatched, it will be sent on a 
message queue (background queue) and a Consumer (Processor) will pick up (dequeue) the order and process 
it, mark it as OFFERED, and assign it to a technician who has the least number of orders completed so far.
But the queue wasn't working so the order was never going passed the DISPATCHED status. Then noticed the 
table name typo, instead of work_orders i wrote work-orders inside raw SQL query. This wouldn't have happened
if I have used AGENTIC AI or some ORM like typeORM or Prisma. 