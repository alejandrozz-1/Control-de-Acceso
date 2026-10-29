export interface PasswordPolicySubject {
  full_name: string;
  email: string | null;
  employee_code: string | null;
}

export interface PasswordPolicyResult {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  allowedCharacters: boolean;
  avoidsPersonalInfo: boolean;
}

const SPECIAL_CHARACTER = /[!@#$%^&*()_+=\x5B\x5D{}:;,?/|~-]/;
const ALLOWED_CHARACTERS = /^[\p{L}\p{N}!@#$%^&*()_+=\x5B\x5D{}:;,?/|~-]+$/u;

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function personalTokens(subject: PasswordPolicySubject): string[] {
  const emailName = subject.email?.split('@')[0] ?? '';
  return [subject.full_name, subject.employee_code ?? '', emailName]
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .filter((token) => token.length >= 3);
}

export function checkPasswordPolicy(
  password: string,
  subject: PasswordPolicySubject,
): PasswordPolicyResult {
  const normalizedPassword = normalize(password);
  return {
    minLength: Array.from(password).length >= 10,
    uppercase: /\p{Lu}/u.test(password),
    lowercase: /\p{Ll}/u.test(password),
    number: /\p{N}/u.test(password),
    special: SPECIAL_CHARACTER.test(password),
    allowedCharacters: password.length > 0 && ALLOWED_CHARACTERS.test(password),
    avoidsPersonalInfo: !personalTokens(subject).some((token) => normalizedPassword.includes(token)),
  };
}
