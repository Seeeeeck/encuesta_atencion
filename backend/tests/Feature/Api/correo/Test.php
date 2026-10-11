<?php

namespace Tests\Feature\Api\Correo;

use App\Models\Usuario;
use App\Notifications\VerificarCambioCorreo;
use App\Notifications\VerificarCorreo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    // Casos de uso cubiertos:
    // Verificación de correo al registrarse
    // - el registro manda el mail de verificación
    // - GET /api/email/verificar/{id}/{hash} con link válido → 200 e is_verified = true
    // - hash que no corresponde al correo → 403
    // - firma alterada / link vencido / sin firma → 403
    // - usuario inexistente → 404
    // Cambio de correo
    // - GET /api/me/actualizar/correo/verificacion manda el mail → 200 (sin token → 401)
    // - GET /api/me/actualizar/correo/verificacion/firma con firma válida → 200; alterada o vencida → 403
    // - PUT /api/me/actualizar/correo con link válido → 200 y el correo cambia
    // - el mismo link usado dos veces → 403 (un solo uso)
    // - link armado con el hash de otro correo → 403
    // - firma alterada / link vencido → 403
    // - correo inválido, faltante o de otra cuenta → 422
    // - usuario inexistente → 404

    private function crearUsuario(array $overrides = []): Usuario
    {
        return Usuario::create(array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
        ], $overrides));
    }

    private function headers(Usuario $usuario): array
    {
        $token = $usuario->createToken('auth-token')->plainTextToken;
        return ['Authorization' => "Bearer $token"];
    }

    //Arma el mismo link firmado que mandan las notificaciones
    private function urlFirmada(string $ruta, int $id, string $correo, int $minutos = 60): string
    {
        return URL::temporarySignedRoute($ruta, now()->addMinutes($minutos), [
            'id' => $id,
            'hash' => sha1($correo),
        ]);
    }

    // ---------- Verificación de correo (registro) ----------

    public function test_registro_envia_mail_de_verificacion(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
        ])->assertStatus(201);

        Notification::assertSentTo(Usuario::where('correo', 'juan@example.com')->first(), VerificarCorreo::class);
    }

    public function test_verificar_correo_exitoso(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->getJson($this->urlFirmada('verification.verify', $usuario->id, $usuario->correo));

        $response->assertStatus(200)->assertJson(['is_verified' => true]);
        $this->assertTrue($usuario->fresh()->is_verified);
    }

    public function test_verificar_correo_con_hash_de_otro_correo_devuelve_403(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->getJson($this->urlFirmada('verification.verify', $usuario->id, 'otro@example.com'));

        $response->assertStatus(403);
        $this->assertFalse($usuario->fresh()->is_verified);
    }

    public function test_verificar_correo_usuario_inexistente_devuelve_404(): void
    {
        $this->getJson($this->urlFirmada('verification.verify', 999999, 'nadie@example.com'))->assertStatus(404);
    }

    public static function linksInvalidosProvider(): array
    {
        return [
            'firma_alterada' => ['alterada'],
            'link_vencido' => ['vencido'],
            'sin_firma' => ['sin_firma'],
        ];
    }

    //Devuelve el link firmado roto según el caso del provider
    private function urlInvalida(string $caso, string $ruta, Usuario $usuario): string
    {
        return match ($caso) {
            'alterada' => $this->urlFirmada($ruta, $usuario->id, $usuario->correo) . 'x',
            'vencido' => $this->urlFirmada($ruta, $usuario->id, $usuario->correo, -1),
            'sin_firma' => preg_replace('/&?signature=[^&]+/', '', $this->urlFirmada($ruta, $usuario->id, $usuario->correo)),
        };
    }

    #[DataProvider('linksInvalidosProvider')]
    public function test_verificar_correo_con_link_invalido_devuelve_403(string $caso): void
    {
        $usuario = $this->crearUsuario();

        $this->getJson($this->urlInvalida($caso, 'verification.verify', $usuario))->assertStatus(403);
        $this->assertFalse($usuario->fresh()->is_verified);
    }

    // ---------- Solicitar cambio de correo ----------

    public function test_solicitar_cambio_de_correo_envia_mail(): void
    {
        Notification::fake();
        $usuario = $this->crearUsuario();

        $response = $this->getJson('/api/me/actualizar/correo/verificacion', $this->headers($usuario));

        $response->assertStatus(200);
        Notification::assertSentTo($usuario, VerificarCambioCorreo::class);
    }

    public function test_solicitar_cambio_de_correo_sin_token_devuelve_401(): void
    {
        $this->getJson('/api/me/actualizar/correo/verificacion')->assertStatus(401);
    }

    // ---------- Verificar firma del cambio de correo ----------

    public function test_firma_de_cambio_de_correo_valida(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->getJson($this->urlFirmada('verification.verify.sign', $usuario->id, $usuario->correo));

        $response->assertStatus(200)->assertJson(['message' => 'firma verificada']);
    }

    #[DataProvider('linksInvalidosProvider')]
    public function test_firma_de_cambio_de_correo_invalida_devuelve_403(string $caso): void
    {
        $usuario = $this->crearUsuario();

        $this->getJson($this->urlInvalida($caso, 'verification.verify.sign', $usuario))->assertStatus(403);
    }

    // ---------- PUT /api/me/actualizar/correo ----------

    public function test_actualizar_correo_exitoso(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson(
            $this->urlFirmada('update.email', $usuario->id, $usuario->correo),
            ['correo' => 'nuevo@example.com']
        );

        $response->assertStatus(200)->assertJsonPath('usuario.correo', 'nuevo@example.com');
        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'correo' => 'nuevo@example.com']);
    }

    public function test_actualizar_correo_link_reusado_devuelve_403(): void
    {
        $usuario = $this->crearUsuario();
        $url = $this->urlFirmada('update.email', $usuario->id, $usuario->correo);

        $this->putJson($url, ['correo' => 'nuevo@example.com'])->assertStatus(200);
        $this->putJson($url, ['correo' => 'otro@example.com'])->assertStatus(403);

        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'correo' => 'nuevo@example.com']);
    }

    public function test_actualizar_correo_con_hash_de_otro_correo_devuelve_403(): void
    {
        $usuario = $this->crearUsuario();

        $response = $this->putJson(
            $this->urlFirmada('update.email', $usuario->id, 'otro@example.com'),
            ['correo' => 'nuevo@example.com']
        );

        $response->assertStatus(403);
        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'correo' => 'juan@example.com']);
    }

    #[DataProvider('linksInvalidosProvider')]
    public function test_actualizar_correo_con_link_invalido_devuelve_403(string $caso): void
    {
        $usuario = $this->crearUsuario();

        $this->putJson($this->urlInvalida($caso, 'update.email', $usuario), ['correo' => 'nuevo@example.com'])
            ->assertStatus(403);
        $this->assertDatabaseHas('usuario', ['id' => $usuario->id, 'correo' => 'juan@example.com']);
    }

    public static function correosInvalidosProvider(): array
    {
        return [
            'correo_faltante' => [null],
            'correo_formato_invalido' => ['no-es-un-correo'],
            'correo_de_otra_cuenta' => ['ocupado@example.com'],
        ];
    }

    #[DataProvider('correosInvalidosProvider')]
    public function test_actualizar_correo_invalido_devuelve_422($correo): void
    {
        $usuario = $this->crearUsuario();
        $this->crearUsuario(['correo' => 'ocupado@example.com']);

        $response = $this->putJson(
            $this->urlFirmada('update.email', $usuario->id, $usuario->correo),
            ['correo' => $correo]
        );

        $response->assertStatus(422)->assertJsonValidationErrors('correo');
    }

    public function test_actualizar_correo_usuario_inexistente_devuelve_404(): void
    {
        $response = $this->putJson(
            $this->urlFirmada('update.email', 999999, 'nadie@example.com'),
            ['correo' => 'nuevo@example.com']
        );

        $response->assertStatus(404);
    }
}
