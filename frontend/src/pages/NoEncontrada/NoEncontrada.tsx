import { Link } from 'react-router';

export function NoEncontrada() {
  return (
    <section className="tarjeta">
      <h1>Página no encontrada</h1>
      <p>La dirección que abriste no existe o se movió.</p>
      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </section>
  );
}
