<?php

namespace Tests\Feature\Api\Logout;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    // TODO: escribir tests para POST /api/logout
    // - logout exitoso con token valido → 200
    // - logout sin token → 401
    // - logout con token invalido → 401

    public function test_logout_user()
    {

        $usuario = Usuario::create([
            "nombre" => "Tester",
            "correo" => "testuser@gmail.com",
            "clave" => "TestUser123.",
            "sexo" => "M",
            "edad" => 20
        ]);

        $token = $usuario->createToken('auth-token')->plainTextToken;

        $response = $this->postJson('/api/logout', [], [
            'Authorization' => "Bearer $token"
        ]);

        return $response->assertStatus(200);
    }

    public function test_sin_token(){
        
        $response=$this->postJson('/api/logout');
        return $response->assertStatus(401);
    }

}
