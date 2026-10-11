import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout/Layout';
import { ActualizarCorreo } from './pages/ActualizarCorreo/ActualizarCorreo';
import { Encuesta } from './pages/Encuesta/Encuesta';
import { EncuestaFinalizada } from './pages/EncuestaFinalizada/EncuestaFinalizada';
import { Inicio } from './pages/Inicio/Inicio';
import { Login } from './pages/Login/Login';
import { NoEncontrada } from './pages/NoEncontrada/NoEncontrada';
import { Perfil } from './pages/Perfil/Perfil';
import { Registro } from './pages/Registro/Registro';
import { VerificarCorreo } from './pages/VerificarCorreo/VerificarCorreo';
import { RutaInvitado, RutaPrivada } from './routes/guards';

export function AppRutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="verificar-correo" element={<VerificarCorreo />} />
        <Route path="actualizar-correo" element={<ActualizarCorreo />} />
        <Route element={<RutaInvitado />}>
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
        </Route>
        <Route element={<RutaPrivada />}>
          <Route path="encuesta" element={<Encuesta />} />
          <Route path="encuesta/finalizada" element={<EncuestaFinalizada />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
