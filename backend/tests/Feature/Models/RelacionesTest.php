<?php

namespace Tests\Feature\Models;

use App\Models\Encuesta;
use App\Models\Pregunta;
use App\Models\Respuesta;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelacionesTest extends TestCase
{
    use RefreshDatabase;

    private function crearUsuario(): Usuario
    {
        return Usuario::create([
            'nombre' => 'Usuario de prueba',
            'correo' => 'usuario@example.com',
            'clave' => 'clave12345',
        ]);
    }

    private function crearPregunta(): Pregunta
    {
        return Pregunta::create([
            'pregunta_texto' => '¿Pregunta de prueba?',
            'tipo' => 'P',
        ]);
    }

    public function test_usuario_tiene_muchas_encuestas(): void
    {
        $usuario = $this->crearUsuario();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);

        $this->assertTrue($usuario->encuestas->contains($encuesta));
    }

    public function test_encuesta_pertenece_a_usuario(): void
    {
        $usuario = $this->crearUsuario();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);

        $this->assertTrue($encuesta->usuario->is($usuario));
    }

    public function test_encuesta_tiene_muchas_respuestas(): void
    {
        $usuario = $this->crearUsuario();
        $pregunta = $this->crearPregunta();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);
        $respuesta = Respuesta::create([
            'id_encuesta' => $encuesta->id,
            'id_pregunta' => $pregunta->id,
            'respuesta' => 3,
        ]);

        $this->assertTrue($encuesta->respuestas->contains($respuesta));
    }

    public function test_pregunta_tiene_muchas_respuestas(): void
    {
        $usuario = $this->crearUsuario();
        $pregunta = $this->crearPregunta();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);
        $respuesta = Respuesta::create([
            'id_encuesta' => $encuesta->id,
            'id_pregunta' => $pregunta->id,
            'respuesta' => 3,
        ]);

        $this->assertTrue($pregunta->respuestas->contains($respuesta));
    }

    public function test_respuesta_pertenece_a_encuesta_y_pregunta(): void
    {
        $usuario = $this->crearUsuario();
        $pregunta = $this->crearPregunta();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);
        $respuesta = Respuesta::create([
            'id_encuesta' => $encuesta->id,
            'id_pregunta' => $pregunta->id,
            'respuesta' => 3,
        ]);

        $this->assertTrue($respuesta->encuesta->is($encuesta));
        $this->assertTrue($respuesta->pregunta->is($pregunta));
    }

    public function test_eliminar_usuario_elimina_su_encuesta_en_cascada(): void
    {
        $usuario = $this->crearUsuario();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);

        $usuario->delete();

        $this->assertModelMissing($encuesta);
    }

    public function test_eliminar_encuesta_elimina_sus_respuestas_en_cascada(): void
    {
        $usuario = $this->crearUsuario();
        $pregunta = $this->crearPregunta();
        $encuesta = Encuesta::create(['id_usuario' => $usuario->id]);
        $respuesta = Respuesta::create([
            'id_encuesta' => $encuesta->id,
            'id_pregunta' => $pregunta->id,
            'respuesta' => 3,
        ]);

        $encuesta->delete();

        $this->assertModelMissing($respuesta);
    }
}
