import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { API_BASE_URL, api } from '../utils/api';
import { io, Socket } from 'socket.io-client';
import { Sparkles, LogOut, Wallet, Compass, User, Video, ShieldAlert, PhoneOff, Check, X, MessageSquare, Send, BarChart3, Users, Shield, FileText, CircleDollarSign } from 'lucide-react';

type AdminView = 'summary' | 'users' | 'roles' | 'accounting';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, clearAuth, balance, setBalance } = useStore();
  const [readers, setReaders] = useState<any[]>([]);
  const [adminView, setAdminView] = useState<AdminView>('summary');
  const [adminSummary, setAdminSummary] = useState<any | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminAccounting, setAdminAccounting] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [depositLoading, setDepositLoading] = useState(false);
  const [error, setError] = useState('');
  
  // WebSocket and RTC state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [callStatus, setCallStatus] = useState('');
  
  // Chat messaging
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Load balance and readers
  const loadData = async () => {
    try {
      if (user?.role === 'ADMIN') {
        setAdminLoading(true);
        const [summaryRes, usersRes, accountingRes] = await Promise.all([
          api.get('/admin/summary'),
          api.get('/admin/users'),
          api.get('/admin/accounting'),
        ]);
        setAdminSummary(summaryRes.data);
        setAdminUsers(usersRes.data);
        setAdminAccounting(accountingRes.data);
      } else if (user?.role === 'CLIENT') {
        const balRes = await api.get('/wallet/balance');
        setBalance(balRes.data.balance);

        const readRes = await api.get('/calls/readers');
        setReaders(readRes.data);
      } else if (user?.role === 'TAROT_READER') {
        const balRes = await api.get('/wallet/balance');
        setBalance(balRes.data.balance);
      }
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Handle socket connection
  useEffect(() => {
    if (!user || user.role === 'ADMIN') return;

    const token = localStorage.getItem('accessToken');
    const newSocket = io(API_BASE_URL, {
      auth: { token },
      query: { token },
    });

    setSocket(newSocket);

    // Socket events
    newSocket.on('connect', () => {
      console.log('Connected to socket gateway');
    });

    // Client receives incoming call request or errors
    newSocket.on('call:request', (data) => {
      // Trigger reader notification modal
      setIncomingCall(data);
    });

    newSocket.on('call:response', (data) => {
      if (data.accept) {
        setCallStatus('Conectado. Sincronizando transmisión...');
        setActiveCall({
          id: data.callId,
          roomId: data.roomId,
          role: 'CLIENT',
        });
      } else {
        setCallStatus('');
        alert('El tarotista rechazó la llamada.');
      }
    });

    newSocket.on('wallet:tick', (data) => {
      setBalance(data.balance);
    });

    newSocket.on('wallet:depleted', (data) => {
      alert(data.message);
      setCallStatus('');
      setActiveCall(null);
      loadData();
    });

    newSocket.on('call:end', (data) => {
      alert(`Llamada finalizada: ${data.reason}`);
      setCallStatus('');
      setActiveCall(null);
      setChatMessages([]);
      loadData();
    });

    newSocket.on('chat:message', (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    newSocket.on('call:error', (data) => {
      alert(data.message);
      setCallStatus('');
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e: any) {
      if (e?.response?.status !== 401) {
        console.error(e);
      }
    }
    clearAuth();
    navigate('/login');
  };

  const handleDeposit = async (amount: number) => {
    setDepositLoading(true);
    setError('');
    try {
      const res = await api.post('/wallet/deposit', { amount });
      setBalance(res.data.balance);
    } catch (err: any) {
      setError('Error al procesar depósito');
    } finally {
      setDepositLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    setAdminLoading(true);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      await loadData();
    } catch (err) {
      console.error('Error updating role', err);
      setError('No se pudo actualizar el rol del usuario');
    } finally {
      setAdminLoading(false);
    }
  };

  // Client initiates call
  const startCall = (readerUserId: string, name: string) => {
    if (balance <= 0) {
      alert('Debes tener saldo en tu billetera para llamar');
      return;
    }
    setCallStatus(`Llamando a ${name}...`);
    socket?.emit('call:request', { readerUserId, type: 'VIDEO' });
  };

  // Reader responds to call
  const respondCall = (accept: boolean) => {
    if (!incomingCall) return;

    socket?.emit('call:response', {
      callId: incomingCall.callId,
      accept,
      clientId: incomingCall.clientId,
    });

    if (accept) {
      setActiveCall({
        id: incomingCall.callId,
        roomId: `room:${incomingCall.callId}`,
        role: 'TAROT_READER',
      });
      setCallStatus('Llamada conectada en tiempo real');
    }

    setIncomingCall(null);
  };

  // Hangup call
  const hangupCall = () => {
    if (!activeCall) return;
    socket?.emit('call:end', { callId: activeCall.id });
    setActiveCall(null);
    setCallStatus('');
    setChatMessages([]);
  };

  // Send chat message
  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !activeCall) return;

    socket?.emit('chat:message', {
      roomId: activeCall.roomId,
      message: currentMessage.trim(),
    });
    setCurrentMessage('');
  };

  if (!user) return null;

  if (user.role === 'ADMIN') {
    const adminMenu = [
      { id: 'summary', label: 'Resumen', icon: BarChart3 },
      { id: 'users', label: 'Usuarios', icon: Users },
      { id: 'roles', label: 'Roles', icon: Shield },
      { id: 'accounting', label: 'Contabilidad', icon: FileText },
    ] as const;

    const metricCards = [
      { label: 'Usuarios registrados', value: adminSummary?.users?.total ?? 0, tone: 'text-purple-200' },
      { label: 'Clientes', value: adminSummary?.users?.clients ?? 0, tone: 'text-sky-200' },
      { label: 'Tarotistas', value: adminSummary?.users?.readers ?? 0, tone: 'text-amber-200' },
      { label: 'Administradores', value: adminSummary?.users?.admins ?? 0, tone: 'text-emerald-200' },
      { label: 'Correos verificados', value: adminSummary?.users?.verified ?? 0, tone: 'text-green-200' },
      { label: 'Tarotistas online', value: adminSummary?.operations?.onlineReaders ?? 0, tone: 'text-mystic-gold' },
    ];

    return (
      <div className="min-h-screen bg-[#0c0517] text-white">
        <header className="border-b border-purple-500/10 bg-[#160b29]/60 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="text-mystic-gold animate-pulse" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-amber-200">
                Destino
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20">
                <User size={16} className="text-purple-400" />
                <span className="text-sm font-semibold text-purple-200">{user.email}</span>
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-mystic-gold rounded-full font-bold">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-rose-400 transition-colors flex items-center space-x-1 text-sm font-semibold"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
            <aside className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-4 h-fit">
              <div className="text-xs text-gray-400 uppercase tracking-widest mb-3 px-2">Administracion</div>
              <div className="space-y-2">
                {adminMenu.map((item) => {
                  const Icon = item.icon;
                  const active = adminView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setAdminView(item.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-purple-600/25 border border-purple-500/40 text-purple-100'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-purple-500/10'
                      }`}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="space-y-6">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm rounded-xl p-3">
                  {error}
                </div>
              )}

              {adminLoading && (
                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-200 text-sm rounded-xl p-3">
                  Actualizando informacion...
                </div>
              )}

              {adminView === 'summary' && (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100">Dashboard administrativo</h2>
                    <p className="text-sm text-gray-400 mt-1">Indicadores generales de usuarios, operacion y saldos.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {metricCards.map((metric) => (
                      <div key={metric.label} className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-5">
                        <span className="text-xs text-gray-400 uppercase tracking-widest">{metric.label}</span>
                        <div className={`text-3xl font-extrabold mt-3 ${metric.tone}`}>{metric.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-5">
                      <CircleDollarSign className="text-mystic-gold mb-3" />
                      <span className="text-xs text-gray-400 uppercase tracking-widest">Saldo total en billeteras</span>
                      <div className="text-2xl font-bold text-mystic-gold mt-3">
                        ${Number(adminSummary?.accounting?.totalWalletBalance ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-5">
                      <Wallet className="text-emerald-300 mb-3" />
                      <span className="text-xs text-gray-400 uppercase tracking-widest">Depositos completados</span>
                      <div className="text-2xl font-bold text-emerald-200 mt-3">
                        ${Number(adminSummary?.accounting?.totalDeposits ?? 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-5">
                      <FileText className="text-purple-300 mb-3" />
                      <span className="text-xs text-gray-400 uppercase tracking-widest">Consumo en sesiones</span>
                      <div className="text-2xl font-bold text-purple-200 mt-3">
                        ${Number(adminSummary?.accounting?.totalConsumption ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {(adminView === 'users' || adminView === 'roles') && (
                <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-purple-500/10">
                    <h2 className="text-xl font-bold text-gray-100">
                      {adminView === 'roles' ? 'Gestion de roles' : 'Gestion de usuarios'}
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0c0517]/70 text-gray-400 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="text-left p-4">Usuario</th>
                          <th className="text-left p-4">Rol</th>
                          <th className="text-left p-4">Estado</th>
                          <th className="text-left p-4">Verificado</th>
                          <th className="text-left p-4">Saldo</th>
                          <th className="text-left p-4">Registro</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.map((managedUser) => (
                          <tr key={managedUser.id} className="border-t border-purple-500/10">
                            <td className="p-4">
                              <div className="font-semibold text-gray-100">{managedUser.firstName} {managedUser.lastName}</div>
                              <div className="text-xs text-gray-400">{managedUser.email}</div>
                            </td>
                            <td className="p-4">
                              {adminView === 'roles' ? (
                                <select
                                  value={managedUser.role}
                                  onChange={(event) => updateUserRole(managedUser.id, event.target.value)}
                                  className="bg-[#0c0517] border border-purple-500/20 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-mystic-gold"
                                >
                                  <option value="CLIENT">CLIENT</option>
                                  <option value="TAROT_READER">TAROT_READER</option>
                                  <option value="ADMIN">ADMIN</option>
                                </select>
                              ) : (
                                <span className="px-2 py-1 rounded-lg bg-purple-500/10 text-purple-200 text-xs font-bold">
                                  {managedUser.role}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-gray-300">{managedUser.status}</td>
                            <td className="p-4">
                              <span className={managedUser.isEmailVerified ? 'text-emerald-300' : 'text-rose-300'}>
                                {managedUser.isEmailVerified ? 'Si' : 'No'}
                              </span>
                            </td>
                            <td className="p-4 text-mystic-gold font-mono">
                              ${Number(managedUser.wallet?.balance ?? 0).toFixed(2)}
                            </td>
                            <td className="p-4 text-gray-400">
                              {new Date(managedUser.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {adminView === 'accounting' && (
                <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-purple-500/10">
                    <h2 className="text-xl font-bold text-gray-100">Gestion contable</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#0c0517]/70 text-gray-400 uppercase text-xs tracking-wider">
                        <tr>
                          <th className="text-left p-4">Fecha</th>
                          <th className="text-left p-4">Usuario</th>
                          <th className="text-left p-4">Tipo</th>
                          <th className="text-left p-4">Estado</th>
                          <th className="text-right p-4">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminAccounting.map((transaction) => (
                          <tr key={transaction.id} className="border-t border-purple-500/10">
                            <td className="p-4 text-gray-400">{new Date(transaction.createdAt).toLocaleString()}</td>
                            <td className="p-4">
                              <div className="text-gray-100">{transaction.user.email}</div>
                              <div className="text-xs text-gray-500">{transaction.description}</div>
                            </td>
                            <td className="p-4 text-purple-200">{transaction.type}</td>
                            <td className="p-4 text-gray-300">{transaction.status}</td>
                            <td className="p-4 text-right text-mystic-gold font-mono">
                              ${Number(transaction.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0517] text-white">
      {/* Header */}
      <header className="border-b border-purple-500/10 bg-[#160b29]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="text-mystic-gold animate-pulse" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-amber-200">
              Destino
            </h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 bg-purple-500/10 px-4 py-1.5 rounded-full border border-purple-500/20">
              <User size={16} className="text-purple-400" />
              <span className="text-sm font-semibold text-purple-200">{user.email}</span>
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-mystic-gold rounded-full font-bold">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-rose-400 transition-colors flex items-center space-x-1 text-sm font-semibold"
            >
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Active Call UI overlay/panel */}
        {activeCall && (
          <div className="mb-8 p-6 bg-[#160b29] border-2 border-mystic-gold/40 rounded-2xl shadow-goldGlow animate-pulse relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 bg-amber-500/10 text-mystic-gold font-bold text-xs uppercase tracking-widest rounded-bl-xl border-l border-b border-mystic-gold/20">
              SESIÓN EN VIVO
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-2xl font-bold text-amber-200 flex items-center">
                  <Video className="mr-2 text-mystic-gold" />
                  Videollamada en Curso
                </h3>
                <p className="text-sm text-gray-400 mt-2">{callStatus}</p>

                {/* Simulated webRTC streams */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="aspect-video bg-[#0c0517] rounded-xl border border-purple-500/30 flex items-center justify-center relative overflow-hidden">
                    <span className="text-xs text-purple-300 font-bold uppercase tracking-wider">Tu Cámara (WebRTC)</span>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-gray-300">
                      Local
                    </div>
                  </div>
                  <div className="aspect-video bg-[#0c0517] rounded-xl border border-amber-500/30 flex items-center justify-center relative overflow-hidden">
                    <span className="text-xs text-mystic-gold font-bold uppercase tracking-wider animate-bounce">
                      {activeCall.role === 'CLIENT' ? 'Madame Sophia (Tarot)' : 'Cliente'}
                    </span>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] text-gray-300">
                      Remoto
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-300">
                    <Wallet size={16} className="text-mystic-gold" />
                    <span>Tu saldo actual:</span>
                    <strong className="text-mystic-gold font-mono">${balance.toFixed(2)} tokens</strong>
                  </div>
                  <button
                    onClick={hangupCall}
                    className="flex items-center space-x-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    <PhoneOff size={16} />
                    <span>Colgar</span>
                  </button>
                </div>
              </div>

              {/* Real-time Chat Box */}
              <div className="flex flex-col h-[300px] bg-[#0c0517] rounded-xl border border-purple-500/20 overflow-hidden">
                <div className="p-3 bg-purple-950/20 border-b border-purple-500/10 text-xs font-semibold text-purple-300 uppercase tracking-widest flex items-center">
                  <MessageSquare size={14} className="mr-1.5" /> Chat de Sesión
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`max-w-[80%] rounded-xl p-3 ${
                        msg.senderId === user.id
                          ? 'bg-purple-600/30 text-purple-100 ml-auto border border-purple-500/20'
                          : 'bg-slate-800/50 text-gray-200 border border-slate-700/30'
                      }`}
                    >
                      <div className="text-[10px] text-gray-400 font-bold mb-0.5">{msg.email}</div>
                      <div>{msg.message}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={sendChatMessage} className="p-3 bg-[#160b29] border-t border-purple-500/10 flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 px-4 py-2 bg-[#0c0517]/80 border border-purple-500/20 rounded-lg text-sm text-white focus:outline-none focus:border-mystic-gold/60"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Incoming Call Request (Reader perspective) */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#160b29] border-2 border-mystic-gold rounded-2xl shadow-goldGlow p-6 text-center animate-bounce">
              <h3 className="text-xl font-bold text-amber-200 flex items-center justify-center">
                <Sparkles size={20} className="mr-1.5 text-mystic-gold" />
                Llamada Entrante
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                El cliente <strong className="text-purple-300">{incomingCall.clientEmail}</strong> desea consultarte.
              </p>
              <div className="my-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <span className="text-xs text-gray-400 uppercase block tracking-wider">Tarifa de Ganancia</span>
                <span className="text-2xl font-bold text-mystic-gold">${incomingCall.ratePerMinute} tokens/min</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => respondCall(true)}
                  className="flex items-center justify-center space-x-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm"
                >
                  <Check size={16} />
                  <span>Aceptar</span>
                </button>
                <button
                  onClick={() => respondCall(false)}
                  className="flex items-center justify-center space-x-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm"
                >
                  <X size={16} />
                  <span>Rechazar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Column */}
          <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-200 flex items-center">
                <Wallet className="mr-2 text-purple-400" /> Billetera de Tokens
              </h2>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-purple-950/40 to-slate-900/40 border border-purple-500/20 rounded-xl text-center mb-6">
              <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Saldo Disponible</span>
              <span className="text-3xl font-extrabold text-mystic-gold font-mono">${balance.toFixed(2)}</span>
            </div>

            {user.role === 'CLIENT' && (
              <div className="space-y-4">
                <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
                  Recargar Saldo (Simulado)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleDeposit(amt)}
                      disabled={depositLoading}
                      className="py-2.5 bg-purple-500/10 border border-purple-500/30 hover:border-mystic-gold hover:bg-purple-500/20 rounded-xl text-xs font-bold font-mono transition-all text-purple-200"
                    >
                      +${amt}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  * Las transacciones se realizan usando PostgreSQL FOR UPDATE raw queries para garantizar operaciones atómicas e impedir el doble gasto.
                </p>
              </div>
            )}
          </div>

          {/* Core Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {user.role === 'CLIENT' ? (
              <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-200 flex items-center mb-6">
                  <Compass className="mr-2 text-mystic-gold" /> Tarotistas Disponibles En Línea
                </h2>

                {callStatus && (
                  <div className="bg-purple-600/10 border border-purple-500/25 text-purple-300 text-sm p-4 rounded-xl mb-6 text-center animate-pulse flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-mystic-gold rounded-full mr-2 animate-ping"></div>
                    {callStatus}
                  </div>
                )}

                {readers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-purple-500/10 rounded-xl">
                    <ShieldAlert size={40} className="mx-auto text-purple-500/40 mb-3" />
                    <p className="text-sm text-gray-400">No hay tarotistas conectados en este momento.</p>
                    <p className="text-xs text-gray-500 mt-1">Usa la base de datos para sembrar un tarotista en línea.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readers.map((reader) => (
                      <div
                        key={reader.id}
                        className="bg-[#0c0517] border border-purple-500/20 rounded-xl p-5 hover:border-mystic-gold hover:shadow-mysticGlow transition-all duration-300 group"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-full border border-mystic-gold/40 flex items-center justify-center font-bold text-mystic-gold text-lg">
                            {reader.displayName[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-purple-200">{reader.displayName}</h3>
                            <span className="text-xs text-emerald-400 flex items-center font-semibold">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5"></span>
                              Disponible
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 h-8 font-light mb-4">{reader.bio}</p>
                        
                        <div className="flex items-center justify-between border-t border-purple-500/10 pt-4">
                          <div className="text-xs">
                            <span className="text-gray-500 uppercase block tracking-wider text-[9px]">Tarifa</span>
                            <span className="font-bold text-mystic-gold font-mono">${reader.ratePerMinute} tokens/min</span>
                          </div>
                          <button
                            onClick={() => startCall(reader.user.id, reader.displayName)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-mysticGlow"
                          >
                            Llamar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#160b29] border border-purple-500/15 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-200 flex items-center mb-6">
                  <Compass className="mr-2 text-mystic-gold" /> Panel de Tarotista Profesional
                </h2>

                <div className="bg-[#0c0517] p-5 rounded-xl border border-purple-500/20 mb-6">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-widest mb-4">Estado de Disponibilidad</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Al estar en línea, podrás recibir solicitudes de videollamada y chat por parte de los clientes en tiempo real.
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-300 font-semibold text-sm">
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                    <span>ONLINE / LISTO PARA RECIBIR LLAMADAS</span>
                  </div>
                </div>

                <div className="bg-purple-500/5 p-4 rounded-xl border border-purple-500/15 text-xs text-gray-400 leading-relaxed">
                  <strong>Nota sobre el consumo financiero:</strong> Cada minuto transcurrido durante la llamada activa sumará automáticamente los tokens correspondientes a tu billetera, deduciéndose del saldo del cliente. Si el cliente agota sus fondos, el servidor web terminará la conexión de forma segura e inmediata.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
