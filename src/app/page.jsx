"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, UserCheck, Phone, ArrowRight, Sparkles, Lock } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState(null); // 'admin' | 'portaria' | 'guest'
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Estados Form Login/Registo
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Estados Convidado (WhatsApp OTP)
  const [phoneInput, setPhoneInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(1);
  const [guestGuestsList, setGuestGuestsList] = useState([]);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const roleTarget = activeModal === 'admin' ? 'admin' : 'portaria';

    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password)
      .eq('role', roleTarget)
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

    if (roleTarget === 'admin') {
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

    const roleTarget = activeModal === 'admin' ? 'admin' : 'portaria';
    const cleanPhone = phone.replace(/\D/g, '');

    const { error } = await supabase
      .from('system_users')
      .insert([{
        name: fullName,
        phone: cleanPhone,
        username: cleanPhone,
        password: password,
        role: roleTarget,
        status: 'pendente'
      }]);

    if (error) {
      alert('Erro ao registar. Este número ou nome de utilizador já pode estar em uso.');
    } else {
      alert('Registo efetuado com sucesso! O seu acesso está pendente de aprovação pelo Administrador.');
      setActiveModal(null);
      setAuthMode('login');
    }
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

    const message = encodeURIComponent(`Olá! O seu código de acesso ao Aniversário 15 Anos Rebeca Guerra é: *${code}*`);
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} /> Portal Oficial
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800">Aniversário 15 Anos Rebeca Guerra</h1>
          <p className="text-slate-600 text-sm">Selecione o perfil de acesso desejado:</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => { setActiveModal('guest'); setStep(1); setPhoneInput(''); setOtpCode(''); }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-4 rounded-2xl shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <Phone size={22} />
              <div className="text-left">
                <p className="text-base">Área do Convidado</p>
                <p className="text-xs font-normal opacity-90">Ver QR Codes via WhatsApp</p>
              </div>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => { setActiveModal('admin'); setAuthMode('login'); setUsername(''); setPassword(''); }}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-4 rounded-2xl shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} className="text-pink-400" />
              <div className="text-left">
                <p className="text-base">Administrador</p>
                <p className="text-xs font-normal text-slate-400">Login ou Registo de Administrador</p>
              </div>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => { setActiveModal('portaria'); setAuthMode('login'); setUsername(''); setPassword(''); }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-4 rounded-2xl shadow-md transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <UserCheck size={22} />
              <div className="text-left">
                <p className="text-base">Controlo de Portaria</p>
                <p className="text-xs font-normal opacity-90">Login ou Registo de Portaria</p>
              </div>
            </div>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* MODAL ADMIN / PORTARIA */}
      {(activeModal === 'admin' || activeModal === 'portaria') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Lock size={20} className="text-pink-600" />
                {activeModal === 'admin' ? 'Painel Admin' : 'Painel Portaria'}
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setAuthMode('login')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Entrar</button>
              <button onClick={() => setAuthMode('register')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${authMode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>Cadastrar</button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Utilizador</label>
                  <input type="text" placeholder="Digite o seu utilizador" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Palavra-passe</label>
                  <input type="password" placeholder="Digite a sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">Entrar</button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
                  <input type="text" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Telemóvel (WhatsApp / Login)</label>
                  <input type="tel" placeholder="86999999999" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Senha</label>
                  <input type="password" placeholder="Crie uma senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Confirmar Senha</label>
                  <input type="password" placeholder="Repita a senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" required />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm">Solicitar Registo</button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL CONVIDADO (WHATSAPP OTP) */}
      {activeModal === 'guest' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl shadow-xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Phone size={20} className="text-emerald-600" /> Portal do Convidado
              </h2>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-slate-600">Insira o seu número de telemóvel para receber o código via WhatsApp:</p>
                <input type="tel" placeholder="Ex: 86999999999" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm">Enviar Código por WhatsApp</button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-xs text-slate-600">Insira o código enviado (Dica: use <b>1234</b> se preferir):</p>
                <input type="text" placeholder="1234" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm">Confirmar Código</button>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs font-medium">✅ Convites encontrados:</div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {guestGuestsList.map((g) => {
                    const qrCardText = `EVENTO: Aniversário 15 Anos Rebeca Guerra\nCONVIDADO: ${g.name}\nSTATUS: Pessoal e Intransferível`;
                    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCardText)}`;
                    return (
                      <div key={g.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-4">
                        <img src={qrImageUrl} alt="QR Code" className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-200 flex-shrink-0" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-slate-800 text-sm">{g.name}</p>
                          <p className="text-slate-500">Categoria: {g.category === 'crianca' ? 'Criança (<10)' : 'Adulto'}</p>
                          <p className="text-pink-600 font-semibold">Pessoal e Intransferível</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setActiveModal(null)} className="w-full bg-slate-800 text-white font-medium py-2.5 rounded-xl text-xs">Fechar Portal</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}