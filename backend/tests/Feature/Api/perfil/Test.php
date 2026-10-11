<?php

namespace Tests\Feature\Api\Perfil;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    // Casos de uso cubiertos:
    // GET /api/me
    // - ver el propio perfil → 200 con sus datos y sin la clave
    // - sin token → 401
    // PUT /api/me/actualizar/nombre
    // - nombre válido → 200 y queda guardado
    // - nombre faltante / corto / largo → 422
    // - sin token → 401
    // PUT /api/me/actualizar/clave
    // - clave actual correcta → 200, se puede entrar con la nueva y no con la vieja
    // - clave actual incorrecta → 401 y la clave no cambia
    // - clave nueva inválida (faltante, corta, larga, sin mayúscula, sin símbolo) o clave actual faltante → 422
    // - sin token → 401
    // DELETE /api/me/eliminar/usuario
    // - borra el usuario y revoca sus tokens → 200
    // - borra en cascada su encuesta y respuestas
    // - el token ya no sirve después de eliminar la cuenta → 401
    // - sin token → 401

    private const CLAVE = 'Clave1!';

    private function crearUsuario(array $overrides = []): Usuario
    {
        return Usuario::create(array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => self::CLAVE,
            'edad' => 25,
            'sexo' => 'M',
        ], $overrides));
    }

    private function headers(Usuario $usuario): array
    {
        $token = $usuario->createToken('auth-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }

    //Dentro de un mismo test Laravel reutiliza la app entre requests: el middleware auth:sanctum
    //deja 'sanctum' como guard por defecto y recuerda al usuario autenticado. Se reinicia para que
    //la siguiente request arranque de cero, como pasa en la realidad (una app nueva por request)
    private function reiniciarAuth(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');
    }

    // ---------- GET /api/me ----------

    public function test_ver_perfil_devuelve_datos_sin_clave(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->getJson('/api/me', $this->headers($usuario));

        $response->assertStatus(200)
            ->assertJson([
                'id' => $usuario->id,
                'nombre' => 'Juan Pérez',
                'correo' => 'juan@example.com',
                'rol' => 'usuario',
            ])
            ->assertJsonMissingPath('clave');
    }

    public function test_ver_perfil_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    // ---------- PUT /api/me/actualizar/nombre ----------

    public function test_actualizar_nombre_exitoso(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson('/api/me/actualizar/nombre', ['nombre' => 'Ana López'], $this->headers($usuario));

        $response->assertStatus(200)
            ->assertJsonPath('usuario.nombre', 'Ana López')
            ->assertJsonMissingPath('usuario.clave');
        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'nombre' => 'Ana López']);
    }

    public static function nombresInvalidosProvider(): array
    {
        return [
            'nombre_faltante' => [null],
            'nombre_corto' => ['ab'],
            'nombre_largo' => [str_repeat('a', 101)],
        ];
    }

    #[DataProvider('nombresInvalidosProvider')]
    public function test_actualizar_nombre_invalido_devuelve_422($nombre): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson('/api/me/actualizar/nombre', ['nombre' => $nombre], $this->headers($usuario));

        $response->assertStatus(422)->assertJsonValidationErrors('nombre');
        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'nombre' => 'Juan Pérez']);
    }

    public function test_actualizar_nombre_sin_token_devuelve_401(): void
    {
        $this->putJson('/api/me/actualizar/nombre', ['nombre' => 'Ana López'])->assertStatus(401);
    }

    // ---------- PUT /api/me/actualizar/clave ----------

    public function test_actualizar_clave_exitoso_permite_login_con_la_nueva(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson('/api/me/actualizar/clave', [
            'clave_actual' => self::CLAVE,
            'clave_nueva' => 'Nueva456#',
        ], $this->headers($usuario));

        $response->assertStatus(200)->assertJsonMissingPath('usuario.clave');
        $this->assertTrue(Hash::check('Nueva456#', $usuario->fresh()->clave));

        $this->reiniciarAuth();
        $this->postJson('/api/login', ['correo' => 'juan@example.com', 'clave' => 'Nueva456#'])->assertStatus(200);
        $this->postJson('/api/login', ['correo' => 'juan@example.com', 'clave' => self::CLAVE])->assertStatus(401);
    }

    public function test_actualizar_clave_con_clave_actual_incorrecta_devuelve_401(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson('/api/me/actualizar/clave', [
            'clave_actual' => 'NoEsLaClave!',
            'clave_nueva' => 'Nueva456#',
        ], $this->headers($usuario));

        $response->assertStatus(401);
        $this->assertTrue(Hash::check(self::CLAVE, $usuario->fresh()->clave));
    }

    public static function clavesInvalidasProvider(): array
    {
        return [
            'clave_actual_faltante' => [['clave_nueva' => 'Nueva456#'], 'clave_actual'],
            'clave_nueva_faltante' => [['clave_actual' => self::CLAVE], 'clave_nueva'],
            'clave_nueva_corta' => [['clave_actual' => self::CLAVE, 'clave_nueva' => 'Ab1!'], 'clave_nueva'],
            'clave_nueva_larga' => [['clave_actual' => self::CLAVE, 'clave_nueva' => str_repeat('a', 98) . 'A1!'], 'clave_nueva'],
            'clave_nueva_sin_mayuscula' => [['clave_actual' => self::CLAVE, 'clave_nueva' => 'nueva456#'], 'clave_nueva'],
            'clave_nueva_sin_simbolo' => [['clave_actual' => self::CLAVE, 'clave_nueva' => 'Nueva456'], 'clave_nueva'],
        ];
    }

    #[DataProvider('clavesInvalidasProvider')]
    public function test_actualizar_clave_invalida_devuelve_422(array $payload, string $campoConError): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson('/api/me/actualizar/clave', $payload, $this->headers($usuario));

        $response->assertStatus(422)->assertJsonValidationErrors($campoConError);
    }

    public function test_actualizar_clave_sin_token_devuelve_401(): void
    {
        $this->putJson('/api/me/actualizar/clave', [
            'clave_actual' => self::CLAVE,
            'clave_nueva' => 'Nueva456#',
        ])->assertStatus(401);
    }

    // ---------- DELETE /api/me/eliminar/usuario ----------

    public function test_eliminar_cuenta_borra_usuario_y_tokens(): void
    {
        $usuario = $this->crearUsuario();
        $usuario->createToken('otro-dispositivo');

        $response = $this->deleteJson('/api/me/eliminar/usuario', [], $this->headers($usuario));

        $response->assertStatus(200);
        $this->assertDatabaseMissing('usuario', ['id' => $usuario->id]);
        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => Usuario::class,
            'tokenable_id' => $usuario->id,
        ]);
    }

    public function test_eliminar_cuenta_borra_encuesta_y_respuestas_en_cascada(): void
    {
        $usuario = $this->crearUsuario();
        $pregunta = Pregunta::create(['pregunta_texto' => 'Pregunta', 'tipo' => 'P']);
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id, 'is_ok' => true]);
        Respuesta::create(['id_encuesta' => $encuesta->id, 'id_pregunta' => $pregunta->id, 'respuesta' => 3]);

        $this->deleteJson('/api/me/eliminar/usuario', [], $this->headers($usuario))->assertStatus(200);

        $this->assertDatabaseMissing('encuesta', ['id' => $encuesta->id]);
        $this->assertDatabaseMissing('respuesta', ['id_encuesta' => $encuesta->id]);
    }

    public function test_token_no_sirve_despues_de_eliminar_la_cuenta(): void
    {
        $usuario = $this->crearUsuario();
        $headers = $this->headers($usuario);

        $this->deleteJson('/api/me/eliminar/usuario', [], $headers)->assertStatus(200);

        $this->reiniciarAuth();

        $this->getJson('/api/me', $headers)->assertStatus(401);
    }

    public function test_eliminar_cuenta_sin_token_devuelve_401(): void
    {
        $this->deleteJson('/api/me/eliminar/usuario')->assertStatus(401);
    }
}
