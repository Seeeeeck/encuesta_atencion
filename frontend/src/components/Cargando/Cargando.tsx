import './Cargando.css';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <p className="cargando" role="status">
      <span className="cargando__punto" aria-hidden="true" />
      {texto}
    </p>
  );
}
