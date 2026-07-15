<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PerfilController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);



Route::middleware("signed")->group(function () {
    Route::get('/email/verificar/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verification.verify');

    //Hay que enviar en el request la firma
    Route::get('/me/actualizar/correo/verificacion/firma', [PerfilController::class, 'verificacionFirmaEmail'])->name("verification.verify.sign");
   
    Route::put('/me/actualizar/correo', [PerfilController::class, 'updateEmail'])->name('update.email');

});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [PerfilController::class, 'show']);
    Route::delete('/me', [PerfilController::class, 'destroy']);

    Route::put('/me/actualizar/nombre', [PerfilController::class, 'updateName']);

    Route::put('/me/actualizar/clave', [PerfilController::class, 'updatePassword']);

    Route::get('/me/actualizar/correo/verificacion', [PerfilController::class, 'updateEmailVerify']);

    Route::post('/destroy/user', [PerfilController::class, 'destroy']);
});



//TEST
Route::get("user/email", [PerfilController::class, "showUserByEmail"]);
Route::post("user/destroy", [PerfilController::class, "deleteUserByEmail"]);
