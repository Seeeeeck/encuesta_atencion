<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Override;

class EditarUsuarioRequest extends FormRequest
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
        return [
            'id' => "required|numeric|exists:usuario,id",
            'nombre' => 'min:3|max:100|string',
            'clave' => ['string', 'min:5', 'max:100', 'regex:/[A-Z]/', 'regex:/[\W_]/'],
            'edad' => ['nullable', 'integer', 'min:1', 'max:200'],
            'sexo' => ['nullable', 'in:M,F,N/R',"string"],
            'rol' => 'in:admin,usuario|string',
            'regla' => 'required_without_all:nombre,edad,sexo,rol,clave'
        ];
    }


    public function messages()
    {
        return [
            'id.required' => "El id es requerido",
            'id.exists' => "El id $this->id debe existir",
            'nombre.min' => 'El nombre debe tener al menos 3 caracteres.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',
            'nombre.string' => 'El nombre debe ser una cadena de texto',
            'clave.string' => "La clave debe ser una cadena de texto",
            'clave.min' => 'La clave debe tener al menos 5 caracteres.',
            'clave.max' => 'La clave no puede superar los 100 caracteres.',
            'clave.regex' => 'La clave debe incluir al menos una letra mayúscula y un símbolo o signo de puntuación.',
            'edad.integer' => 'La edad debe ser un número entero.',
            'edad.min' => 'La edad mínima permitida es 1.',
            'edad.max' => 'La edad máxima permitida es 200.',
            'sexo.in' => 'El sexo debe ser M, F o N/R.',
            'sexo.string'=>"El sexo debe ser una cadena de texto",
            'rol.in' => 'El usuario debe ser de tipo admin o usuario',
            'rol.string' => 'El rol debe ser una cadena de texto',
            'regla.required_without_all' => "Debe al menos estar nombre,edad,rol o clave"
        ];
    }
}
