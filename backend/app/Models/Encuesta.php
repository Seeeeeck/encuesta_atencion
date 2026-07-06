<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Encuesta extends Model
{
    use HasFactory;

    protected $table = 'encuesta';

    protected $fillable = [
        'id_usuario',
        'is_ok',
    ];

    protected function casts(): array
    {
        return [
            'is_ok' => 'boolean',
        ];
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario');
    }

    public function respuestas()
    {
        return $this->hasMany(Respuesta::class, 'id_encuesta');
    }
}
