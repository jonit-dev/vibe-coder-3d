import { describe, it, expect, beforeEach } from 'vitest';
import { PersistentIdService } from '../PersistentIdService';

describe('PersistentIdService', () => {
  let service: PersistentIdService;

  beforeEach(() => {
    service = new PersistentIdService();
  });

  describe('generate', () => {
    it('should generate a valid UUID v4', () => {
      const id = service.generate();

      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        const id = service.generate();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });
  });

  describe('reserve and release', () => {
    it('should reserve an ID', () => {
      const id = service.generate();
      service.reserve(id);

      expect(service.isReserved(id)).toBe(true);
    });

    it('should release a reserved ID', () => {
      const id = service.generate();
      service.reserve(id);
      service.release(id);

      expect(service.isReserved(id)).toBe(false);
    });

    it('should throw error for invalid ID format', () => {
      expect(() => service.reserve('invalid-id')).toThrow('Invalid persistent ID');
    });

    it('should not be reserved by default', () => {
      const id = service.generate();
      expect(service.isReserved(id)).toBe(false);
    });
  });

  describe('generateUnique', () => {
    it('should generate ID that is not reserved', () => {
      const id1 = service.generate();
      service.reserve(id1);

      const id2 = service.generateUnique();

      expect(id2).not.toBe(id1);
      expect(service.isReserved(id2)).toBe(false);
    });

    it('should throw after 100 attempts if all IDs reserved', () => {
      const originalGenerate = service.generate;
      let callCount = 0;

      service.generate = () => {
        callCount++;
        const id = originalGenerate.call(service);
        service.reserve(id);
        return id;
      };

      expect(() => service.generateUnique()).toThrow('Failed to generate unique ID after 100 attempts');
      expect(callCount).toBe(101);
    });
  });

  describe('clear', () => {
    it('should clear all reservations', () => {
      const id1 = service.generate();
      const id2 = service.generate();

      service.reserve(id1);
      service.reserve(id2);

      expect(service.isReserved(id1)).toBe(true);
      expect(service.isReserved(id2)).toBe(true);

      service.clear();

      expect(service.isReserved(id1)).toBe(false);
      expect(service.isReserved(id2)).toBe(false);
    });
  });
});