<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Override;

class EnviarEncuestaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        //viene un array de id_pregunta y numero_respuesta
        return [
            //
            'respuestas'=>'required|array',
            'respuestas.*.numero_respuesta'=>'required|integer|min:1|max:5',
            'respuestas.*.id_pregunta'=>'required|integer|exists:pregunta.id'
        ];
    }

   
    public function messages()
    {
        return [
            'respuestas.required'=>"Las respuestas son obligatorias",
            'respuestas.array'=>"Las respuestas deben ser un array",
            'respuestas.*.numero_respuesta.required'=>"La respuesta es requerida",
            'respuestas.*.numero_respuesta.integer'=>"La respuesta debe ser un número entero",
            'respuestas.*.numero_respuesta.min'=>"La respuesta debe ser minimo 1",
            'respuestas.*.numero_respuesta.max'=>"La respuesta debe ser un número maximo 5",
            'respuestas.*.id_pregunta.required'=>"El id de pregunta es obligatorio",
            'respuestas.*.id_pregunta.integer'=>"El id de pregunta debe ser un número entero",
            'respuestas.*.id_pregunta.exists'=>"El id de pregunta debe existir en la base de datos"

        ];
    }
}
