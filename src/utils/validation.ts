export function required(value: string, label: string, max = 60): string | null {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length > max) return `${label} must be under ${max} characters`;
  return null;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function passwordError(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function isValidTime(hhmm: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm);
}
