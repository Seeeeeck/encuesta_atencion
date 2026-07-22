<?php

namespace App\Rules;

use App\Models\Pregunta;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class TodasLasRespuestasRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $idsEsperados = Pregunta::pluck('id')->sort()->values()->toArray();

        $idsRecibidos = collect($value)->pluck('id_pregunta')->sort()->values()->toArray();

        if ($idsEsperados !== $idsRecibidos) {
            $faltantes = array_diff($idsEsperados, $idsRecibidos);
            $sobrantes = array_diff($idsRecibidos, $idsEsperados);

            $mensaje = 'Deben enviarse todas las preguntas.';
            if ($faltantes) {
                $mensaje .= ' Faltan estos id_pregunta: ' . implode(', ', $faltantes) . '.';
            }
            if ($sobrantes) {
                $mensaje .= ' Sobran estos id_pregunta: ' . implode(', ', $sobrantes) . '.';
            }

            $fail($mensaje);
        }
    }
}
