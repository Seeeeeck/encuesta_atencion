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
        Schema::create('pregunta', function (Blueprint $table) {
            $table->id();
            $table->string('pregunta_texto', 255);
            $table->char('tipo', 1);
            $table->timestamps();
        });

        DB::statement("ALTER TABLE pregunta ADD CONSTRAINT pregunta_tipo_check CHECK (tipo IN ('P', 'N'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pregunta');
    }
};
