import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { CampoFormulario } from '../../components/CampoFormulario/CampoFormulario';
import { MensajeError } from '../../components/MensajeError/MensajeError';
import { useAuth } from '../../context/useAuth';
import { registrar } from '../../services/authService';
import { extraerError } from '../../services/errores';
import { opcionesSexo } from '../../utils/opciones';
import { validarRegistro } from '../../utils/validacion';
import type { ErroresFormulario, FormularioRegistro } from '../../utils/validacion';
import type { Sexo } from '../../types/usuario';

const vacio: FormularioRegistro = { nombre: '', correo: '', clave: '', edad: '', sexo: '' };

export function Registro() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [datos, setDatos] = useState<FormularioRegistro>(vacio);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo: keyof FormularioRegistro) {
    return (valor: string) => setDatos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setMensaje('');
    const erroresCliente = validarRegistro(datos);
    setErrores(erroresCliente);
    if (Object.keys(erroresCliente).length > 0) {
      return;
    }

    setEnviando(true);
    try {
      const { token, usuario } = await registrar({
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        clave: datos.clave,
        edad: datos.edad ? Number(datos.edad) : null,
        sexo: datos.sexo ? (datos.sexo as Sexo) : null,
      });
      iniciarSesion(token, usuario);
      navegar('/encuesta', { replace: true });
    } catch (error) {
      const { mensaje: mensajeError, campos } = extraerError(error);
      setErrores(campos);
      setMensaje(Object.keys(campos).length > 0 ? '' : mensajeError);
      setEnviando(false);
    }
  }

  return (
    <section className="pagina-angosta tarjeta">
      <h1>Crear cuenta</h1>
      <form className="formulario" onSubmit={enviar} noValidate>
        <MensajeError mensaje={mensaje} />
        <CampoFormulario
          etiqueta="Nombre"
          nombre="nombre"
          autoComplete="name"
          valor={datos.nombre}
          onCambio={cambiar('nombre')}
          error={errores.nombre}
        />
        <CampoFormulario
          etiqueta="Correo"
          nombre="correo"
          tipo="email"
          autoComplete="email"
          valor={datos.correo}
          onCambio={cambiar('correo')}
          error={errores.correo}
        />
        <CampoFormulario
          etiqueta="Clave"
          nombre="clave"
          tipo="password"
          autoComplete="new-password"
          valor={datos.clave}
          onCambio={cambiar('clave')}
          error={errores.clave}
          ayuda="Mínimo 5 caracteres, con al menos una mayúscula y un símbolo."
        />
        <CampoFormulario
          etiqueta="Edad"
          nombre="edad"
          tipo="number"
          valor={datos.edad}
          onCambio={cambiar('edad')}
          error={errores.edad}
          opcional
        />
        <CampoFormulario
          etiqueta="Sexo"
          nombre="sexo"
          valor={datos.sexo}
          onCambio={cambiar('sexo')}
          error={errores.sexo}
          opciones={opcionesSexo}
          opcional
        />
        <button type="submit" className="boton" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="formulario__pie">
        ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
      </p>
    </section>
  );
}
