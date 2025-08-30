import { formatDate, generateId, sleep, debounce, deepMerge } from '../utils';

describe('Utility Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 1, 2024/);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toHaveLength(9);
    });
  });

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let count = 0;
      const increment = () => count++;
      const debouncedIncrement = debounce(increment, 50);

      debouncedIncrement();
      debouncedIncrement();
      debouncedIncrement();

      setTimeout(() => {
        expect(count).toBe(1);
        done();
      }, 100);
    });
  });

  describe('deepMerge', () => {
    it('should merge objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { b: { d: 3 }, e: 4 };
      const result = deepMerge(obj1, obj2);
      
      expect(result).toEqual({
        a: 1,
        b: { c: 2, d: 3 },
        e: 4
      });
    });
  });
});