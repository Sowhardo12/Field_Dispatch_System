const { io } = require('socket.io-client');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEzLCJlbWFpbCI6InNhZGlhQGdtYWlsLmNvbSIsInJvbGUiOiJDTElFTlQiLCJ0b2tlbklkIjoiMmQ2MTdmNjItZmRjYS00MTZjLWE0YmUtYmQwODRhMGRjMTMyIiwiaWF0IjoxNzg3MzEwMjk0LCJleHAiOjE3ODczMTM4OTR9.VIMvY3TMqdBDe4GAkSxY_sEWbQdXZdgjKnD-tWxiZ7Y';

const socket = io('http://localhost:5000/notifications', {
  query: {
    token,
  },
});

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.log('❌ Connection error:', err.message);
});

socket.on('TECHNICIAN_ALLOCATED', (data) => {
  console.log('🔔 NOTIFICATION RECEIVED:');
  console.log(data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});