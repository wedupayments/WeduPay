import type { RegisterRequest } from './auth.types';

describe('RegisterRequest', () => {
  it('requires email, password, country, and phoneNumber', () => {
    const req: RegisterRequest = {
      email: 'student@example.com',
      password: 'secret123',
      country: 'ZW',
      phoneNumber: '+263771234567',
    };
    expect(req.email).toBe('student@example.com');
    expect(req.phoneNumber).toBe('+263771234567');
  });

  it('accepts an optional role', () => {
    const req: RegisterRequest = {
      email: 'admin@example.com',
      password: 'secret123',
      country: 'ZW',
      phoneNumber: '+263771234567',
      role: 'admin',
    };
    expect(req.role).toBe('admin');
  });

  it('does not include firstName or lastName fields', () => {
    const req: RegisterRequest = {
      email: 'student@example.com',
      password: 'secret123',
      country: 'ZW',
      phoneNumber: '+263771234567',
    };
    expect('firstName' in req).toBe(false);
    expect('lastName' in req).toBe(false);
  });
});
