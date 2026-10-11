import './MensajeError.css';

export function MensajeError({ mensaje }: { mensaje: string }) {
  if (!mensaje) {
    return null;
  }
  return (
    <p className="mensaje-error" role="alert">
      {mensaje}
    </p>
  );
}
