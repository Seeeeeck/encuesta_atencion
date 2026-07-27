<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    //

    public function listarUsuarios(Request $request)
    {

        try {
            $usuarios = Usuario::paginate(10);
            return response()->json(["message" => "Usuarios obtenidos", "usuarios" => $usuarios], 200);
        } catch (\Throwable $e) {

            Log::error('Error al listar los usuarios', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Err:No se pudieron listar los usuarios"], 500);
        }
    }

    public function obtenerUsuarioRespuestas(Request $request)
    {

        try {
            $id_usuario = $request->id;
            $usuario = Usuario::where(['id' => $id_usuario])->first();
            if (!$usuario) {
                return response()->json(["message" => "No existe el usuario con el id $id_usuario"], 404);
            }
            $encuesta = Encuesta::where(["id_usuario" => $id_usuario])->first();
            if (!$encuesta) {
                return response()->json(["message" => "El usuario aún no realiza la encuesta"], 404);
            }
            $respuestas = Respuesta::where(['id_encuesta' => $encuesta->id])->get();
          
            $preguntas=Pregunta::count();
            if (count($respuestas) !== $preguntas) {
                return response()->json(["message" => "No estan todas las respuestas"], 404);
            }
            return response()->json(["message" => "Respuestas del usuario con el id $id_usuario obtenidas", "respuestas" => $respuestas]);
        } catch (\Throwable $e) {
            Log::error('Error al obtener respuestas del usuario', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Err:No se pudieron obtener las respuestas del usuario"], 500);
        }
    }
}
