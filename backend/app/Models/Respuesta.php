<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Respuesta extends Model
{
    use HasFactory;

    protected $table = 'respuesta';

    protected $fillable = [
        'id_encuesta',
        'id_pregunta',
        'respuesta',
    ];

    protected function casts(): array
    {
        return [
            'respuesta' => 'integer',
        ];
    }

    public function encuesta()
    {
        return $this->belongsTo(Encuesta::class, 'id_encuesta');
    }

    public function pregunta()
    {
        return $this->belongsTo(Pregunta::class, 'id_pregunta');
    }
}
