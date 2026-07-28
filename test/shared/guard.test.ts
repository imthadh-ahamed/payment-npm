import { describe, expect, it } from 'vitest';

import { ValidationError } from '../../src/shared/errors.js';
import { Guard } from '../../src/shared/guard.js';

describe('Guard', () => {
  describe('notNull', () => {
    it('does not throw for a defined, non-null value', () => {
      expect(() => {
        Guard.notNull(0, 'value');
      }).not.toThrow();
    });

    it('throws ValidationError for null', () => {
      expect(() => {
        Guard.notNull(null, 'value');
      }).toThrow(ValidationError);
    });

    it('throws ValidationError for undefined', () => {
      expect(() => {
        Guard.notNull(undefined, 'value');
      }).toThrow(ValidationError);
    });

    it('includes the field name in the error metadata', () => {
      try {
        Guard.notNull(null, 'email');
        expect.unreachable();
      } catch (error) {
        expect((error as ValidationError).metadata).toEqual({ field: 'email' });
      }
    });
  });

  describe('isDefined', () => {
    it('does not throw for a defined value, including null', () => {
      expect(() => {
        Guard.isDefined(null, 'value');
      }).not.toThrow();
      expect(() => {
        Guard.isDefined(0, 'value');
      }).not.toThrow();
    });

    it('throws ValidationError for undefined', () => {
      expect(() => {
        Guard.isDefined(undefined, 'value');
      }).toThrow(ValidationError);
    });
  });

  describe('notEmpty', () => {
    it('does not throw for a non-empty array or string', () => {
      expect(() => {
        Guard.notEmpty([1], 'items');
      }).not.toThrow();
      expect(() => {
        Guard.notEmpty('a', 'text');
      }).not.toThrow();
    });

    it('throws ValidationError for an empty array or string', () => {
      expect(() => {
        Guard.notEmpty([], 'items');
      }).toThrow(ValidationError);
      expect(() => {
        Guard.notEmpty('', 'text');
      }).toThrow(ValidationError);
    });
  });

  describe('notBlank', () => {
    it('does not throw for a string with non-whitespace characters', () => {
      expect(() => {
        Guard.notBlank('hello', 'text');
      }).not.toThrow();
    });

    it('throws ValidationError for an empty or whitespace-only string', () => {
      expect(() => {
        Guard.notBlank('', 'text');
      }).toThrow(ValidationError);
      expect(() => {
        Guard.notBlank('   ', 'text');
      }).toThrow(ValidationError);
    });
  });

  describe('isPositive', () => {
    it('does not throw for a positive number', () => {
      expect(() => {
        Guard.isPositive(1, 'amount');
      }).not.toThrow();
    });

    it('throws ValidationError for zero or a negative number', () => {
      expect(() => {
        Guard.isPositive(0, 'amount');
      }).toThrow(ValidationError);
      expect(() => {
        Guard.isPositive(-1, 'amount');
      }).toThrow(ValidationError);
    });
  });

  describe('isInteger', () => {
    it('does not throw for an integer', () => {
      expect(() => {
        Guard.isInteger(5, 'count');
      }).not.toThrow();
    });

    it('throws ValidationError for a non-integer number', () => {
      expect(() => {
        Guard.isInteger(5.5, 'count');
      }).toThrow(ValidationError);
    });
  });

  describe('isUUID', () => {
    it('does not throw for a valid UUID', () => {
      expect(() => {
        Guard.isUUID('123e4567-e89b-12d3-a456-426614174000', 'id');
      }).not.toThrow();
    });

    it('throws ValidationError for an invalid UUID', () => {
      expect(() => {
        Guard.isUUID('not-a-uuid', 'id');
      }).toThrow(ValidationError);
    });
  });
});
