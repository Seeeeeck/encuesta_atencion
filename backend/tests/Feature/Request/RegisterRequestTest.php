<?php

namespace Tests\Feature\Request;

use App\Http\Requests\RegisterRequest;
use App\Models\Usuario;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class RegisterRequestTest extends TestCase
{
    use RefreshDatabase;

    private function validar(array $datos): ValidatorContract
    {
        $request = new RegisterRequest();

        return Validator::make($datos, $request->rules(), $request->messages());
    }

    private function datosValidos(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Juan Pérez',
            'correo' => 'juan@example.com',
            'clave' => 'Clave1!',
            'edad' => 25,
            'sexo' => 'M',
        ], $overrides);
    }

    public function test_datos_validos_pasan(): void
    {
        $this->assertTrue($this->validar($this->datosValidos())->passes());
    }

    public function test_edad_y_sexo_son_opcionales(): void
    {
        $datos = $this->datosValidos();
        unset($datos['edad'], $datos['sexo']);

        $this->assertTrue($this->validar($datos)->passes());
    }

    public function test_nombre_es_obligatorio(): void
    {
        $datos = $this->datosValidos(['nombre' => '']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_nombre_requiere_minimo_3_caracteres(): void
    {
        $datos = $this->datosValidos(['nombre' => 'Jo']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_nombre_no_puede_superar_100_caracteres(): void
    {
        $datos = $this->datosValidos(['nombre' => str_repeat('a', 101)]);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_correo_debe_tener_formato_valido(): void
    {
        $datos = $this->datosValidos(['correo' => 'no-es-un-correo']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_correo_debe_ser_unico(): void
    {
        Usuario::create([
            'nombre' => 'Otro usuario',
            'correo' => 'juan@example.com',
            'clave' => 'Otraclave1!',
        ]);

        $datos = $this->datosValidos(['correo' => 'juan@example.com']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_clave_requiere_minimo_5_caracteres(): void
    {
        $datos = $this->datosValidos(['clave' => 'Ab1!']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_clave_no_puede_superar_100_caracteres(): void
    {
        $datos = $this->datosValidos(['clave' => 'Aa1!'.str_repeat('a', 97)]);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_clave_requiere_al_menos_una_mayuscula(): void
    {
        $datos = $this->datosValidos(['clave' => 'clave1!']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_clave_requiere_al_menos_un_simbolo(): void
    {
        $datos = $this->datosValidos(['clave' => 'Clave123']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_edad_debe_ser_numero_entero(): void
    {
        $datos = $this->datosValidos(['edad' => 'veinticinco']);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_edad_minima_es_1(): void
    {
        $datos = $this->datosValidos(['edad' => 0]);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_edad_maxima_es_200(): void
    {
        $datos = $this->datosValidos(['edad' => 201]);

        $this->assertTrue($this->validar($datos)->fails());
    }

    public function test_sexo_solo_admite_m_f_o_nr(): void
    {
        $datos = $this->datosValidos(['sexo' => 'X']);

        $this->assertTrue($this->validar($datos)->fails());
    }
}
