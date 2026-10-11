import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Cargando } from '../../components/Cargando/Cargando';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { obtenerPerfil, verificarCorreo } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { isAxiosError } from 'axios';

type Estado = 'verificando' | 'listo' | 'error';

const parametrosNecesarios = ['id', 'hash', 'expires', 'signature'];

export function VerificarCorreo() {
  const [parametros] = useSearchParams();
  const { usuario, actualizarUsuario } = useAuth();
  const completo = parametrosNecesarios.every((clave) => parametros.get(clave));
  const [estado, setEstado] = useState<Estado>('verificando');
  const [mensaje, setMensaje] = useState('');
  const conSesion = Boolean(usuario);

  useEffect(() => {
    if (!completo) {
      return;
    }
    let activo = true;
    verificarCorreo(parametros)
      .then(async () => {
        if (conSesion) {
          await obtenerPerfil().then(actualizarUsuario, () => {});
        }
        if (activo) setEstado('listo');
      })
      .catch((error: unknown) => {
        if (!activo) return;
        const vencido = isAxiosError(error) && error.response?.status === 403;
        setMensaje(vencido ? 'El link de verificación venció o ya no es válido.' : extraerError(error).mensaje);
        setEstado('error');
      });
    return () => {
      activo = false;
    };
  }, [parametros, completo, conSesion, actualizarUsuario]);

  return (
    <section className="pagina-angosta tarjeta">
      <h1>Verificación de correo</h1>
      {!completo ? (
        <MensajeError mensaje="El link de verificación está incompleto." />
      ) : estado === 'verificando' ? (
        <Cargando texto="Verificando tu correo…" />
      ) : estado === 'error' ? (
        <MensajeError mensaje={mensaje} />
      ) : (
        <>
          <p className="mensaje-exito">¡Listo! Tu correo quedó verificado.</p>
          <p>
            {conSesion ? (
              <Link to="/encuesta" className="boton">
                Ir a la encuesta
              </Link>
            ) : (
              <Link to="/login" className="boton">
                Ingresar
              </Link>
            )}
          </p>
        </>
      )}
    </section>
  );
}
