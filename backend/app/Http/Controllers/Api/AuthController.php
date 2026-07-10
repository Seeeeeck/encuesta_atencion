<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class AuthController extends Controller
{
    /**
     * POST /api/register
     */
    public function register(RegisterRequest $request)
    {
        try {
            $datos = $request->validated();
            $datos['rol'] = 'usuario';

            $usuario = Usuario::create($datos);
            $usuario->sendEmailVerificationNotification();

            $token = $usuario->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'usuario' => $usuario,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Error al registrar usuario', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al registrar el usuario.'], 500);
        }
    }

    /**
     * POST /api/login
     */
    public function login(LoginRequest $request)
    {
        try {
            $autenticado = Auth::attempt([
                'correo' => $request->correo,
                'password' => $request->clave,
            ]);

            if (! $autenticado) {
                return response()->json(['message' => 'Credenciales inválidas.'], 401);
            }

            $usuario = Auth::user();
            $token = $usuario->createToken('auth-token')->plainTextToken;

            return response()->json([
                'token' => $token,
                'usuario' => $usuario,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error al iniciar sesión', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al iniciar sesión.'], 500);
        }
    }

    /**
     * POST /api/logout
     */
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Sesión cerrada correctamente.'], 200);
        } catch (\Throwable $e) {
            Log::error('Error al cerrar sesión', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(['message' => 'Ocurrió un error al cerrar sesión.'], 500);
        }
    }

    public function verifyEmail(Request $request)
    {

        try {
            $id = $request->id;
            $hash = $request->hash;

            $usuario = Usuario::where("id", $id)->first();

            if (!$usuario) {
                return response()->json(['message' => "No existe el usuairo"], 404);
            }

            if ($hash !== sha1($usuario->correo)) {
                return response()->json(
                    [
                        "message" => "La verificación no es auténtica",
                    ],
                    403
                );
            };

            $verified = $usuario->markEmailAsVerified();

            if (!$verified) {
                return response()->json([
                    'message' => 'Usuario no verificado',
                    'is_verified' => false
                ], 200);
            }

            return response()->json([
                'message' => 'Usuario verificado',
                'is_verified' => true
            ], 200);
        } catch (\Throwable $e) {

            Log::error('Error al verificar email', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json([
                "message" => "Se capturó un error no controlado al verificar email",
                
            ],500 );
        }
    }
}
