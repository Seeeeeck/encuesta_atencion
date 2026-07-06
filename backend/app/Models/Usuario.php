<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'usuario';

    /**
     * La columna real de la clave es "clave", no "password".
     */
    protected $authPasswordName = 'clave';

    protected $fillable = [
        'nombre',
        'correo',
        'clave',
        'edad',
        'sexo',
        'rol',
    ];

    protected $hidden = [
        'clave',
    ];

    protected function casts(): array
    {
        return [
            'clave' => 'hashed',
        ];
    }

    public function encuestas()
    {
        return $this->hasMany(Encuesta::class, 'id_usuario');
    }
}
