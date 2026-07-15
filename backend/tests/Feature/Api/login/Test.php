<?php

namespace Tests\Feature\Api\Login;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    private function crearUsuario(array $overrides = []): Usuario
    {
        return Usuario::create(array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
        ], $overrides));
    }

    public function test_login_exitoso_devuelve_200_con_token_y_usuario(): void
    {
        $this->crearUsuario();

        $response = $this->postJson('/api/login', [
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'usuario' => ['id', 'nombre', 'correo', 'rol']])
            ->assertJsonMissingPath('usuario.clave');
    }

    public function test_login_genera_un_token_sanctum_real(): void
    {
        $usuario = $this->crearUsuario();

        $this->postJson('/api/login', [
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
        ]);

        $this->assertCount(1, $usuario->fresh()->tokens);
    }

    public function test_clave_incorrecta_devuelve_401(): void
    {
        $this->crearUsuario();

        $response = $this->postJson('/api/login', [
            'correo' => 'juan@example.com',
            'clave' => 'ClaveIncorrecta1!',
        ]);

        $response->assertStatus(401);
    }

    public function test_correo_inexistente_devuelve_401(): void
    {
        $response = $this->postJson('/api/login', [
            'correo' => 'no-existe@example.com',
            'clave' => 'Clave1!',
        ]);

        $response->assertStatus(401);
    }

    public function test_campos_obligatorios_faltantes_devuelve_422(): void
    {
        $response = $this->postJson('/api/login', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['correo', 'clave']);
    }
}
