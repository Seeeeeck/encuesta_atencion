<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerificarCorreo extends Notification
{
    // Queueable permite despachar esta notificación a una cola (jobs) si en algún
    // momento se le agrega "implements ShouldQueue" a la clase. Hoy no la implementa,
    // así que el envío es síncrono (ocurre en el mismo request).
    use Queueable;

    /**
     * Constructor vacío: esta notificación no necesita datos externos para armarse,
     * todo lo que necesita (id, correo) lo saca de $notifiable en toMail().
     */
    public function __construct()
    {
        //
    }

    /**
     * Declara por qué canales se envía esta notificación.
     * Acá solo 'mail' → Laravel va a llamar a toMail() de abajo.
     * (Podría ser también 'database', 'sms', etc., cada uno con su propio método toXxx()).
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Arma el contenido y el link del correo de verificación.
     * $notifiable es el modelo Usuario que recibe la notificación.
     */
    public function toMail(object $notifiable): MailMessage
    {
        // Id del usuario y un hash de su correo actual. El hash sirve para detectar
        // si el correo cambió entre que se mandó el link y que se hizo click:
        // si cambió, el hash ya no coincide y el link queda inválido.
        $idKey = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());

        // 1. Genera una URL firmada hacia la ruta del BACKEND 'verification.verify'
        //    (GET /api/email/verificar/{id}/{hash}). "Firmada" significa que Laravel
        //    le agrega una firma criptográfica (?signature=...) que garantiza que
        //    nadie pudo alterar el id/hash sin invalidar el link. También expira
        //    a los 60 minutos (temporarySignedRoute).
        $urlFirmadaBackend = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            [
                'id' => $idKey,
                'hash' => $hash,
            ]
        );

        // 2. Esa URL firmada tiene esta forma:
        //    http://localhost:8000/api/email/verificar/5/abc123?expires=...&signature=...
        //    El correo no debe llevar al usuario directo al backend (una API no muestra
        //    una pantalla linda), sino al FRONTEND. Para eso hay que extraer el
        //    "?expires=...&signature=..." (query string) y reusarlo en la URL del frontend.
        $queryString = parse_url($urlFirmadaBackend, PHP_URL_QUERY);
        parse_str($queryString, $parametrosFirma);

        // 3. Arma la URL del frontend con los mismos parámetros (id, hash, expires,
        //    signature). El frontend, al cargar esa página, lee estos parámetros y
        //    le pega al backend (a la misma ruta firmada 'verification.verify')
        //    para completar la verificación y mostrarle un mensaje al usuario.
        $urlFrontend = config('app.frontend_url') . '/verificar-correo?' . http_build_query([
            'id' => $idKey,
            'hash' => $hash,
            ...$parametrosFirma,
        ]);

        // 4. Contenido visible del correo: usa el builder de mensajes de Laravel
        //    (MailMessage), que genera el HTML con el diseño estándar (greeting,
        //    líneas de texto, botón de acción con la URL del frontend).
        return (new MailMessage)
            ->replyTo($notifiable->getEmailForVerification())
            ->subject('Verifica tu correo')
            ->greeting('¡Hola!')
            ->line('Haz click en el botón para verificar tu cuenta.')
            ->action('Verificar correo', $urlFrontend)
            ->line('Si no creaste esta cuenta, puedes ignorar este correo.');
    }

    /**
     * Representación de la notificación para el canal 'database' (si se usara).
     * No aplica acá porque via() solo declara 'mail', así que este método nunca
     * se llama en el flujo actual — queda vacío por defecto del scaffold de artisan.
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
