import { MemoryRouter } from 'react-router-dom';
import { AppProviders } from './app/providers';
import AppRoutes from './app/router';

export default function App() {
  return (
    <AppProviders>
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>
  );
}
