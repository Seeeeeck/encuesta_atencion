<?php

namespace Database\Factories;

use App\Models\Respuesta;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Respuesta>
 */
class RespuestaFactory extends Factory
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
            'respuesta'=>fake()->randomElement([1,2,3,4,5])
        ];
    }
}
