<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerificarCorreo extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {

        $idKey = $notifiable->getKey();
        $hash = sha1($notifiable->getEmailForVerification());
        // 1. URL firmada real, hacia una ruta del backend que todavía no existe
        //    ('verification.verify' — la creamos en el próximo paso). Lleva el id del usuario
        //    y un hash de su correo (evita que el link sirva si el correo cambia después).
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
        //    Necesitamos separar el "?expires=...&signature=..." (el query string) del resto,
        //    para poder reusar esos mismos parámetros en la URL del frontend.
        $queryString = parse_url($urlFirmadaBackend, PHP_URL_QUERY);
        parse_str($queryString, $parametrosFirma);

        // 3. Armamos la URL del frontend con los mismos parámetros (id, hash, expires,
        //    signature) — el frontend (a construir después) va a leerlos y pegarle al backend
        //    reconstruyendo la URL firmada original.
        $urlFrontend = config('app.frontend_url') . '/verificar-correo?' . http_build_query([
            'id' => $idKey,
            'hash' => $hash,
            ...$parametrosFirma,
        ]);

        // 4. El contenido del correo en sí.
        return (new MailMessage)
            ->replyTo($notifiable->getEmailForVerification())
            ->subject('Verifica tu correo')
            ->greeting('¡Hola!')
            ->line('Haz click en el botón para verificar tu cuenta.')
            ->action('Verificar correo', $urlFrontend)
            ->line('Si no creaste esta cuenta, puedes ignorar este correo.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
