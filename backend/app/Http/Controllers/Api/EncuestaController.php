<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnviarEncuestaRequest;
use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Rules\TodasLasRespuestasValidacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            DB::beginTransaction();
            //crear la encuesta

            $encuesta = new Encuesta;
            $encuesta->id_usuario = $request->user()->id;
            $encuesta->is_ok = true;
            if (!$encuesta->save()) {
                return response()->json(["message" => "La encuesta no fue guardada correctamente"], 500);
            }

            //guardar respuestas

            foreach ($request->respuestas as $respuesta_request) {

                $respuesta = new Respuesta;
                $respuesta->id_encuesta = $encuesta->id;
                $respuesta->id_pregunta = $respuesta_request['id_pregunta'];
                $respuesta->respuesta = $respuesta_request['numero_respuesta'];
                if (!$respuesta->save()) {
                    DB::rollBack();
                    return response()->json(["message" => "Una pregunta no fue guardada correctamente"], 500);
                };
            }

            DB::commit();
            return response()->json(["message" => "Encuesta enviada correctamente"], 200);
        } catch (\Throwable $e) {

            DB::rollBack();
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
