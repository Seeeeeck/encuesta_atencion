<?php

namespace Database\Seeders;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatosPruebaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //

        $usuarios = Usuario::select()->get();

        foreach ($usuarios as $usuario) {
            $id_usuario = $usuario->getAttribute('id');
            $is_encuesta = Encuesta::where('id_usuario', $id_usuario)->first();
            if (!$is_encuesta) {
                $encuesta = Encuesta::create(['id_usuario' => $id_usuario]);
                $preguntas = Pregunta::select()->get();

                foreach ($preguntas as $pregunta) {
                    //si respuesta id_pregunta = id de pregunta
                    Respuesta::factory()->create([
                        'id_encuesta'=>$encuesta->id,
                        'id_pregunta'=>$pregunta->id

                    ]);
                }
            }
        }
    }
}
