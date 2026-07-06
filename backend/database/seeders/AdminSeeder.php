<?php

namespace Database\Seeders;

use App\Models\Usuario;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Usuario::create([
            'nombre' => 'Administrador',
            'correo' => env('ADMIN_EMAIL'),
            'clave' => env('ADMIN_PASSWORD'),
            'rol' => 'admin',
        ]);
    }
}
