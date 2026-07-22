<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Usuario>
 */

//App\Models\Usuario::factory()->count(30)->create();
class UsuarioFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */

    public function definition(): array
    {
        return [
            //
            'nombre'=>fake()->name(),
            'correo'=>fake()->unique()->email(),
            'clave'=>fake()->password(6,15),
            'edad'=>fake()->numberBetween(1,160),
            'sexo'=>fake()->randomElement(['M','F']),
            'rol'=>'usuario'

        ];
    }
}
