<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('respuesta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_encuesta')->constrained('encuesta')->cascadeOnDelete();
            $table->foreignId('id_pregunta')->constrained('pregunta');
            $table->smallInteger('respuesta');
            $table->timestamps();

            $table->unique(['id_encuesta', 'id_pregunta']);
        });

        DB::statement('ALTER TABLE respuesta ADD CONSTRAINT respuesta_respuesta_check CHECK (respuesta BETWEEN 1 AND 5)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('respuesta');
    }
};
