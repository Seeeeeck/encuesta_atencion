import { useState } from 'react';
import type { FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { CampoFormulario } from '../CampoFormulario/CampoFormulario';
import { MensajeError } from '../MensajeError/MensajeError';
import { actualizarClave } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { validarClaveNueva } from '../../utils/validacion';
import type { ErroresFormulario } from '../../utils/validacion';

export function CambiarClave() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  function validar(): ErroresFormulario {
    const resultado: ErroresFormulario = {};
    if (!actual) resultado.clave_actual = 'Ingresa tu clave actual.';
    const errorNueva = validarClaveNueva(nueva);
    if (errorNueva) resultado.clave_nueva = errorNueva;
    if (nueva !== repetida) resultado.repetida = 'Las claves no coinciden.';
    return resultado;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    setExito('');
    const erroresCliente = validar();
    setErrores(erroresCliente);
    if (Object.keys(erroresCliente).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      await actualizarClave(actual, nueva);
      setActual('');
      setNueva('');
      setRepetida('');
      setExito('Clave actualizada.');
    } catch (error) {
      // El backend responde 401 cuando la clave actual no coincide.
      if (isAxiosError(error) && error.response?.status === 401) {
        setErrores({ clave_actual: 'La clave actual no es correcta.' });
      } else {
        const { mensaje: mensajeError, campos } = extraerError(error);
        setErrores(campos);
        setMensaje(Object.keys(campos).length > 0 ? '' : mensajeError);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Clave</h2>
      <MensajeError mensaje={mensaje} />
      {exito && <p className="mensaje-exito">{exito}</p>}
      <CampoFormulario
        etiqueta="Clave actual"
        nombre="clave_actual"
        tipo="password"
        autoComplete="current-password"
        valor={actual}
        onCambio={setActual}
        error={errores.clave_actual}
      />
      <CampoFormulario
        etiqueta="Clave nueva"
        nombre="clave_nueva"
        tipo="password"
        autoComplete="new-password"
        valor={nueva}
        onCambio={setNueva}
        error={errores.clave_nueva}
        ayuda="Mínimo 5 caracteres, con al menos una mayúscula y un símbolo."
      />
      <CampoFormulario
        etiqueta="Repite la clave nueva"
        nombre="repetida"
        tipo="password"
        autoComplete="new-password"
        valor={repetida}
        onCambio={setRepetida}
        error={errores.repetida}
      />
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? 'Cambiando…' : 'Cambiar clave'}
      </button>
    </form>
  );
}
