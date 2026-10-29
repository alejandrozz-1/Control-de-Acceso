import { getActiveNavPath } from '../components/ui/BottomNav';

test('mantiene Cuenta seleccionada en sus rutas de configuración', () => {
  expect(getActiveNavPath('/cuenta/seguridad')).toBe('/cuenta');
  expect(getActiveNavPath('/cuenta/perfil')).toBe('/cuenta');
});

test('conserva la selección exacta para los destinos principales', () => {
  expect(getActiveNavPath('/calendario')).toBe('/calendario');
  expect(getActiveNavPath('/notificaciones')).toBe('/notificaciones');
  expect(getActiveNavPath('/ruta-desconocida')).toBe('/');
});
