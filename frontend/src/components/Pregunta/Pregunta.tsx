import { forwardRef, useId } from 'react';
import type { Pregunta as TipoPregunta, ValorRespuesta } from '../../types/encuesta';
import { significadoRespuesta } from '../../utils/opciones';
import './Pregunta.css';

const escala: ValorRespuesta[] = [1, 2, 3, 4, 5];

interface Props {
  pregunta: TipoPregunta;
  valor?: ValorRespuesta;
  onResponder: (valor: ValorRespuesta) => void;
}

// El título acepta foco (tabIndex -1) para que, al pasar de pregunta, el lector de
// pantalla anuncie el texto nuevo.
export const Pregunta = forwardRef<HTMLHeadingElement, Props>(function Pregunta(
  { pregunta, valor, onResponder },
  refTitulo,
) {
  const idTexto = useId();

  return (
    <div className="pregunta">
      <h1 id={idTexto} ref={refTitulo} tabIndex={-1} className="pregunta__texto">
        {pregunta.pregunta_texto}
      </h1>
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
            <span className="pregunta__valor">{opcion}</span>{' '}
            <span className="pregunta__ancla">{significadoRespuesta[opcion]}</span>
            <svg className="pregunta__marca" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </label>
        ))}
      </div>
    </div>
  );
});
