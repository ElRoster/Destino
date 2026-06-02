import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { Calendar, Sparkles, Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useStore((state) => state.setAuth);
  
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CLIENT' | 'TAROT_READER'>('CLIENT');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devVerificationUrl, setDevVerificationUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const verificationStatus = searchParams.get('verified');
  const verificationMessage = useMemo(() => {
    if (verificationStatus === 'success') {
      return 'Correo confirmado. Ya puedes iniciar sesión.';
    }

    if (verificationStatus === 'invalid') {
      return 'El enlace de confirmación no es válido o ya expiró.';
    }

    return '';
  }, [verificationStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevVerificationUrl('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', {
          firstName,
          lastName,
          birthDate,
          email,
          password,
          role,
          displayName: role === 'TAROT_READER' ? displayName : undefined,
          bio: role === 'TAROT_READER' ? bio : undefined,
        });
        setSuccess(res.data?.message || 'Registro creado. Revisa tu correo para confirmar la cuenta.');
        setDevVerificationUrl(res.data?.verificationUrl || '');
        setIsRegister(false);
      } else {
        const res = await api.post('/auth/login', { email, password });
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const data = err?.response?.data;
      const nestedMessage = data?.error?.message;
      const msg =
        (typeof data?.message === 'string' && data.message) ||
        (Array.isArray(data?.message) && data.message.join('\n')) ||
        (typeof nestedMessage === 'string' && nestedMessage) ||
        (Array.isArray(nestedMessage) && nestedMessage.join('\n')) ||
        (typeof data?.error === 'string' && data.error) ||
        'Algo salió mal. Por favor, intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0c0517] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-[#0c0517] to-[#05020c] px-4">
      {/* Mystical Background Stars Decor */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000')] opacity-5 bg-cover pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#160b29]/80 border border-purple-500/20 backdrop-blur-xl rounded-2xl shadow-mysticGlow p-8 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center mb-8 relative">
          <div className="p-3 bg-purple-500/10 rounded-full border border-purple-500/30 text-mystic-gold mb-3 animate-pulse">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-amber-200 to-purple-200">
            Destino
          </h1>
          <p className="text-gray-400 text-sm mt-1 text-center font-light">
            {isRegister ? 'Crea tu perfil y entra al círculo místico' : 'Ingresa para consultar tu destino'}
          </p>
        </div>

        {(success || verificationMessage) && verificationStatus !== 'invalid' && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm rounded-lg p-3 mb-6 text-center">
            {success || verificationMessage}
            {devVerificationUrl && (
              <a href={devVerificationUrl} className="block text-mystic-gold hover:text-amber-300 mt-2 break-words">
                Abrir enlace de confirmación local
              </a>
            )}
          </div>
        )}

        {verificationMessage && verificationStatus === 'invalid' && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-lg p-3 mb-6 text-center">
            {verificationMessage}
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-lg p-3 mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          {/* Register: Basic Profile */}
          {isRegister && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Apellido</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  className="w-full px-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Fecha de Nacimiento</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Calendar size={18} />
                </span>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
                />
              </div>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@tarot.com"
                className="w-full pl-10 pr-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Register fields */}
          {isRegister && (
            <div className="space-y-4 pt-2 border-t border-purple-500/10">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Tipo de Cuenta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('CLIENT')}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      role === 'CLIENT'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-mysticGlow'
                        : 'bg-transparent border-purple-500/15 text-gray-400 hover:bg-purple-500/5'
                    }`}
                  >
                    Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('TAROT_READER')}
                    className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      role === 'TAROT_READER'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-mysticGlow'
                        : 'bg-transparent border-purple-500/15 text-gray-400 hover:bg-purple-500/5'
                    }`}
                  >
                    Tarotista
                  </button>
                </div>
              </div>

              {role === 'TAROT_READER' && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div>
                    <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Nombre Profesional</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <UserCheck size={18} />
                      </span>
                      <input
                        type="text"
                        required={role === 'TAROT_READER'}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="ej. Madame Sophia"
                        className="w-full pl-10 pr-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Biografía / Presentación</label>
                    <textarea
                      required={role === 'TAROT_READER'}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntanos sobre tus habilidades y trayectoria..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[#0c0517]/60 border border-purple-500/20 rounded-xl focus:border-mystic-gold/60 focus:shadow-goldGlow text-white placeholder-gray-500 focus:outline-none transition-all duration-300 text-sm resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-mysticGlow active:scale-[0.98] transition-all duration-200 disabled:opacity-50 text-sm uppercase tracking-wider mt-4"
          >
            {loading ? 'Cargando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Toggle Register/Login */}
        <div className="text-center mt-6 relative">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setFirstName('');
              setLastName('');
              setBirthDate('');
              setDisplayName('');
              setBio('');
              setSuccess('');
              setDevVerificationUrl('');
            }}
            className="text-xs text-mystic-gold hover:text-amber-300 transition-colors"
          >
            {isRegister ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta aún? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
