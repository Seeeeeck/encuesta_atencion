<?php

namespace Tests\Feature\Api\encuesta;

use App\Models\Pregunta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PhpParser\Node\Expr\Cast\Object_;
use Tests\TestCase;

class Test extends TestCase
{
    /**
     * A basic feature test example.
     */
    use RefreshDatabase;

    public function obtenerUsuario(): array
    {
        return [
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
            'edad' => 25,
            'sexo' => 'M',
        ];
    }

    public function listarPreguntas(): array
    {
        return [
            [
                'id' => 1,
                'pregunta_texto' => 'Suelo revisar mis redes sociales o notificaciones sin haber decidido conscientemente hacerlo.',
                'tipo' => 'N',
            ],
            [
                'id' => 2,
                'pregunta_texto' => 'Cuando termino de usar el celular o de jugar, puedo retomar rápidamente la concentración en lo que estaba haciendo.',
                'tipo' => 'P',
            ],
            [
                'id' => 3,
                'pregunta_texto' => 'Siento la necesidad de mantener rachas (streaks), abrir loot o revisar notificaciones aunque no tenga ganas reales de usar la app.',
                'tipo' => 'N',
            ],
            [
                'id' => 4,
                'pregunta_texto' => 'Puedo pasar varias horas sin revisar mis redes o notificaciones sin sentir ansiedad.',
                'tipo' => 'P',
            ],
            [
                'id' => 5,
                'pregunta_texto' => 'Siento que soy yo quien decide cuándo y cuánto uso mis redes sociales o videojuegos, no la aplicación.',
                'tipo' => 'P',
            ],
            [
                'id' => 6,
                'pregunta_texto' => 'Cuando he intentado reducir mi tiempo en redes o videojuegos, me ha costado mantenerlo.',
                'tipo' => 'N',
            ],
            [
                'id' => 7,
                'pregunta_texto' => 'El scroll infinito o el diseño de las apps que uso hace que pierda la noción del tiempo.',
                'tipo' => 'N',
            ],
            [
                'id' => 8,
                'pregunta_texto' => 'Puedo concentrarme en actividades largas (leer, estudiar, trabajar) sin sentir el impulso de revisar el celular.',
                'tipo' => 'P',
            ],
            [
                'id' => 9,
                'pregunta_texto' => 'Cuando estoy sin mi celular o sin poder jugar, me siento incómodo/a o inquieto/a.',
                'tipo' => 'N',
            ],
            [
                'id' => 10,
                'pregunta_texto' => 'Considero que el uso de redes sociales o videojuegos no afecta mi capacidad de concentración en el día a día.',
                'tipo' => 'P',
            ],
        ];
    }



    public function listarRespuestasEnviar(): array
    {
        return  [
            ['id_pregunta' => 1, 'numero_respuesta' => 1],
            ['id_pregunta' => 2, 'numero_respuesta' => 2],
            ['id_pregunta' => 3, 'numero_respuesta' => 3],
            ['id_pregunta' => 4, 'numero_respuesta' => 4],
            ['id_pregunta' => 5, 'numero_respuesta' => 5],
            ['id_pregunta' => 6, 'numero_respuesta' => 1],
            ['id_pregunta' => 7, 'numero_respuesta' => 2],
            ['id_pregunta' => 8, 'numero_respuesta' => 3],
            ['id_pregunta' => 9, 'numero_respuesta' => 4],
            ['id_pregunta' => 10, 'numero_respuesta' => 5],
        ];
    }


    public function test_obtener_preguntas(): void
    {
        $preguntas = $this->listarPreguntas();
        $this->seed(\Database\Seeders\PreguntaSeeder::class);
        $response = $this->postJson("/api/register", $this->obtenerUsuario());
        $response->assertStatus(201);
        $token = $response->json()['token'];
        $response = $this->get('/api/encuesta/obtener/preguntas', ['Authorization' => 'Bearer ' . $token]);

     
        $this->assertEquals($response->json()['preguntas'], $preguntas);
        $response->assertStatus(200);
    }

    public function test_enviar_encuesta(): void
    {
        Pregunta::truncate();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $response = $this->postJson("/api/register", $this->obtenerUsuario());
        $response->assertStatus(201);
        $token = $response->json()['token'];
        $response = $this->postJson("/api/encuesta/enviar", ['respuestas' => $this->listarRespuestasEnviar()], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(200);
    }

    public function test_obtener_preguntas_sin_auth(): void
    {
        $response = $this->getJson('/api/encuesta/obtener/preguntas');
        $response->assertStatus(401);
        $response->assertJson(['message' => 'No autenticado.']);
    }

    public function test_enviar_encuesta_sin_auth(): void
    {
        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $this->listarRespuestasEnviar()]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'No autenticado.']);
    }

    private function registrarYObtenerToken(): string
    {
        $response = $this->postJson('/api/register', $this->obtenerUsuario());
        $response->assertStatus(201);

        return $response->json()['token'];
    }

    public function test_enviar_encuesta_incompleta(): void
    {
        Pregunta::truncate();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $token = $this->registrarYObtenerToken();

        $respuestas = $this->listarRespuestasEnviar();
        array_pop($respuestas);

        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $respuestas], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(422);
    }

    public function test_enviar_encuesta_respuesta_sobrante(): void
    {
        Pregunta::truncate();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $token = $this->registrarYObtenerToken();

        $respuestas = $this->listarRespuestasEnviar();
        $respuestas[] = ['id_pregunta' => 11, 'numero_respuesta' => 1];

        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $respuestas], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(422);
    }

    public function test_enviar_encuesta_numero_respuesta_fuera_de_rango(): void
    {
        Pregunta::truncate();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $token = $this->registrarYObtenerToken();

        $respuestas = $this->listarRespuestasEnviar();
        $respuestas[0]['numero_respuesta'] = 0;

        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $respuestas], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(422);

        $respuestas[0]['numero_respuesta'] = 6;

        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $respuestas], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(422);
    }

    public function test_enviar_encuesta_respuesta_duplicada(): void
    {
        Pregunta::truncate();
        $this->seed(\Database\Seeders\DatabaseSeeder::class);
        $token = $this->registrarYObtenerToken();

        $respuestas = $this->listarRespuestasEnviar();
        array_pop($respuestas);
        $respuestas[] = ['id_pregunta' => 1, 'numero_respuesta' => 3];

        $response = $this->postJson('/api/encuesta/enviar', ['respuestas' => $respuestas], ['Authorization' => 'Bearer ' . $token]);
        $response->assertStatus(422);
    }
}
