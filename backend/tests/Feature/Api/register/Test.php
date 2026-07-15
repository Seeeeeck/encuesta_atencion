<?php

namespace Tests\Feature\Api\Register;

use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
            'edad' => 25,
            'sexo' => 'M',
        ], $overrides);
    }

    public function test_registro_exitoso_devuelve_201_con_token_y_usuario(): void
    {
        $response = $this->postJson('/api/register', $this->datosValidos());

        $response->assertStatus(201)
            ->assertJsonStructure(['token', 'usuario' => ['id', 'nombre', 'correo', 'rol']])
            ->assertJsonMissingPath('usuario.clave');

        $this->assertDatabaseHas('usuario', [
            'correo' => 'juan@example.com',
            'rol' => 'usuario',
        ]);
    }

    public function test_registro_genera_un_token_sanctum_real(): void
    {
        $this->postJson('/api/register', $this->datosValidos());

        $usuario = Usuario::where('correo', 'juan@example.com')->first();

        $this->assertCount(1, $usuario->tokens);
    }

    public function test_el_rol_no_se_puede_forzar_desde_el_body(): void
    {
        $response = $this->postJson('/api/register', $this->datosValidos(['rol' => 'admin']));

        $response->assertStatus(201);

        $this->assertDatabaseHas('usuario', [
            'correo' => 'juan@example.com',
            'rol' => 'usuario',
        ]);
    }

    public function test_correo_duplicado_devuelve_422(): void
    {
        Usuario::create([
            'nombre' => 'Otro usuario',
            'correo' => 'juan@example.com',
            'clave' => 'Otraclave1!',
        ]);

        $response = $this->postJson('/api/register', $this->datosValidos());

        $response->assertStatus(422)
            ->assertJsonValidationErrors('correo');
    }

    public function test_campos_obligatorios_faltantes_devuelve_422(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'correo', 'clave']);
    }
}
