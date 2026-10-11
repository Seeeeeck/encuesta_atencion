<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Encuesta;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MetricasController extends Controller
{
    //Las preguntas negativas ('N') se invierten (6 - valor) para que en todas
    //las métricas ajustadas 5 signifique "mejor atención" y 1 "peor atención"
    private const VALOR_AJUSTADO = "CASE WHEN pregunta.tipo = 'N' THEN 6 - respuesta.respuesta ELSE respuesta.respuesta END";

    private const RANGO_EDAD = "CASE
            WHEN usuario.edad IS NULL THEN 'Sin dato'
            WHEN usuario.edad < 18 THEN '<18'
            WHEN usuario.edad <= 25 THEN '18-25'
            WHEN usuario.edad <= 35 THEN '26-35'
            WHEN usuario.edad <= 50 THEN '36-50'
            ELSE '>50'
        END";

    private const RANGOS_EDAD = ['<18', '18-25', '26-35', '36-50', '>50', 'Sin dato'];

    private const SEXOS = ['M', 'F', 'N/R', 'Sin dato'];

    /**
     * GET /api/admin/metricas
     */
    public function obtenerMetricas(Request $request)
    {
        try {
            return response()->json([
                "message" => "Métricas obtenidas",
                "metricas" => [
                    "resumen" => $this->resumen(),
                    "por_pregunta" => $this->porPregunta(),
                    "por_edad" => $this->porGrupo(self::RANGO_EDAD, 'rango', self::RANGOS_EDAD),
                    "por_sexo" => $this->porGrupo("COALESCE(usuario.sexo, 'Sin dato')", 'sexo', self::SEXOS),
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Error al obtener las métricas', [
                'controlador' => self::class,
                'metodo' => __FUNCTION__,
                'fecha_hora' => now()->toDateTimeString(),
                'mensaje' => $e->getMessage(),
            ]);

            return response()->json(["message" => "Err:No se pudieron obtener las métricas"], 500);
        }
    }

    private function resumen(): array
    {
        $indiceGeneral = DB::table('respuesta')
            ->join('pregunta', 'pregunta.id', '=', 'respuesta.id_pregunta')
            ->selectRaw('AVG(' . self::VALOR_AJUSTADO . ') as indice')
            ->value('indice');

        return [
            "total_usuarios" => Usuario::where('rol', 'usuario')->count(),
            "total_encuestas" => Encuesta::count(),
            "encuestas_completadas" => Encuesta::where('is_ok', true)->count(),
            "indice_atencion_general" => $this->redondear($indiceGeneral),
        ];
    }

    private function porPregunta(): array
    {
        //LEFT JOIN para que también aparezcan las preguntas sin respuestas
        $promedios = DB::table('pregunta')
            ->leftJoin('respuesta', 'respuesta.id_pregunta', '=', 'pregunta.id')
            ->select('pregunta.id', 'pregunta.pregunta_texto', 'pregunta.tipo')
            ->selectRaw('COUNT(respuesta.id) as total_respuestas')
            ->selectRaw('AVG(respuesta.respuesta) as promedio')
            ->selectRaw('AVG(' . self::VALOR_AJUSTADO . ') as promedio_ajustado')
            ->groupBy('pregunta.id', 'pregunta.pregunta_texto', 'pregunta.tipo')
            ->orderBy('pregunta.id')
            ->get();

        //Cuántas veces se eligió cada valor (1 a 5) en cada pregunta
        $conteos = DB::table('respuesta')
            ->select('id_pregunta', 'respuesta')
            ->selectRaw('COUNT(*) as cantidad')
            ->groupBy('id_pregunta', 'respuesta')
            ->get()
            ->groupBy('id_pregunta');

        return $promedios->map(function ($pregunta) use ($conteos) {
            //Se arranca en 0 para que los valores que nadie eligió también aparezcan
            $distribucion = array_fill_keys(['1', '2', '3', '4', '5'], 0);
            foreach ($conteos->get($pregunta->id, []) as $conteo) {
                $distribucion[(string) $conteo->respuesta] = (int) $conteo->cantidad;
            }

            return [
                "id_pregunta" => $pregunta->id,
                "pregunta_texto" => $pregunta->pregunta_texto,
                "tipo" => $pregunta->tipo,
                "total_respuestas" => (int) $pregunta->total_respuestas,
                "promedio" => $this->redondear($pregunta->promedio),
                "promedio_ajustado" => $this->redondear($pregunta->promedio_ajustado),
                "distribucion" => $distribucion,
            ];
        })->all();
    }

    /**
     * Agrupa las encuestas por un dato del usuario (rango de edad o sexo) y calcula
     * el índice de atención de cada grupo. Los grupos sin encuestas igual se devuelven
     * (con 0 y null) para que el gráfico del panel siempre tenga las mismas categorías.
     */
    private function porGrupo(string $expresionGrupo, string $nombreGrupo, array $grupos): array
    {
        $resultados = DB::table('respuesta')
            ->join('pregunta', 'pregunta.id', '=', 'respuesta.id_pregunta')
            ->join('encuesta', 'encuesta.id', '=', 'respuesta.id_encuesta')
            ->join('usuario', 'usuario.id', '=', 'encuesta.id_usuario')
            ->selectRaw("$expresionGrupo as grupo")
            ->selectRaw('COUNT(DISTINCT encuesta.id) as encuestas')
            ->selectRaw('AVG(' . self::VALOR_AJUSTADO . ') as indice')
            ->groupByRaw($expresionGrupo)
            ->get()
            ->keyBy('grupo');

        return array_map(function (string $grupo) use ($resultados, $nombreGrupo) {
            $fila = $resultados->get($grupo);

            return [
                $nombreGrupo => $grupo,
                "encuestas" => $fila ? (int) $fila->encuestas : 0,
                "indice_atencion" => $fila ? $this->redondear($fila->indice) : null,
            ];
        }, $grupos);
    }

    //Postgres devuelve AVG como texto numérico ("3.5000..."), se pasa a float con 2 decimales
    private function redondear($valor): ?float
    {
        return $valor === null ? null : round((float) $valor, 2);
    }
}
