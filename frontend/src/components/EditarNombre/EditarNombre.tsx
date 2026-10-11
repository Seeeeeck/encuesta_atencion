import { useState } from 'react';
import type { FormEvent } from 'react';
import { CampoFormulario } from '../CampoFormulario/CampoFormulario';
import { MensajeError } from '../MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { actualizarNombre } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { validarNombre } from '../../utils/validacion';

export function EditarNombre() {
  const { usuario, actualizarUsuario } = useAuth();
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [error, setError] = useState<string | undefined>();
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    setExito('');
    const errorCliente = validarNombre(nombre);
    setError(errorCliente ?? undefined);
    if (errorCliente) {
      return;
    }

    setEnviando(true);
    try {
      actualizarUsuario(await actualizarNombre(nombre.trim()));
      setExito('Nombre actualizado.');
    } catch (errorApi) {
      const { mensaje: mensajeError, campos } = extraerError(errorApi);
      setError(campos.nombre);
      setMensaje(campos.nombre ? '' : mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Nombre</h2>
      <MensajeError mensaje={mensaje} />
      {exito && <p className="mensaje-exito">{exito}</p>}
      <CampoFormulario
        etiqueta="Nombre"
        nombre="nombre"
        autoComplete="name"
        valor={nombre}
        onCambio={setNombre}
        error={error}
      />
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar nombre'}
      </button>
    </form>
  );
}
