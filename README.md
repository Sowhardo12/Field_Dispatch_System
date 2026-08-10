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

