<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EncuestaController;
use App\Http\Controllers\Api\PerfilController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

//Api de autenticación
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});


//Api de usuario
Route::middleware(['auth:sanctum', 'throttle:60,1'])
    ->group(function () {
        //logout
        Route::post('/logout', [AuthController::class, 'logout']);
        //Cambios del perfil de usuario
        Route::get('/me', [PerfilController::class, 'show']);
        Route::delete('/me/eliminar/usuario', [PerfilController::class, 'destroy']);
        Route::put('/me/actualizar/nombre', [PerfilController::class, 'updateName']);
        Route::put('/me/actualizar/clave', [PerfilController::class, 'updatePassword']);
        Route::get('/me/actualizar/correo/verificacion', [PerfilController::class, 'updateEmailVerify']);
        //Manipulacion de encuesta
        Route::get("/encuesta/obtener/preguntas", [EncuestaController::class, 'obtenerPreguntas']);
        Route::post("/encuesta/enviar", [EncuestaController::class, 'enviarEncuesta']);
    });

//Api de firmas
Route::middleware(["signed", 'throttle:60,1'])->group(function () {
    Route::get('/email/verificar/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');
    //Hay que enviar en el request la firma
    Route::get('/me/actualizar/correo/verificacion/firma', [PerfilController::class, 'verificacionFirmaEmail'])->name("verification.verify.sign");
    Route::put('/me/actualizar/correo', [PerfilController::class, 'updateEmail'])->name('update.email');
});

//Api de admin
Route::middleware(['auth:sanctum', 'es_admin','throttle:60,1'])
    ->group(function () {
        Route::get("/admin/usuarios", [AdminController::class, 'listarUsuarios']);
        Route::get('/admin/usuarios/{id}/respuestas',[AdminController::class,'obtenerUsuarioRespuestas']);
    });

//TEST
Route::get("user/email", [PerfilController::class, "showUserByEmail"]);
Route::post("user/destroy", [PerfilController::class, "deleteUserByEmail"]);
