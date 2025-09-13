import { describe, it, expect } from 'vitest';
import { companySchema } from '../src/lib/validators';

describe('companySchema', () => {
  it('requires name', () => {
    expect(() => companySchema.parse({})).toThrow();
  });

  it('parses valid data', () => {
    const data = { name: 'Acme Inc', domain: 'acme.com' };
    expect(companySchema.parse(data)).toEqual(data);
  });
});
