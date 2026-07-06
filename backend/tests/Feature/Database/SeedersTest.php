<?php

namespace Tests\Feature\Database;

use App\Models\Pregunta;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedersTest extends TestCase
{
    use RefreshDatabase;

    public function test_los_seeders_cargan_preguntas_y_admin(): void
    {
        $this->seed();

        $this->assertSame(10, Pregunta::count());

        $admins = Usuario::where('rol', 'admin')->get();

        $this->assertCount(1, $admins);
        $this->assertSame(env('ADMIN_EMAIL'), $admins->first()->correo);
    }
}
