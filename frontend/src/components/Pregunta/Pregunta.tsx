import { useId } from 'react';
import type { Pregunta as TipoPregunta, ValorRespuesta } from '../../types/encuesta';
import './Pregunta.css';

// Anclas de docs/preguntas.json: solo se muestran, en la BD se guarda el número.
const anclas: Partial<Record<ValorRespuesta, string>> = {
  1: 'Totalmente en desacuerdo',
  5: 'Totalmente de acuerdo',
};

const escala: ValorRespuesta[] = [1, 2, 3, 4, 5];

interface Props {
  pregunta: TipoPregunta;
  numero: number;
  total: number;
  valor?: ValorRespuesta;
  onResponder: (valor: ValorRespuesta) => void;
}

export function Pregunta({ pregunta, numero, total, valor, onResponder }: Props) {
  const idTexto = useId();

  return (
    <div className="pregunta">
      <p className="pregunta__numero">
        Pregunta {numero} de {total}
      </p>
      <p id={idTexto} className="pregunta__texto">
        {pregunta.pregunta_texto}
      </p>
      <div role="radiogroup" aria-labelledby={idTexto} className="pregunta__escala">
        {escala.map((opcion) => (
          <label key={opcion} className={`pregunta__opcion${valor === opcion ? ' pregunta__opcion--elegida' : ''}`}>
            <input
              type="radio"
              name={`pregunta-${pregunta.id}`}
              value={opcion}
              checked={valor === opcion}
              onChange={() => onResponder(opcion)}
              className="visualmente-oculto"
            />
            <span className="pregunta__valor">{opcion}</span>
            {anclas[opcion] && (
              <>
                {' '}
                <span className="pregunta__ancla">{anclas[opcion]}</span>
              </>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
