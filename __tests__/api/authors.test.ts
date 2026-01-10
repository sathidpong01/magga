/**
 * Author API Tests
 * 
 * Integration tests for Author API endpoints
 * Run: npx vitest run
 */

import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('Author API', () => {
  describe('GET /api/authors', () => {
    it('should return list of authors', async () => {
      const response = await fetch(`${BASE_URL}/api/authors`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return authors sorted by name', async () => {
      const response = await fetch(`${BASE_URL}/api/authors`);
      const data = await response.json();
      
      if (data.length > 1) {
        const names = data.map((a: { name: string }) => a.name);
        const sorted = [...names].sort();
        expect(names).toEqual(sorted);
      }
      expect(true).toBe(true);
    });
  });

  describe('POST /api/authors', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await fetch(`${BASE_URL}/api/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Author' }),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/authors/:id', () => {
    it('should return 401 for non-admin requests', async () => {
      const response = await fetch(`${BASE_URL}/api/authors/test-id`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/authors/:id', () => {
    it('should return 401 for non-admin requests', async () => {
      const response = await fetch(`${BASE_URL}/api/authors/test-id`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(401);
    });
  });
});
