"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, RotateCcw, LogOut } from 'lucide-react';

export default function PortariaPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [guestInfo, setGuestInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const session = localStorage.getItem('currentUser');
    if (!session) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(session);
    if (parsed.role !== 'portaria' && parsed.role !== 'admin') {
      router.push('/');
      return;
    }
    setCurrentUser(parsed);

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error(error));
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const onScanSuccess = async (decodedText) => {
    setScanResult(decodedText);
    await validateQrCode(decodedText);
  };

  const onScanError = () => {};

  const validateQrCode = async (qrData) => {
    setLoading(true);
    setStatusMessage({ type: '', text: '' });
    setGuestInfo(null);

    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('qr_code', qrData)
        .maybeSingle();

      if (error || !data) {
        setStatusMessage({ type: 'error', text: 'QR Code inválido ou convidado não encontrado!' });
        setLoading(false);
        return;
      }

      setGuestInfo(data);
      const isConfirmed = data.attendance_status === 'confirmado' || (data.confirmed && !data.attendance_status);
      
      if (!isConfirmed) {
        setStatusMessage({ type: 'warning', text: `Atenção: O convite de ${data.name} consta como PENDENTE ou RECUSADO!` });
        setLoading(false);
        return;
      }

      if (data.checked_in) {
        setStatusMessage({ type: 'warning', text: `⚠️ ALERTA: Este QR Code já foi UTILIZADO anteriormente!` });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.from('guests').update({ checked_in: true }).eq('id', data.id);
      if (!updateError) {
        setStatusMessage({ type: 'success', text: `✅ ENTRADA AUTORIZADA: Seja bem-vindo(a), ${data.name}!` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Erro interno ao validar o QR Code.' });
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setGuestInfo(null);
    setStatusMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans flex flex-col items-center">
      <div className="max-w-xl w-full space-y-6">
        
        {/* CABEÇALHO COM LOGOFF E SESSÃO */}
        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Portaria do Evento</h2>
            {currentUser && <p className="text-xs text-slate-400">Operador: <strong className="text-white">{currentUser.name}</strong></p>}
          </div>
          <button onClick={handleLogout} className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
            <LogOut size={14} /> Logoff
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={16} /> Controlo de Portaria
          </div>
          <h1 className="text-2xl font-bold">Aniversário 15 Anos Rebeca Guerra</h1>
        </div>

        <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          <div id="reader" className="w-full rounded-xl overflow-hidden"></div>
        </div>

        {loading && (
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center animate-pulse">
            <p className="text-pink-400 font-medium">A validar QR Code...</p>
          </div>
        )}

        {statusMessage.text && (
          <div className={`p-6 rounded-2xl border space-y-4 shadow-lg ${
            statusMessage.type === 'success' ? 'bg-green-950/50 border-green-500/50 text-green-200' :
            statusMessage.type === 'warning' ? 'bg-amber-950/50 border-amber-500/50 text-amber-200' :
            'bg-red-950/50 border-red-500/50 text-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {statusMessage.type === 'success' && <CheckCircle2 size={28} className="text-green-400 flex-shrink-0 mt-0.5" />}
              {statusMessage.type === 'warning' && <AlertTriangle size={28} className="text-amber-400 flex-shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <XCircle size={28} className="text-red-400 flex-shrink-0 mt-0.5" />}
              
              <div className="space-y-1">
                <p className="font-bold text-base">{statusMessage.text}</p>
                {guestInfo && (
                  <div className="text-xs space-y-0.5 opacity-90 pt-2 border-t border-white/10">
                    <p><strong>Convidado:</strong> {guestInfo.name}</p>
                    <p><strong>Categoria:</strong> {guestInfo.category === 'crianca' ? 'Criança (<10 anos)' : 'Adulto'}</p>
                    <p><strong>Telefone:</strong> {guestInfo.phone}</p>
                  </div>
                )}
              </div>
            </div>

            <button onClick={resetScanner} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
              <RotateCcw size={14} /> Ler Próximo QR Code
            </button>
          </div>
        )}

      </div>
    </div>
  );
}