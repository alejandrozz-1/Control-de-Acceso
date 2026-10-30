import { getActiveNavPath } from '../components/ui/BottomNav';

test('mantiene Cuenta seleccionada en sus rutas de configuración', () => {
  expect(getActiveNavPath('/cuenta/seguridad')).toBeNull();
  expect(getActiveNavPath('/cuenta/perfil')).toBeNull();
});

test('conserva la selección exacta para los destinos principales', () => {
  expect(getActiveNavPath('/calendario')).toBe('/calendario');
  expect(getActiveNavPath('/acceso')).toBe('/acceso');
  expect(getActiveNavPath('/notificaciones')).toBeNull();
  expect(getActiveNavPath('/ruta-desconocida')).toBeNull();
});
