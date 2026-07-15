<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerificarCambioCorreo extends Notification
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
        //sha1 cualquiera lo puede revisar
        //sha1 con bcrypt y salt es casi imposible de romper
        //sal sirve para darle data alaeatoria para que no sean las mismas claves

        $hash = sha1($notifiable->getEmailForVerification());
        //sirve para decirle a la api
        //que recibe la firma que necesita verificar la firma
        $urlFirmadaBackend = URL::temporarySignedRoute(
            'update.email',
            now()->addMinutes(60),
            [
                'id' => $idKey,
                'hash' => $hash
            ]

        );

        $urlFirmadaVerificación = URL::temporarySignedRoute(
            'verification.verify.sign',
            now()->addMinutes(60),
            [
                'id' => $idKey,
                'hash' => $hash
            ]

        );

        

        //se extraen los parametros id hash signature y expires
        $queryString = parse_url($urlFirmadaBackend, PHP_URL_QUERY);
        //parsea a un array o variables
        parse_str($queryString, $parametrosFirma);

        $urlFrontend = config("app.frontend_url") . '/actualizar-correo?' . http_build_query([
            'verificacion' => $urlFirmadaVerificación,
            ...$parametrosFirma
        ]);




        return (new MailMessage)
            ->subject('Cambia tu correo con el siguiente link:')
            ->greeting('¡Hola!')
            ->line('Haz click en el boton para cambiar tu correo.')
            ->action('Cambiar correo', $urlFrontend)
            ->line('Si no solicitaste esto, puedes ingorar este correo.');
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
