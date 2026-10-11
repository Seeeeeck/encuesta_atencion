import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout/Layout';
import { Inicio } from './pages/Inicio/Inicio';
import { NoEncontrada } from './pages/NoEncontrada/NoEncontrada';

export function AppRutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
