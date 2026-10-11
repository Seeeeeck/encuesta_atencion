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

            return response()->json(['message' => 'Err:Ocurrió un error al obtener el perfil.'], 500);
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

            return response()->json(["message" => "Se cambió el nombre", "usuario" => $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar nombre', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Err:Ocurrió un error al actualizar el nombre.'], 500);
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

            return response()->json(["message" => "Se cambió la clave", "usuario" => $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar clave', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Err:Ocurrió un error al actualizar la clave.'], 500);
        }
    }

    /**
     * PUT /api/me/correo
     */
    public function updateEmail(UpdateCorreoRequest $request)
    {
        try {
            $usuario = Usuario::where('id', $request->id)->first();

            if (!$usuario) {
                return response()->json(["message" => "No existe el usuario"], 404);
            }

            //El hash se generó con el correo de ese momento: si el correo ya cambió,
            //el link deja de servir (evita reusar el mismo link firmado)
            if (!hash_equals(sha1($usuario->getEmailForVerification()), (string) $request->hash)) {
                return response()->json(["message" => "El link de cambio de correo ya no es válido"], 403);
            }

            $usuario->update($request->validated());

            return response()->json(["message" => "Se cambió el correo", "usuario" => $usuario], 200);
        } catch (\Throwable $e) {
            Log::error('Error al actualizar correo', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Err:Ocurrió un error al actualizar el correo.'], 500);
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

            return response()->json(["message" => "Err:error al enviar verificación de email"], 500);
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

            return response()->json(['message' => 'Err:Ocurrió un error al eliminar la cuenta.'], 500);
        }
    }
}
