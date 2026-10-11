import { Link } from 'react-router';
import { useAuth } from '../../context/useAuth';
import './Inicio.css';

export function Inicio() {
  const { usuario } = useAuth();

  return (
    <section className="inicio">
      <h1>¿Cómo influyen las apps y los juegos en tu atención?</h1>
      <p className="inicio__bajada">
        Algunas redes sociales y videojuegos están diseñados para mantenerte enganchado con
        recompensas constantes. Esta encuesta corta mide cómo eso afectó tus hábitos de atención y
        concentración.
      </p>
      <ul className="inicio__datos">
        <li>10 afirmaciones</li>
        <li>Respondés del 1 al 5</li>
        <li>Menos de 3 minutos</li>
      </ul>
      <div className="inicio__acciones">
        {usuario ? (
          <Link to="/encuesta" className="boton">
            Ir a la encuesta
          </Link>
        ) : (
          <>
            <Link to="/registro" className="boton">
              Crear cuenta y empezar
            </Link>
            <Link to="/login" className="boton boton--secundario">
              Ya tengo cuenta
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
