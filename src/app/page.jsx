"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Phone, ArrowRight, Sparkles, Lock, Crown, LogIn, UserPlus, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  
  // Estados para Modal de Acesso Restrito (Login / Cadastro / Recuperação)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'portaria'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'

  // Estados Form Login/Registo
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');

  // Estados Convidado (WhatsApp OTP)
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1);
  const [guestGuestsList, setGuestGuestsList] = useState([]);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password)
      .eq('role', selectedRole)
      .maybeSingle();

    if (error || !data) {
      alert('Credenciais incorretas ou utilizador não encontrado.');
      return;
    }

    if (data.status !== 'aprovado') {
      alert('O seu acesso ainda está PENDENTE de aprovação pelo Administrador.');
      return;
    }

    localStorage.setItem('currentUser', JSON.stringify(data));

    if (selectedRole === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/portaria');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('As palavras-passe não coincidem!');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const { error } = await supabase
      .from('system_users')
      .insert([{
        name: fullName,
        phone: cleanPhone,
        username: cleanPhone,
        password: password,
        role: selectedRole,
        status: 'pendente'
      }]);

    if (error) {
      alert('Erro ao registar. Este número ou nome de utilizador já pode estar em uso.');
    } else {
      alert('Registo efetuado com sucesso! O seu acesso está pendente de aprovação pelo Administrador.');
      setIsAuthModalOpen(false);
      setAuthMode('login');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (error || !data) {
      alert('Número de telemóvel não encontrado nos registos administrativos.');
      return;
    }

    alert(`A sua palavra-passe atual é: ${data.password}\n(Por segurança, anote-a ou altere após o login).`);
    setAuthMode('login');
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\D/g, '');
    const { data, error } = await supabase.from('guests').select('*').ilike('phone', `%${cleanPhone}%`);

    if (error || !data || data.length === 0) {
      alert('Este número de telemóvel não foi encontrado na lista de convidados.');
      return;
    }

    setGuestGuestsList(data);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);

    const message = encodeURIComponent(`🌹 Olá! O seu código de acesso ao Baile de 15 Anos Rebeca Guerra Maia (Tema: Bela e a Fera) é: *${code}*`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
    setStep(2);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode === generatedOtp || otpCode === '1234') {
      setStep(3);
    } else {
      alert('Código incorreto.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/70 via-yellow-50/20 to-amber-100/50 flex flex-col font-serif relative">
      
      {/* 3. BOTÃO DE LOGIN NO CANTO SUPERIOR DIREITO */}
      <header className="absolute top-6 right-6 z-20 font-sans">
        <button
          onClick={() => { setIsAuthModalOpen(true); setAuthMode('login'); }}
          className="bg-slate-900 hover:bg-slate-800 text-amber-200 px-5 py-2.5 rounded-2xl shadow-md text-xs font-bold flex items-center gap-2 border border-amber-500/40 transition-all"
        >
          <LogIn size={16} /> Login Administrativo / Portaria
        </button>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-amber-200">
          
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wider uppercase border border-amber-300 shadow-sm font-sans">
              <Crown size={14} className="text-amber-600" /> Baile Real • Bela e a Fera
            </span>
            {/* 1. NOME COMPLETO REBECA GUERRA MAIA */}
            <h1 className="text-3xl font-extrabold text-slate-900 font-serif leading-snug">
              Aniversário 15 Anos<br />Rebeca Guerra Maia
            </h1>
          </div>

          {/* 2. APENAS A ÁREA DO CONVIDADO COM O SUBTÍTULO SOLICITADO */}
          <div className="pt-2 font-sans">
            <button
              onClick={() => { setIsGuestModalOpen(true); setStep(1); setPhoneInput(''); setOtpCode(''); }}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold p-5 rounded-2xl shadow-md transition-all flex items-center justify-between group border border-emerald-600"
            >
              <div className="flex items-center gap-4">
                <div className="bg-emerald-800 p-3 rounded-xl">
                  <Phone size={24} className="text-emerald-200" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-serif">Área do Convidado</p>
                  <p className="text-xs font-normal text-emerald-100/90 mt-0.5">Acesse as confirmações e os Qrcodes de acesso a festa</p>
                </div>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform text-emerald-200 flex-shrink-0" />
            </button>
          </div>

        </div>
      </main>

      {/* MODAL DE LOGIN / CADASTRO / RECUPERAÇÃO DE SENHA (ABERTO PELO BOTÃO SUPERIOR) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-2xl space-y-4 text-left border border-amber-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-serif">
                <Lock size={20} className="text-amber-600" />
                Acesso Restrito
              </h2>
              <button onClick={() => setIsAuthModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* SELEÇÃO DE PERFIL */}
            {authMode !== 'forgot' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selecione o Perfil</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${selectedRole === 'admin' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    <ShieldCheck size={14} /> Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('portaria')}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${selectedRole === 'portaria' ? 'bg-blue-900 text-white border-blue-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                  >
                    <UserCheck size={14} /> Portaria
                  </button>
                </div>
              </div>
            )}

            {/* ABAS DE MODO (Entrar / Cadastrar) */}
            {authMode !== 'forgot' && (
              <div className="flex gap-2 bg-amber-50 p-1 rounded-xl border border-amber-200">
                <button onClick={() => setAuthMode('login')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'}`}>Entrar</button>
                <button onClick={() => setAuthMode('register')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600'}`}>Cadastrar</button>
              </div>
            )}

            {/* FORMULÁRIO DE LOGIN */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Utilizador</label>
                  <input type="text" placeholder="Digite o seu utilizador" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Palavra-passe</label>
                  <input type="password" placeholder="Digite a sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs text-amber-700 hover:underline font-semibold">Esqueceu a senha?</button>
                </div>
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">Entrar no Baile</button>
              </form>
            )}

            {/* FORMULÁRIO DE CADASTRO */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Completo</label>
                  <input type="text" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Telemóvel (WhatsApp / Login)</label>
                  <input type="tel" placeholder="86999999999" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Senha</label>
                  <input type="password" placeholder="Crie uma senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirmar Senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-amber-200 font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">Solicitar Acesso</button>
              </form>
            )}

            {/* FORMULÁRIO DE RECUPERAÇÃO DE SENHA */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><KeyRound size={16} className="text-amber-600" /> Recuperar Senha</h3>
                  <button type="button" onClick={() => setAuthMode('login')} className="text-xs text-amber-700 underline font-semibold">Voltar ao Login</button>
                </div>
                <p className="text-xs text-slate-500">Insira o seu número de telemóvel cadastrado para recuperar a sua senha:</p>
                <input type="tel" placeholder="Ex: 86999999999" value={forgotPhone} onChange={(e) => setForgotPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" required />
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">Recuperar Senha</button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL ÁREA DO CONVIDADO (WHATSAPP OTP) */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto border border-amber-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 font-serif">
                🌹 Portal do Convidado
              </h2>
              <button onClick={() => setIsGuestModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-600">Insira o seu número de telemóvel para receber o código de acesso via WhatsApp:</p>
                <input type="tel" placeholder="Ex: 86999999999" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3 rounded-xl text-sm shadow-sm">Enviar Código via WhatsApp</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-600">Insira o código enviado (Dica: use <b>1234</b> se preferir):</p>
                <input type="text" placeholder="1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2.5 rounded-xl text-sm shadow-sm">Confirmar Código</button>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs font-medium">🌹 Convites encontrados para o Baile:</div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {guestGuestsList.map((g) => {
                    const qrCardText = `EVENTO: Baile 15 Anos Rebeca Guerra Maia (Bela e a Fera)\nCONVIDADO: ${g.name}\nSTATUS: Pessoal e Intransferível`;
                    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCardText)}`;
                    return (
                      <div key={g.id} className="bg-slate-50 border border-amber-200 p-4 rounded-xl flex items-center gap-4">
                        <img src={qrImageUrl} alt="QR Code" className="w-20 h-20 bg-white p-1 rounded-lg border border-amber-300 flex-shrink-0" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-slate-800 text-sm font-serif">{g.name}</p>
                          <p className="text-slate-600">Categoria: {g.category === 'crianca' ? 'Criança (<10)' : 'Adulto'}</p>
                          <p className="text-rose-700 font-semibold">Pessoal e Intransferível</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setIsGuestModalOpen(false)} className="w-full bg-slate-900 text-amber-200 font-medium py-2.5 rounded-xl text-xs">Fechar Portal</button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}