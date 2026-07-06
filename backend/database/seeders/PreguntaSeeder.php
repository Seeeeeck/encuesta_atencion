<?php

namespace Database\Seeders;

use App\Models\Pregunta;
use Illuminate\Database\Seeder;

class PreguntaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ruta = base_path('../docs/preguntas.json');
        $datos = json_decode(file_get_contents($ruta), true);

        foreach ($datos['preguntas'] as $pregunta) {
            $tipo = match ($pregunta['direccion']) {
                'positiva' => 'P',
                'negativa' => 'N',
            };

            Pregunta::create([
                'pregunta_texto' => $pregunta['texto'],
                'tipo' => $tipo,
            ]);
        }
    }
}
