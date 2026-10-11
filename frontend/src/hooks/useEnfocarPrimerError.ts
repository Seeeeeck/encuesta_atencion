import { useEffect, useRef } from 'react';

// Después de cada validación lleva el foco al primer campo marcado como inválido,
// así quien navega con teclado o lector de pantalla llega directo al problema.
// Se dispara cuando cambia el valor de `errores` (cada envío crea uno nuevo),
// no mientras la persona escribe.
export function useEnfocarPrimerError(errores: Record<string, string | undefined> | string | undefined) {
  const formulario = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const hayErrores = typeof errores === 'string' ? errores !== '' : Object.values(errores ?? {}).some(Boolean);
    if (!hayErrores) {
      return;
    }
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errores]);

  return formulario;
}
