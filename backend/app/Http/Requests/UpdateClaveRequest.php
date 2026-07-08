<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClaveRequest extends FormRequest
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
            'clave' => ['required', 'string', 'min:5', 'max:100', 'regex:/[A-Z]/', 'regex:/[\W_]/'],
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
            'clave.required' => 'La clave es obligatoria.',
            'clave.min' => 'La clave debe tener al menos 5 caracteres.',
            'clave.max' => 'La clave no puede superar los 100 caracteres.',
            'clave.regex' => 'La clave debe incluir al menos una letra mayúscula y un símbolo o signo de puntuación.',
        ];
    }
}
