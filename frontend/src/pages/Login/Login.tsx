import { startTransition, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { CampoFormulario } from '../../components/CampoFormulario/CampoFormulario';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { iniciarSesion as iniciarSesionApi } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { validarLogin } from '../../utils/validacion';
import type { ErroresFormulario } from '../../utils/validacion';

export function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    const erroresCliente = validarLogin({ correo, clave });
    setErrores(erroresCliente);
    if (Object.keys(erroresCliente).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      const { token, usuario } = await iniciarSesionApi(correo.trim(), clave);
      const desde = (ubicacion.state as { desde?: string } | null)?.desde;
      // En la misma transición que la navegación: si no, RutaInvitado ve la sesión
      // primero y redirige a su destino por defecto en vez de volver a `desde`.
      startTransition(() => {
        navegar(desde ?? (usuario.rol === 'admin' ? '/admin' : '/encuesta'), { replace: true });
        iniciarSesion(token, usuario);
      });
    } catch (error) {
      const { mensaje: mensajeError, campos } = extraerError(error);
      setErrores(campos);
      setMensaje(Object.keys(campos).length > 0 ? '' : mensajeError);
      setEnviando(false);
    }
  }

  return (
    <section className="pagina-angosta tarjeta">
      <h1>Ingresar</h1>
      <form className="formulario" onSubmit={enviar} noValidate>
        <MensajeError mensaje={mensaje} />
        <CampoFormulario
          etiqueta="Correo"
          nombre="correo"
          tipo="email"
          autoComplete="email"
          valor={correo}
          onCambio={setCorreo}
          error={errores.correo}
        />
        <CampoFormulario
          etiqueta="Clave"
          nombre="clave"
          tipo="password"
          autoComplete="current-password"
          valor={clave}
          onCambio={setClave}
          error={errores.clave}
        />
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="formulario__pie">
        ¿No tienes cuenta? <Link to="/registro">Crea una</Link>
      </p>
    </section>
  );
}
