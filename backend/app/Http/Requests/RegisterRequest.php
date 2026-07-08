<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'min:3', 'max:100'],
            'correo' => ['required', 'email', 'unique:usuario,correo'],
            'clave' => ['required', 'string', 'min:5', 'max:100', 'regex:/[A-Z]/', 'regex:/[\W_]/'],
            'edad' => ['nullable', 'integer', 'min:1', 'max:200'],
            'sexo' => ['nullable', 'in:M,F,N/R'],
        ];
    }

    /**
     * Get the custom validation messages that apply to the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre es obligatorio.',
            'nombre.min' => 'El nombre debe tener al menos 3 caracteres.',
            'nombre.max' => 'El nombre no puede superar los 100 caracteres.',

            'correo.required' => 'El correo es obligatorio.',
            'correo.email' => 'El correo debe tener un formato válido.',
            'correo.unique' => 'Ya existe una cuenta registrada con este correo.',

            'clave.required' => 'La clave es obligatoria.',
            'clave.min' => 'La clave debe tener al menos 5 caracteres.',
            'clave.max' => 'La clave no puede superar los 100 caracteres.',
            'clave.regex' => 'La clave debe incluir al menos una letra mayúscula y un símbolo o signo de puntuación.',

            'edad.integer' => 'La edad debe ser un número entero.',
            'edad.min' => 'La edad mínima permitida es 1.',
            'edad.max' => 'La edad máxima permitida es 200.',

            'sexo.in' => 'El sexo debe ser M, F o N/R.',
        ];
    }
}
