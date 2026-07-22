<?php

namespace App\Http\Requests;
use App\Rules\TodasLasRespuestasRule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;


class EnviarEncuestaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            
            'respuestas'=> ['required',"required_todas_respuestas"=>new TodasLasRespuestasRule()], //['required'=>new TodasLasRespuestasValidacion()],
            'respuestas.*.numero_respuesta'=>'required|integer|min:1|max:5',
            'respuestas.*.id_pregunta'=>'required|integer|distinct|exists:pregunta,id'
        ];
    }

   
    public function messages()
    {
        return [
            'respuestas.required'=>"Las respuestas son requeridas",
            'respuestas.array'=>"Las respuestas deben ser un array",
            'respuestas.*.numero_respuesta.required'=>"La respuesta es requerida",
            'respuestas.*.numero_respuesta.integer'=>"La respuesta debe ser un número entero",
            'respuestas.*.numero_respuesta.min'=>"La respuesta debe ser minimo 1",
            'respuestas.*.numero_respuesta.max'=>"La respuesta debe ser un número maximo 5",
            'respuestas.*.id_pregunta.required'=>"El id de pregunta es obligatorio",
            'respuestas.*.id_pregunta.integer'=>"El id de pregunta debe ser un número entero",
            'respuestas.*.id_pregunta.distinct'=>"Los id de preguntas deben ser distintos",
            'respuestas.*.id_pregunta.exists'=>"El id :input de pregunta debe existir en la base de datos"

        ];
    }
}
