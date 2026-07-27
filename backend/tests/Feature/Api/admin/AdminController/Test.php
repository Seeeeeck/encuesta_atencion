<?php

namespace Tests\Feature\Api\admin\AdminController;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Database\Seeders\PreguntaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class Test extends TestCase
{
    /**
     * A basic feature test example.
     */

    use RefreshDatabase;

    private function datosValidosUsuarioAdmin(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
            'edad' => 25,
            'sexo' => 'M',
            'rol' => 'admin'
        ], $overrides);
    }
    private function datosValidosUsuario(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example2.com',
            'clave' => 'Clave1!',
            'edad' => 25,
            'sexo' => 'M',
            'rol' => 'usuario'
        ], $overrides);
    }


    public function test_listar_usuarios(): void
    {

        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $response = $this->get('/api/admin/usuarios', ['Authorization' => "Bearer $token"]);
        $response->assertStatus(200);
    }

    public function test_usuarios_authorization()
    {
        $usuario = Usuario::create($this->datosValidosUsuario());
        $token_usuario = $usuario->createToken('token_admin')->plainTextToken;
        $response = $this->get('/api/admin/usuarios', ['Authorization' => "Bearer $token_usuario"]);
        $response->assertStatus(403);
    }

    public function test_listar_usuarios_sin_token()
    {

        $response = $this->get('/api/admin/usuarios', ['Authorization' => "Bearer token_12312312easdsadfalso"]);
        $response->assertStatus(401);
    }

    public function test_obtener_respuestas_sin_encuesta()
    {
        Pregunta::truncate();
        $seeder = new PreguntaSeeder();
        $seeder->run();

        $usuario_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $usuario_admin->createToken("token")->plainTextToken;
        $usuario_admin_id = $usuario_admin->id;


        $response = $this->get("/api/admin/usuarios/$usuario_admin_id/respuestas", ["Authorization" => "Bearer $token"]);

        $response->assertStatus(404);
    }

    public function test_obtener_respuestas_sin_respuestas()
    {
        Pregunta::truncate();
        $seeder = new PreguntaSeeder();
        $seeder->run();

        $usuario_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $usuario_admin->createToken("token")->plainTextToken;
        $usuario_admin_id = $usuario_admin->id;
        $encuesta = Encuesta::factory()->for($usuario_admin, 'usuario')->create();
       

        $response = $this->get("/api/admin/usuarios/$usuario_admin_id/respuestas", ["Authorization" => "Bearer $token"]);

     
        $response->assertStatus(404);
    }

    public function test_obtener_respuestas_por_id_usuario()
    {
        Pregunta::truncate();
        $seeder = new PreguntaSeeder();
        $seeder->run();

        $usuario_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $usuario_admin->createToken("token")->plainTextToken;
        $usuario_admin_id = $usuario_admin->id;
        $encuesta = Encuesta::factory()->for($usuario_admin, 'usuario')->create();
        $respuestas = Respuesta::factory(10)->for($encuesta, 'encuesta')->sequence(
            ['id_pregunta' => 1],
            ['id_pregunta' => 2],
            ['id_pregunta' => 3],
            ['id_pregunta' => 4],
            ['id_pregunta' => 5],
            ['id_pregunta' => 6],
            ['id_pregunta' => 7],
            ['id_pregunta' => 8],
            ['id_pregunta' => 9],
            ['id_pregunta' => 10],


        )->create();

        $response = $this->get("/api/admin/usuarios/$usuario_admin_id/respuestas", ["Authorization" => "Bearer $token"]);

        $response->assertJsonCount(10, 'respuestas');
        $response->assertStatus(200);
    }

    public function test_obtener_respuestas_id_equivocado_token_valido()
    {
        Pregunta::truncate();
        $seeder = new PreguntaSeeder();
        $seeder->run();

        $usuario_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $usuario_admin->createToken("token")->plainTextToken;

        $encuesta = Encuesta::factory()->for($usuario_admin, 'usuario')->create();
        $respuestas = Respuesta::factory(10)->for($encuesta, 'encuesta')->sequence(
            ['id_pregunta' => 1],
            ['id_pregunta' => 2],
            ['id_pregunta' => 3],
            ['id_pregunta' => 4],
            ['id_pregunta' => 5],
            ['id_pregunta' => 6],
            ['id_pregunta' => 7],
            ['id_pregunta' => 8],
            ['id_pregunta' => 9],
            ['id_pregunta' => 10],


        )->create();
        $response = $this->get("/api/admin/usuarios/2000/respuestas", ["Authorization" => "Bearer $token"]);
        $response->assertStatus(404);
    }

    public function test_obtener_respuestas_sin_token()
    {
        $response = $this->get("/api/admin/usuarios/23/respuestas", ["Authorization" => "Bearer 123123123123123"]);
        $response->assertStatus(401);
    }

    public function test_obtener_respuestas_usuario_normal_sin_permiso()
    {
        Pregunta::truncate();
        $seeder = new PreguntaSeeder();
        $seeder->run();

        $usuario_admin = Usuario::create($this->datosValidosUsuario());
        $token = $usuario_admin->createToken("token")->plainTextToken;
        $usuario_admin_id = $usuario_admin->id;
        $encuesta = Encuesta::factory()->for($usuario_admin, 'usuario')->create();
        $respuestas = Respuesta::factory(10)->for($encuesta, 'encuesta')->sequence(
            ['id_pregunta' => 1],
            ['id_pregunta' => 2],
            ['id_pregunta' => 3],
            ['id_pregunta' => 4],
            ['id_pregunta' => 5],
            ['id_pregunta' => 6],
            ['id_pregunta' => 7],
            ['id_pregunta' => 8],
            ['id_pregunta' => 9],
            ['id_pregunta' => 10],


        )->create();

        $response = $this->get("/api/admin/usuarios/$usuario_admin_id/respuestas", ["Authorization" => "Bearer $token"]);

        $response->assertStatus(403);
    }
}
