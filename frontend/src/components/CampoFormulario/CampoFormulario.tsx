import { useId } from 'react';
import type { HTMLInputTypeAttribute } from 'react';
import './CampoFormulario.css';

interface Opcion {
  valor: string;
  texto: string;
}

interface Props {
  etiqueta: string;
  nombre: string;
  valor: string;
  onCambio: (valor: string) => void;
  tipo?: HTMLInputTypeAttribute;
  error?: string;
  ayuda?: string;
  autoComplete?: string;
  opciones?: Opcion[];
  opcional?: boolean;
}

export function CampoFormulario({
  etiqueta,
  nombre,
  valor,
  onCambio,
  tipo = 'text',
  error,
  ayuda,
  autoComplete,
  opciones,
  opcional = false,
}: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const descripcion = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(' ');
  const comunes = {
    id,
    name: nombre,
    value: valor,
    'aria-invalid': Boolean(error),
    'aria-describedby': descripcion || undefined,
    className: 'campo__control',
  };

  return (
    <div className={`campo${error ? ' campo--error' : ''}`}>
      <label htmlFor={id} className="campo__etiqueta">
        {etiqueta}
        {opcional && <span className="campo__opcional"> (opcional)</span>}
      </label>
      {opciones ? (
        <select {...comunes} onChange={(evento) => onCambio(evento.target.value)}>
          <option value="">Elegí una opción</option>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...comunes}
          type={tipo}
          autoComplete={autoComplete}
          onChange={(evento) => onCambio(evento.target.value)}
        />
      )}
      {error && (
        <p id={idError} className="campo__error">
          {error}
        </p>
      )}
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda">
          {ayuda}
        </p>
      )}
    </div>
  );
}
