<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCorreoRequest extends FormRequest
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
            'correo' => [
                'required',
                'email',
                'max:150',
                Rule::unique('usuario', 'correo')->ignore($this->user()->id),
            ],
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
            'correo.required' => 'El correo es obligatorio.',
            'correo.email' => 'El correo debe tener un formato válido.',
            'correo.max' => 'El correo no puede superar los 150 caracteres.',
            'correo.unique' => 'Ya existe una cuenta registrada con este correo.',
        ];
    }
}
