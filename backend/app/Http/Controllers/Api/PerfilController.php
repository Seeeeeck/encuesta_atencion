<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateClaveRequest;
use App\Http\Requests\UpdateCorreoRequest;
use App\Http\Requests\UpdateNombreRequest;
use Illuminate\Http\Request;
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

            return response()->json($usuario, 200);
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
            $usuario = $request->user();
            $usuario->update($request->validated());

            return response()->json($usuario, 200);
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
            $usuario = $request->user();
            $usuario->update($request->validated());

            return response()->json($usuario, 200);
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
}
