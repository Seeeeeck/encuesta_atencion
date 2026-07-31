<?php

namespace Tests\Feature\Api\admin\AdminController;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Database\Seeders\PreguntaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use PHPUnit\Framework\Attributes\DataProvider;
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

    public static function datosInvalidosProvider(): array
    {
        return [
            'id_faltante'    => ['id', null, 'id'],        // required
            'id_no_numerico' => ['id', 'abc', 'id'],       // numeric
            'id_no_existe'   => ['id', 999999, 'id'],      // exists:usuario,id
            'nombre_corto'        => ['nombre', 'ab', 'nombre'],                 // min:3
            'nombre_largo'        => ['nombre', str_repeat('a', 101), 'nombre'], // max:100
            'clave_corta'         => ['clave', 'Ab1!', 'clave'],                 // min:5
            'clave_sin_mayuscula' => ['clave', 'abcde!', 'clave'],               // regex mayúscula
            'clave_sin_simbolo'   => ['clave', 'Abcdef', 'clave'],
            'clave_larga' => ['clave', str_repeat('a', 98) . 'A1!', 'clave'], // max:100             // regex símbolo
            'edad_no_entero'      => ['edad', 'abc', 'edad'],                    // integer
            'edad_menor_a_min'    => ['edad', 0, 'edad'],                        // min:1
            'edad_mayor_a_max'    => ['edad', 201, 'edad'],                      // max:200
            'sexo_invalido'       => ['sexo', 'X', 'sexo'],                      // in:M,F,N/R
            'rol_invalido'        => ['rol', 'superadmin', 'rol'],               // in:admin,usuario
        ];
    }

    #[DataProvider('datosInvalidosProvider')]
    public function test_editar_usuario_datos_invalidos(string $campo, $valor, string $errorEsperado)
    {

        //Crear el usuario
        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $usuario = Usuario::create($this->datosValidosUsuario());
        $payload = [
            'id' => $usuario->id,
            $campo => $valor,
        ];

        $response = $this->put("/api/admin/usuario/editar", $payload, ["Authorization" => "Bearer $token"]);

        $response->assertStatus(422)->assertJsonValidationErrors($campo, "errors");
    }


    public static function datosValidosProvider(): array
    {
        return [
            // nombre: min:3, max:100
            'nombre_min'       => ['nombre', 'Ana', 'nombre'],
            'nombre_max'       => ['nombre', str_repeat('a', 100), 'nombre'],

            // clave: min:5, max:100, mayúscula + símbolo
            'clave_min'        => ['clave', 'Ab1!c', 'clave'],
            'clave_max'        => ['clave', str_repeat('a', 96) . 'Ab1!', 'clave'],

            // edad: nullable, integer, min:1, max:200
            'edad_min'         => ['edad', 1, 'edad'],
            'edad_max'         => ['edad', 200, 'edad'],

            // sexo: nullable, in:M,F,N/R
            'sexo_m'           => ['sexo', 'M', 'sexo'],
            'sexo_f'           => ['sexo', 'F', 'sexo'],
            'sexo_nr'          => ['sexo', 'N/R', 'sexo'],

            // rol: in:admin,usuario
            'rol_admin'        => ['rol', 'admin', 'rol'],
            'rol_usuario'      => ['rol', 'usuario', 'rol'],
        ];
    }

    #[DataProvider('datosValidosProvider')]
    public function test_editar_usuario_datos_validos(string $campo, $valor, string $error)
    {
        //Crear el usuario
        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $usuario = Usuario::create($this->datosValidosUsuario());
        $payload = [
            'id' => $usuario->id,
            $campo => $valor,
        ];

        $response = $this->put("/api/admin/usuario/editar", $payload, ["Authorization" => "Bearer $token"]);

        $user_db = Usuario::where("id", $usuario->id)->first();

        $response->assertStatus(200)->assertJson(
            [
                "message" => "Usuario actualizado",
                "usuario" => [
                    "id" => $user_db->id,
                    "nombre" => $user_db->nombre,
                    "correo" => $user_db->correo,
                    "edad" => $user_db->edad,
                    "sexo" => $user_db->sexo,
                    "rol" => $user_db->rol
                ]
            ]
        );
    }

    public function test_editar_usuario_ningun_valor_enviado()
    {
        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $usuario = Usuario::create($this->datosValidosUsuario());
        $payload = [
            'id' => $usuario->id
        ];

        $response = $this->put("/api/admin/usuario/editar", $payload, ["Authorization" => "Bearer $token"]);

        $response->assertStatus(422)->assertJsonValidationErrors("regla");
    }

    public function test_eliminar_usuario()
    {
        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $usuario = Usuario::create($this->datosValidosUsuario());

        $usuario->createToken('auth-token')->plainTextToken;

        $usuario->tokens()->delete();
        $user_tokens = $usuario->tokens()->count();

        $this->assertEquals(0, $user_tokens);

        $response = $this->delete("/api/admin/usuario/eliminar", ["id" => $usuario->id], ["Authorization" => "Bearer $token"]);

        $usuario_existe = Usuario::where("id", $usuario->id)->first();

        $this->assertNull($usuario_existe);

        $response->assertStatus(200);
    }

    public function test_eliminar_usuario_inexistente()
    {
        $user_admin = Usuario::create($this->datosValidosUsuarioAdmin());
        $token = $user_admin->createToken('token_admin')->plainTextToken;
        $response = $this->delete("/api/admin/usuario/eliminar", ["id" => 99999999999], ["Authorization" => "Bearer $token"]);

        $response->assertStatus(404);
    }
}
