<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    use HasFactory;

    protected $table = 'pregunta';

    protected $fillable = [
        'pregunta_texto',
        'tipo',
    ];

    public function respuestas()
    {
        return $this->hasMany(Respuesta::class, 'id_pregunta');
    }
}
