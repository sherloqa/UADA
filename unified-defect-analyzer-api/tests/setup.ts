import dotenv from 'dotenv';

// Load environment variables before any tests run
dotenv.config();

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Verify MongoDB URI is set
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
});

afterAll(() => {
  // Cleanup
});
