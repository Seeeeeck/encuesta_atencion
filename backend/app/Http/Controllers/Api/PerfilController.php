<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateClaveRequest;
use App\Http\Requests\UpdateCorreoRequest;
use App\Http\Requests\UpdateNombreRequest;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PerfilController extends Controller
{
    /**
     * GET /api/me
     */
    public function show(Request $request)
    {
        try {
            return response()->json($request->user(), 200);
        } catch (\Throwable $e) {
            Log::error('Error al obtener perfil', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al obtener el perfil.'], 500);
        }
    }

    /**
     * PUT /api/me/nombre
     */
    public function updateName(UpdateNombreRequest $request)
    {
        try {
            $usuario = $request->user();
            $usuario->update($request->validated());

            return response()->json(["message" => "Se cambió el nombre", $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar nombre', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al actualizar el nombre.'], 500);
        }
    }

    /**
     * PUT /api/me/clave
     */
    public function updatePassword(UpdateClaveRequest $request)
    {
        try {

            if (!Hash::check($request->clave_actual, $request->user()->clave)) {
                return response()->json(["message" => "La clave actual no correspode al usuario"], 401);
            }

            $usuario = Usuario::where("id", $request->user()->id)->first();

            $usuario->clave = Hash::make($request->clave_nueva);

            $usuario->save();

            return response()->json(["message" => "Se cambió la clave", $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar clave', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al actualizar la clave.'], 500);
        }
    }

    /**
     * PUT /api/me/correo
     */
    public function updateEmail(UpdateCorreoRequest $request)
    {
        try {
            $usuario=Usuario::where('id',$request->id)->first();
            $usuario->update($request->validated());

            return response()->json(["message" => "Se cambió el correo", $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar correo', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al actualizar el correo.'], 500);
        }
    }

    public function updateEmailVerify(Request $request)
    {

        try {

            $correo = $request->user()->correo;
            $request->user()->sendUpdateEmailVerification();
            return response()->json(["message" => "Solicitud de cambio de correo enviada a $correo"]);
        } catch (\Throwable $e) {
            Log::error("Error al enviar verificacion de cambio de email", [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage()
            ]);

            return response()->json(["message" => "error al enviar verificación de email"], 500);
        }
    }


    
    public function verificacionFirmaEmail()
    {
        return response()->json(["message" => "firma verificada"], 200);
    }

    /**
     * DELETE /api/me
     */
    public function destroy(Request $request)
    {
        try {
            $usuario = $request->user();

            $usuario->tokens()->delete();
            $usuario->delete();

            return response()->json(['message' => 'Cuenta eliminada correctamente.'], 200);
        } catch (\Throwable $e) {
            Log::error('Error al eliminar la cuenta', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al eliminar la cuenta.'], 500);
        }
    }


    public function showUserByEmail(Request $request)
    {
        try {
            $usuario = Usuario::where("correo", $request->email)->first();
            if (!$usuario) {
                return response()->json(["message" => "No existe el usuario con el correo" . " " . $request->email], 404);
            }
            return response()->json(["message" => "usuario obtenido", $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al obtener usuario por email', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al obtener el usuario.'], 500);
        }
    }

    public function deleteUserByEmail(Request $request)
    {
        try {

            $usuario_borrado = Usuario::where("correo", $request->email)->delete();
            if (!$usuario_borrado) {
                return response()->json([
                    "message" => "El usuario no fue borrado porque no existe con ese correo",
                    "correo" => $request->email
                ], 404);
            }
            return response()->json(["message" => "Usuario eliminado"], 200);
        } catch (\Throwable $e) {

            Log::error('Error al eliminar usuario por email', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al eliminar el usuario por email.'], 500);
        }
    }
}
