<?php

namespace Tests\Feature\Api\Health;

use Tests\TestCase;

class Test extends TestCase
{
    // Casos de uso cubiertos:
    // GET /api/health
    // - la API responde 200 con {"status": "ok"} sin necesidad de token

    public function test_health_devuelve_ok(): void
    {
        $this->getJson('/api/health')
            ->assertStatus(200)
            ->assertExactJson(['status' => 'ok']);
    }
}
