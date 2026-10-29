import { checkPasswordPolicy } from '../pages/account/passwordPolicy';

const employee = {
  full_name: 'Eva Empleada',
  email: 'eva.empleada@test.local',
  employee_code: 'E0021',
};

test('acepta una contraseña que cumple todas las reglas', () => {
  const result = checkPasswordPolicy('Zafiro!Luna42', employee);
  expect(Object.values(result).every(Boolean)).toBe(true);
});

test('acepta los símbolos definidos por la política', () => {
  const result = checkPasswordPolicy('Aa1!@#$%^&*()_+-=[]{}:;,?/|~', employee);
  expect(result.special).toBe(true);
  expect(result.allowedCharacters).toBe(true);
});

test('rechaza contraseñas cortas o sin mayúscula, minúscula, número o símbolo', () => {
  const result = checkPasswordPolicy('password', employee);
  expect(result.minLength).toBe(false);
  expect(result.uppercase).toBe(false);
  expect(result.number).toBe(false);
  expect(result.special).toBe(false);
});

test('no permite espacios, puntos ni símbolos fuera de la lista aceptada', () => {
  expect(checkPasswordPolicy('Zafiro.Luna42!', employee).allowedCharacters).toBe(false);
  expect(checkPasswordPolicy('Zafiro Luna42!', employee).allowedCharacters).toBe(false);
  expect(checkPasswordPolicy('Zafiro"Luna42!', employee).allowedCharacters).toBe(false);
});

test('rechaza nombre, apellido, usuario de correo e ID de empleado', () => {
  expect(checkPasswordPolicy('EvaEmpleada42!', employee).avoidsPersonalInfo).toBe(false);
  expect(checkPasswordPolicy('EmpleadaEva42!', employee).avoidsPersonalInfo).toBe(false);
  expect(checkPasswordPolicy('EvaEmpleada42!', employee).avoidsPersonalInfo).toBe(false);
  expect(checkPasswordPolicy('Zafiro!E0021', employee).avoidsPersonalInfo).toBe(false);
});

test('la comparación de datos personales ignora mayúsculas y acentos', () => {
  expect(checkPasswordPolicy('EMPLEADA!Eva42', employee).avoidsPersonalInfo).toBe(false);
});
