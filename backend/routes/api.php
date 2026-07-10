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
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [PerfilController::class, 'show']);
    Route::delete('/me', [PerfilController::class, 'destroy']);

    Route::put('/me/nombre', [PerfilController::class, 'updateName']);
    Route::put('/me/clave', [PerfilController::class, 'updatePassword']);
    Route::put('/me/correo', [PerfilController::class, 'updateEmail']);
});
