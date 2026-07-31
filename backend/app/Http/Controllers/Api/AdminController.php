<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Http\Requests\EditarUsuarioRequest;
use App\Http\Requests\EliminarUsuarioRequest;
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

            $preguntas = Pregunta::count();
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

    public function editarUsuario(EditarUsuarioRequest $request)
    {
        try {

            //
            $usuario = Usuario::find($request->id);
            if (!$usuario) {
                return response()->json(["message" => "No se encontró el usuario en la base de datos"], 404);
            }

            if ($request->filled("nombre")) {
                $usuario->nombre = $request->nombre;
            }

            if ($request->filled("clave")) {
                $usuario->clave = $request->clave;
            }

            if ($request->filled("edad")) {
                $usuario->edad = $request->edad;
            }

            if ($request->filled("sexo")) {
                $usuario->sexo = $request->sexo;
            }

            if ($request->filled("rol")) {
                $usuario->rol = $request->rol;
            }

            if (!$usuario->save()) {
                return response()->json(["message" => "Usuario no actualizado"], 500);
            }
            return response()->json(["message" => "Usuario actualizado", "usuario" => $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al editar el usuario', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Err:No se pudo editar el usuario"], 500);
        }
    }

    public function eliminarUsuario(EliminarUsuarioRequest $request)
    {
        try {
            $usuario = Usuario::where('id', $request->id)->first();
            if (!$usuario) {
                return response()->json(["message" => "No existe el usuario con ese id"], 404);
            }

         

            $usuario->tokens()->delete();
            $usuario_eliminado = Usuario::destroy($request->id);

            if (!$usuario_eliminado) {

                return response()->json(["message" => "El usuario con el id $request->id no pudo ser eliminado"], 500);
            }

            return response()->json(["message" => "El usuario con el id $request->id fue eliminado"], 200);
        } catch (\Throwable $e) {
            Log::error('Error al eliminar el usuario', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Err:No se pudo eliminar el usuario"], 500);
        }
    }
}
