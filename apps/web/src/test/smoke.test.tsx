import { render, screen } from '@testing-library/react';
import App from '../App';

test('el shell muestra los 5 destinos de la navegación inferior', () => {
  render(<App />);
  for (const label of ['Inicio', 'Calendario', 'Acceso', 'Notificaciones', 'Cuenta']) {
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
  }
});

test('la ruta desconocida redirige a Inicio', () => {
  window.history.pushState({}, '', '/no-existe');
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Inicio' })).toBeInTheDocument();
});
