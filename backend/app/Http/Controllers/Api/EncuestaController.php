<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnviarEncuestaRequest;
use App\Models\Encuesta;
use App\Models\Pregunta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EncuestaController extends Controller
{
    //

    public function obtenerPreguntas(Request $request)
    {
        try {

            $preguntas = Pregunta::select('id', 'pregunta_texto', 'tipo')->orderBy('id')->get();

            if (!$preguntas) {

                return response()->json(["message" => "No existen preguntas"], 404);
            }

            return response()->json(["message" => "preguntas obtenidas", "preguntas" => $preguntas], 200);
        } catch (\Throwable $e) {
            Log::error('Error al obtener preguntas', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Error al obtener preguntas"], 500);
        }
    }

    public function enviarEncuesta(EnviarEncuestaRequest $request)
    {
        try {

            //crear la encuesta
            //no es necesario el is_ok

         

            //crear las respuestas

            return response()->json(["message" => "Encuesta realizada"], 200);
        } catch (\Throwable $e) {

            Log::error('Error al enviar encuesta', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Error al enviar encuesta"], 500);
        }
    }
}
