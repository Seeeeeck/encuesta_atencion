<?php

namespace Tests\Feature\Api\admin\MetricasController;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Test extends TestCase
{
    use RefreshDatabase;

    private function tokenAdmin(): string
    {
        $admin = Usuario::factory()->create(['rol' => 'admin']);
        return $admin->createToken('token_admin')->plainTextToken;
    }

    //Crea un usuario con su encuesta y una respuesta por pregunta ([id_pregunta => valor])
    private function usuarioConEncuesta(array $datosUsuario, array $respuestas, bool $isOk = true): Usuario
    {
        $usuario = Usuario::factory()->create($datosUsuario);
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id, 'is_ok' => $isOk]);

        foreach ($respuestas as $idPregunta => $valor) {
            Respuesta::create([
                'id_encuesta' => $encuesta->id,
                'id_pregunta' => $idPregunta,
                'respuesta' => $valor,
            ]);
        }

        return $usuario;
    }

    public function test_metricas_sin_token(): void
    {
        $response = $this->getJson('/api/admin/metricas');
        $response->assertStatus(401);
    }

    public function test_metricas_usuario_normal_sin_permiso(): void
    {
        $usuario = Usuario::factory()->create();
        $token = $usuario->createToken('token')->plainTextToken;

        $response = $this->getJson('/api/admin/metricas', ['Authorization' => "Bearer $token"]);
        $response->assertStatus(403);
    }

    public function test_metricas_sin_respuestas(): void
    {
        $pregunta = Pregunta::create(['pregunta_texto' => 'Pregunta sin respuestas', 'tipo' => 'P']);

        $response = $this->getJson('/api/admin/metricas', ['Authorization' => "Bearer {$this->tokenAdmin()}"]);

        $response->assertStatus(200)
            ->assertJsonPath('metricas.resumen.total_encuestas', 0)
            ->assertJsonPath('metricas.resumen.indice_atencion_general', null)
            ->assertJsonPath('metricas.por_pregunta.0.id_pregunta', $pregunta->id)
            ->assertJsonPath('metricas.por_pregunta.0.total_respuestas', 0)
            ->assertJsonPath('metricas.por_pregunta.0.promedio', null)
            ->assertJsonPath('metricas.por_pregunta.0.distribucion', ['1' => 0, '2' => 0, '3' => 0, '4' => 0, '5' => 0])
            ->assertJsonCount(6, 'metricas.por_edad')
            ->assertJsonCount(4, 'metricas.por_sexo');
    }

    public function test_metricas_calculos(): void
    {
        $positiva = Pregunta::create(['pregunta_texto' => 'Positiva', 'tipo' => 'P']);
        $negativa = Pregunta::create(['pregunta_texto' => 'Negativa', 'tipo' => 'N']);

        //Ajustados (negativa = 6 - valor): usuario 1 → 5 y 5; usuario 2 → 2 y 2
        $this->usuarioConEncuesta(
            ['edad' => 20, 'sexo' => 'M'],
            [$positiva->id => 5, $negativa->id => 1],
        );
        $this->usuarioConEncuesta(
            ['edad' => 40, 'sexo' => 'F'],
            [$positiva->id => 2, $negativa->id => 4],
            false
        );

        $response = $this->getJson('/api/admin/metricas', ['Authorization' => "Bearer {$this->tokenAdmin()}"]);
        $response->assertStatus(200);

        $metricas = $response->json('metricas');

        $this->assertSame([
            'total_usuarios' => 2,
            'total_encuestas' => 2,
            'encuestas_completadas' => 1,
            'indice_atencion_general' => 3.5,
        ], $metricas['resumen']);

        $porPregunta = collect($metricas['por_pregunta'])->keyBy('id_pregunta');

        $this->assertEquals(3.5, $porPregunta[$positiva->id]['promedio']);
        $this->assertEquals(3.5, $porPregunta[$positiva->id]['promedio_ajustado']);
        $this->assertSame(['1' => 0, '2' => 1, '3' => 0, '4' => 0, '5' => 1], $porPregunta[$positiva->id]['distribucion']);

        $this->assertEquals(2.5, $porPregunta[$negativa->id]['promedio']);
        $this->assertEquals(3.5, $porPregunta[$negativa->id]['promedio_ajustado']);
        $this->assertSame(['1' => 1, '2' => 0, '3' => 0, '4' => 1, '5' => 0], $porPregunta[$negativa->id]['distribucion']);

        $porEdad = collect($metricas['por_edad'])->keyBy('rango');
        $this->assertEquals(['rango' => '18-25', 'encuestas' => 1, 'indice_atencion' => 5], $porEdad['18-25']);
        $this->assertEquals(['rango' => '36-50', 'encuestas' => 1, 'indice_atencion' => 2], $porEdad['36-50']);
        $this->assertEquals(['rango' => '<18', 'encuestas' => 0, 'indice_atencion' => null], $porEdad['<18']);

        $porSexo = collect($metricas['por_sexo'])->keyBy('sexo');
        $this->assertEquals(5, $porSexo['M']['indice_atencion']);
        $this->assertEquals(2, $porSexo['F']['indice_atencion']);
        $this->assertSame(0, $porSexo['N/R']['encuestas']);
    }
}
