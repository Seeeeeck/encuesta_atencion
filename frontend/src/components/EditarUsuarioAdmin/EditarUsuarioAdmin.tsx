import { useState } from 'react';
import type { FormEvent } from 'react';
import { CampoFormulario } from '../CampoFormulario/CampoFormulario';
import { MensajeError } from '../MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { editarUsuario } from '../../services/adminService';
import { extraerError } from '../../services/errores';
import type { CambiosUsuario } from '../../types/admin';
import type { Rol, Sexo, Usuario } from '../../types/usuario';
import { opcionesRol, opcionesSexo } from '../../utils/opciones';
import { validarClaveNueva, validarCorreo, validarEdad, validarNombre } from '../../utils/validacion';
import type { ErroresFormulario } from '../../utils/validacion';

interface Props {
  usuario: Usuario;
  onGuardado: (usuario: Usuario) => void;
}

export function EditarUsuarioAdmin({ usuario, onGuardado }: Props) {
  const { usuario: sesion, actualizarUsuario } = useAuth();
  const esUnoMismo = sesion?.id === usuario.id;
  const [nombre, setNombre] = useState(usuario.nombre);
  const [correo, setCorreo] = useState(usuario.correo);
  const [clave, setClave] = useState('');
  const [edad, setEdad] = useState(usuario.edad === null ? '' : String(usuario.edad));
  const [sexo, setSexo] = useState<string>(usuario.sexo ?? '');
  const [rol, setRol] = useState<string>(usuario.rol);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensaje, setMensaje] = useState('');
  const [estado, setEstado] = useState('');
  const [enviando, setEnviando] = useState(false);

  // El backend solo actualiza los campos que llegan: se mandan únicamente los que cambiaron.
  // Edad y sexo vacíos no se mandan porque el backend no permite borrarlos.
  function cambios(): CambiosUsuario {
    const resultado: CambiosUsuario = {};
    if (nombre.trim() !== usuario.nombre) resultado.nombre = nombre.trim();
    if (correo.trim() !== usuario.correo) resultado.correo = correo.trim();
    if (clave) resultado.clave = clave;
    if (edad.trim() && Number(edad) !== usuario.edad) resultado.edad = Number(edad);
    if (sexo && sexo !== usuario.sexo) resultado.sexo = sexo as Sexo;
    if (!esUnoMismo && rol !== usuario.rol) resultado.rol = rol as Rol;
    return resultado;
  }

  function validar(): ErroresFormulario {
    const resultado: ErroresFormulario = {};
    const errorNombre = validarNombre(nombre);
    const errorCorreo = validarCorreo(correo);
    const errorClave = clave ? validarClaveNueva(clave) : null;
    const errorEdad = validarEdad(edad);
    if (errorNombre) resultado.nombre = errorNombre;
    if (errorCorreo) resultado.correo = errorCorreo;
    if (errorClave) resultado.clave = errorClave;
    if (errorEdad) resultado.edad = errorEdad;
    return resultado;
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    setEstado('');
    const erroresCliente = validar();
    setErrores(erroresCliente);
    if (Object.keys(erroresCliente).length > 0) return;
    const datos = cambios();
    if (Object.keys(datos).length === 0) {
      setEstado('No hay cambios para guardar.');
      return;
    }

    setEnviando(true);
    try {
      const actualizado = await editarUsuario(usuario.id, datos);
      if (esUnoMismo) actualizarUsuario(actualizado);
      setClave('');
      setEstado('Usuario actualizado.');
      onGuardado(actualizado);
    } catch (error) {
      const { mensaje: mensajeError, campos } = extraerError(error);
      setErrores(campos);
      setMensaje(Object.keys(campos).length > 0 ? '' : mensajeError);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Editar datos</h2>
      <MensajeError mensaje={mensaje} />
      {estado && (
        <p role="status" className="mensaje-exito">
          {estado}
        </p>
      )}
      <CampoFormulario etiqueta="Nombre" nombre="nombre" valor={nombre} onCambio={setNombre} error={errores.nombre} />
      <CampoFormulario etiqueta="Correo" nombre="correo" tipo="email" valor={correo} onCambio={setCorreo} error={errores.correo} />
      <CampoFormulario
        etiqueta="Clave nueva"
        nombre="clave"
        tipo="password"
        autoComplete="new-password"
        valor={clave}
        onCambio={setClave}
        error={errores.clave}
        ayuda="Déjala vacía para no cambiarla."
        opcional
      />
      <CampoFormulario etiqueta="Edad" nombre="edad" tipo="number" valor={edad} onCambio={setEdad} error={errores.edad} opcional />
      <CampoFormulario etiqueta="Sexo" nombre="sexo" valor={sexo} onCambio={setSexo} error={errores.sexo} opciones={opcionesSexo} opcional />
      <CampoFormulario
        etiqueta="Rol"
        nombre="rol"
        valor={rol}
        onCambio={setRol}
        error={errores.rol}
        opciones={opcionesRol}
        deshabilitado={esUnoMismo}
        ayuda={esUnoMismo ? 'No puedes cambiar tu propio rol.' : undefined}
      />
      <button type="submit" className="boton" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
