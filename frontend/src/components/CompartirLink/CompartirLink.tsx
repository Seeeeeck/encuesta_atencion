import { useState } from 'react';

type Estado = 'inicial' | 'copiado' | 'manual';

export function CompartirLink({ url, secundario = false }: { url: string; secundario?: boolean }) {
  const [estado, setEstado] = useState<Estado>('inicial');

  async function compartir() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Encuesta sobre la atención',
          text: '¿Cómo influyen las apps y los juegos en tu atención? Responde esta encuesta corta.',
          url,
        });
      } catch {
        // El usuario cerró el menú de compartir: no hay nada que avisar.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setEstado('copiado');
    } catch {
      setEstado('manual');
    }
  }

  return (
    <div className="formulario">
      <button type="button" className={secundario ? 'boton boton--secundario' : 'boton'} onClick={compartir}>
        Compartir la encuesta
      </button>
      {estado === 'copiado' && (
        <p role="status" className="mensaje-exito">
          ¡Link copiado!
        </p>
      )}
      {estado === 'manual' && (
        <label className="campo">
          <span className="campo__etiqueta">Copia este link</span>
          <input className="campo__control" readOnly value={url} onFocus={(evento) => evento.target.select()} />
        </label>
      )}
    </div>
  );
}
