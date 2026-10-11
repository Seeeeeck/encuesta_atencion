import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { isAxiosError } from 'axios';
import { Cargando } from '../../components/Cargando/Cargando';
import { CampoFormulario } from '../../components/CampoFormulario/CampoFormulario';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { cambiarCorreo, verificarLinkCambioCorreo } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { validarCorreo } from '../../utils/validacion';
import { useEnfocarPrimerError } from '../../hooks/useEnfocarPrimerError';

type Estado = 'comprobando' | 'formulario' | 'listo' | 'invalido';

const parametrosNecesarios = ['verificacion', 'id', 'hash', 'expires', 'signature'];

export function ActualizarCorreo() {
  const [parametros] = useSearchParams();
  const { usuario, actualizarUsuario } = useAuth();
  const completo = parametrosNecesarios.every((clave) => parametros.get(clave));
  const [estado, setEstado] = useState<Estado>('comprobando');
  const [mensaje, setMensaje] = useState('');
  const [correo, setCorreo] = useState('');
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const refFormulario = useEnfocarPrimerError(errorCorreo);
  const [correoNuevo, setCorreoNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!completo) {
      return;
    }
    let activo = true;
    verificarLinkCambioCorreo(parametros.get('verificacion') ?? '')
      .then(() => activo && setEstado('formulario'))
      .catch((error: unknown) => {
        if (!activo) return;
        const vencido = !isAxiosError(error) || error.response?.status === 403;
        setMensaje(vencido ? 'El link para cambiar el correo venció o ya no es válido.' : extraerError(error).mensaje);
        setEstado('invalido');
      });
    return () => {
      activo = false;
    };
  }, [parametros, completo]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    const error = validarCorreo(correo);
    setErrorCorreo(error ?? undefined);
    if (error) {
      return;
    }

    setEnviando(true);
    try {
      const actualizado = await cambiarCorreo(parametros, correo.trim());
      if (usuario?.id === actualizado.id) {
        actualizarUsuario(actualizado);
      }
      setCorreoNuevo(actualizado.correo);
      setEstado('listo');
    } catch (errorApi) {
      const { mensaje: mensajeError, campos } = extraerError(errorApi);
      setErrorCorreo(campos.correo);
      setMensaje(campos.correo ? '' : mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="pagina-angosta tarjeta">
      <h1>Cambiar correo</h1>
      {!completo ? (
        <MensajeError mensaje="El link para cambiar el correo está incompleto." />
      ) : estado === 'comprobando' ? (
        <Cargando texto="Comprobando el link…" />
      ) : estado === 'invalido' ? (
        <MensajeError mensaje={mensaje} />
      ) : estado === 'listo' ? (
        <p className="mensaje-exito">Listo. Tu correo ahora es {correoNuevo}.</p>
      ) : (
        <form ref={refFormulario} className="formulario" onSubmit={enviar} noValidate>
          <MensajeError mensaje={mensaje} />
          <CampoFormulario
            etiqueta="Nuevo correo"
            nombre="correo"
            tipo="email"
            autoComplete="email"
            valor={correo}
            onCambio={setCorreo}
            error={errorCorreo}
          />
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Cambiando…' : 'Cambiar correo'}
          </button>
        </form>
      )}
    </section>
  );
}
