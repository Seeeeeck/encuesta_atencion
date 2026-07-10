<?php

namespace App\Models;

use App\Notifications\VerificarCorreo;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Override;

class Usuario extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, MustVerifyEmailTrait,Notifiable;

    protected $table = 'usuario';

    /**
     * La columna real de la clave es "clave", no "password".
     */
    protected $authPasswordName = 'clave';

    protected $fillable = [
        'nombre',
        'correo',
        'clave',
        'edad',
        'sexo',
        'rol',
    ];

    protected $hidden = [
        'clave',
    ];

    protected function casts(): array
    {
        return [
            'clave' => 'hashed',
            'is_verified' => 'boolean',
        ];
    }

    public function encuestas()
    {
        return $this->hasMany(Encuesta::class, 'id_usuario');
    }

    /**
     * Esta tabla usa 'is_verified' (boolean), no 'email_verified_at' (timestamp) como el
     * trait MustVerifyEmail por defecto.
     */
    public function hasVerifiedEmail(): bool
    {
        return (bool) $this->is_verified;
    }

   
    public function markEmailAsVerified(): bool
    {
        return $this->forceFill(['is_verified' => true])->save();
    }

    public function markEmailAsUnverified(): bool
    {
        return $this->forceFill(['is_verified' => false])->save();
    }

    /**
     * Esta tabla usa 'correo', no 'email' como el trait MustVerifyEmail por defecto.
     */
    public function getEmailForVerification(): string
    {
        return $this->correo;
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerificarCorreo());
    }
}


