"use client";

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Calendar, MapPin, Sparkles } from 'lucide-react';

function RsvpContent() {
  const params = useParams();
  const slugParam = params?.id || ''; 
  
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [responded, setResponded] = useState(false);

  useEffect(() => {
    if (slugParam) {
      fetchGuestDetails();
    }
  }, [slugParam]);

  const fetchGuestDetails = async () => {
    try {
      // Extrai o ID do final do slug (último segmento após o último hífen)
      const parts = slugParam.split('-');
      const rawId = parts[parts.length - 1];

      console.log("Slug recebido:", slugParam, "| ID extraído:", rawId);

      // 1. Tenta buscar diretamente pelo ID extraído (compatível com UUID ou string)
      let { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', rawId)
        .maybeSingle();

      // 2. Se falhar ou não encontrar e o ID for numérico, tenta como inteiro
      if ((error || !data) && !isNaN(rawId)) {
        const numericId = parseInt(rawId, 10);
        const resNumeric = await supabase
          .from('guests')
          .select('*')
          .eq('id', numericId)
          .maybeSingle();
        data = resNumeric.data;
        error = resNumeric.error;
      }

      // 3. Fallback de segurança: se ainda não encontrou, tenta buscar por correspondência parcial no ID ou nome
      if (!data) {
        const { data: allGuests } = await supabase.from('guests').select('*');
        if (allGuests) {
          const found = allGuests.find(g => String(g.id) === String(rawId) || slugParam.includes(g.id));
          if (found) data = found;
        }
      }

      if (!data) {
        console.error('Convidado não encontrado para o ID:', rawId);
      } else {
        setGuest(data);
        if (data.attendance_status && data.attendance_status !== 'pendente') {
          setResponded(true);
        }
      }
    } catch (err) {
      console.error('Erro crítico ao buscar convidado:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (status) => {
    if (!guest) return;

    const { error } = await supabase
      .from('guests')
      .update({ 
        attendance_status: status,
        confirmed: status === 'confirmado' 
      })
      .eq('id', guest.id);

    if (!error) {
      setGuest({ ...guest, attendance_status: status, confirmed: status === 'confirmado' });
      setResponded(true);
    } else {
      alert('Erro ao registar resposta. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">A carregar o seu convite especial...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full space-y-3">
          <h1 className="text-2xl font-bold text-slate-800">Convite não encontrado</h1>
          <p className="text-slate-600">Verifique o link recebido ou entre em contacto com os organizadores.</p>
        </div>
      </div>
    );
  }

  const isConfirmed = guest.attendance_status === 'confirmado' || (guest.confirmed && !guest.attendance_status);
  const isRefused = guest.attendance_status === 'recusado';

  const qrCardText = `EVENTO: Aniversário 15 Anos Rebeca Guerra\nCONVIDADO: ${guest.name}\nSTATUS: Pessoal e Intransferível`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCardText)}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white max-w-lg w-full p-8 rounded-3xl shadow-xl border border-pink-100 text-center space-y-6 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-500"></div>

        <div className="space-y-2 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-bold tracking-wider uppercase">
            <Sparkles size={14} /> Convite Especial
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Aniversário 15 Anos Rebeca Guerra</h1>
          <p className="text-slate-600 text-sm">Olá, <strong className="text-pink-600">{guest.name}</strong>! É uma alegria imensa contar com a sua presença.</p>
        </div>

        <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 flex flex-col gap-2 text-left text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <Calendar className="text-pink-600 flex-shrink-0" size={18} />
            <span>Confirme sua presença com antecedência.</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="text-pink-600 flex-shrink-0" size={18} />
            <span>Local exclusivo em Teresina - PI</span>
          </div>
        </div>

        {!responded || (!isConfirmed && !isRefused) ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm font-semibold text-slate-700">Você poderá comparecer ao evento?</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleResponse('confirmado')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Sim, poderei ir!
              </button>
              <button
                onClick={() => handleResponse('recusado')}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                Não poderei ir
              </button>
            </div>
          </div>
        ) : isConfirmed ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg">
              <CheckCircle2 size={24} />
              Presença Confirmada!
            </div>
            <p className="text-xs text-slate-600">
              Obrigado por confirmar! Apresente o seu QR Code pessoal e intransferível na portaria do evento.
            </p>
            
            <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm max-w-[220px] mx-auto space-y-2">
              <img src={qrImageUrl} alt="QR Code de Acesso" className="w-full h-auto rounded-lg" />
              <div className="text-[11px] text-slate-500 font-semibold leading-tight">
                <p className="text-slate-800 font-bold">{guest.name}</p>
                <p className="text-pink-600 mt-0.5">Pessoal e Intransferível</p>
              </div>
            </div>

            <button
              onClick={() => setResponded(false)}
              className="text-xs text-slate-500 underline hover:text-slate-700 font-medium"
            >
              Alterar minha resposta
            </button>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-center gap-2 text-red-700 font-bold text-lg">
              <XCircle size={24} />
              Resposta Registrada
            </div>
            <p className="text-xs text-slate-600">
              Lamentamos que não possa comparecer, mas agradecemos por nos avisar!
            </p>
            <button
              onClick={() => setResponded(false)}
              className="text-xs text-slate-500 underline hover:text-slate-700 font-medium"
            >
              Alterar minha resposta
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 font-medium">A carregar...</p>
        </div>
      </div>
    }>
      <RsvpContent />
    </Suspense>
  );
}