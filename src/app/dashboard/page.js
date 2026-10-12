"use client";

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import { Trash2, CheckCircle, Clock, Send, Users, User, ChevronDown, ChevronUp, XCircle, Edit3, QrCode, LogOut, Shield } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [guests, setGuests] = useState([]);
  const [tab, setTab] = useState('individual');
  
  // Estados Individual
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('adulto');

  // Estados Família
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familySizeInput, setFamilySizeInput] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);

  // Estados de Edição
  const [editingGuest, setEditingGuest] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('adulto');

  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('currentUser');
    if (!session) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(session);
    if (parsed.role !== 'admin') {
      router.push('/');
      return;
    }
    setCurrentUser(parsed);
    fetchGuests();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/');
  };

  const fetchGuests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setGuests(data || []);
    setLoading(false);
  };

  const handleFamilySizeChange = (e) => {
    const val = e.target.value;
    setFamilySizeInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0 && num <= 15) {
      const current = [...familyMembers];
      if (num > current.length) {
        const added = Array(num - current.length).fill(null).map(() => ({ name: '', category: 'adulto' }));
        setFamilyMembers([...current, ...added]);
      } else {
        setFamilyMembers(current.slice(0, num));
      }
    } else {
      setFamilyMembers([]);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const toggleExpandFamily = (groupKey) => {
    setExpandedFamilies(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const checkPhoneExists = async (phoneNumber, excludeId = null) => {
    const cleanCurrent = phoneNumber.replace(/\D/g, '');
    const { data } = await supabase.from('guests').select('id, phone');
    if (!data) return false;
    return data.some(g => g.id !== excludeId && g.phone && g.phone.replace(/\D/g, '') === cleanCurrent);
  };

  const addIndividual = async (e) => {
    e.preventDefault();
    if (await checkPhoneExists(phone)) {
      alert('Telemóvel já cadastrado!');
      return;
    }

    const cleanNameQr = name.trim().replace(/[^a-zA-Z0-9 ]/g, '');
    const qrCodeData = `EVENTO: Aniversário 15 Anos Rebeca Guerra | CONVIDADO: ${cleanNameQr} | STATUS: Pessoal e Intransferível`; 

    const { data, error } = await supabase
      .from('guests')
      .insert([{ name, phone, category, family_group: null, attendance_status: 'pendente', confirmed: false, qr_code: qrCodeData }])
      .select();

    if (!error && data) {
      setGuests([data[0], ...guests]);
      setName(''); setPhone(''); setCategory('adulto');
    }
  };

  const addFamily = async (e) => {
    e.preventDefault();
    if (await checkPhoneExists(familyPhone)) {
      alert('Telemóvel já cadastrado!');
      return;
    }

    const validMembers = familyMembers.filter(m => m.name.trim() !== '');
    if (validMembers.length === 0) return;

    const groupIdentifier = `Família ${familyName.trim()}`;
    const rowsToInsert = validMembers.map(m => ({
      name: m.name,
      phone: familyPhone,
      category: m.category,
      family_group: groupIdentifier,
      attendance_status: 'pendente',
      confirmed: false,
      qr_code: `EVENTO: Aniversário 15 Anos Rebeca Guerra | CONVIDADO: ${m.name.trim()} (${groupIdentifier}) | STATUS: Pessoal e Intransferível`
    }));

    const { data, error } = await supabase.from('guests').insert(rowsToInsert).select();
    if (!error && data) {
      setGuests([...data, ...guests]);
      setFamilyName(''); setFamilyPhone(''); setFamilySizeInput(''); setFamilyMembers([]);
    }
  };

  const startEditing = (guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditPhone(guest.phone);
    setEditCategory(guest.category || 'adulto');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;

    const cleanNameQr = editName.trim().replace(/[^a-zA-Z0-9 ]/g, '');
    const updatedQr = `EVENTO: Aniversário 15 Anos Rebeca Guerra | CONVIDADO: ${cleanNameQr} | STATUS: Pessoal e Intransferível`;

    const { error } = await supabase
      .from('guests')
      .update({ name: editName, phone: editPhone, category: editCategory, qr_code: updatedQr })
      .eq('id', editingGuest.id);

    if (!error) {
      setGuests(guests.map(g => g.id === editingGuest.id ? { ...g, name: editName, phone: editPhone, category: editCategory, qr_code: updatedQr } : g));
      setEditingGuest(null);
    }
  };

  const deleteGuest = async (id) => {
    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (!error) setGuests(guests.filter(g => g.id !== id));
  };

  const deleteFamilyGroup = async (groupKey) => {
    if (!confirm('Remover família inteira?')) return;
    const { error } = await supabase.from('guests').delete().eq('family_group', `Família ${groupKey}`);
    if (!error) setGuests(guests.filter(g => !g.family_group || !g.family_group.includes(groupKey)));
  };

  const sendWhatsApp = (guest, familyMembersList = null, isQrCode = false) => {
    const cleanPhone = guest.phone.replace(/\D/g, '');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const slug = guest.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const rsvpLink = `${baseUrl}/rsvp/${slug}-${guest.id}`;
    
    let message = '';
    if (isQrCode) {
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guest.qr_code)}`;
      message = encodeURIComponent(`🎟️ *Aniversário 15 Anos Rebeca Guerra*\n\nOlá ${guest.name}! Sua presença está confirmada.\n\nQR Code de acesso (*pessoal e intransferível*):\n${qrImageUrl}\n\nDetalhes: ${rsvpLink}`);
    } else if (familyMembersList && familyMembersList.length > 1) {
      const namesList = familyMembersList.map(m => m.name).join(', ');
      message = encodeURIComponent(`Olá! Convidamos você e sua família (${namesList}) para celebrar o Aniversário 15 Anos Rebeca Guerra. Confirme em:\n\n${rsvpLink}`);
    } else {
      message = encodeURIComponent(`Olá ${guest.name}! Convidamos você para celebrar o Aniversário 15 Anos Rebeca Guerra. Confirme em:\n\n${rsvpLink}`);
    }

    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  // Função unificada para renderizar o status com primeira letra maiúscula e cores consistentes
  const renderStatusBadge = (statusValue, isCompact = false) => {
    const st = (statusValue || 'pendente').toLowerCase();
    const padding = isCompact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold';

    if (st === 'confirmado') {
      return (
        <span className={`rounded-full font-semibold bg-green-100 text-green-700 ${padding}`}>
          Confirmado
        </span>
      );
    }
    if (st === 'recusado') {
      return (
        <span className={`rounded-full font-semibold bg-red-100 text-red-700 ${padding}`}>
          Recusado
        </span>
      );
    }
    return (
      <span className={`rounded-full font-semibold bg-amber-100 text-amber-700 ${padding}`}>
        Pendente
      </span>
    );
  };

  const individualGuests = guests.filter(g => !g.family_group);
  const familyGroupsMap = {};
  guests.filter(g => g.family_group).forEach(g => {
    const key = g.family_group.replace(/\s*\(\d+\)/g, '').replace('Família ', '').trim();
    if (!familyGroupsMap[key]) familyGroupsMap[key] = [];
    familyGroupsMap[key].push(g);
  });

  const MAX_CONVIDADOS_ADULTOS = 55;
  const adultos = guests.filter(g => g.category !== 'crianca');
  const adultosConfirmados = adultos.filter(g => g.attendance_status === 'confirmado' || (g.confirmed && !g.attendance_status));
  const adultosPendentes = adultos.filter(g => !g.attendance_status || g.attendance_status === 'pendente');
  const adultosRecusados = adultos.filter(g => g.attendance_status === 'recusado');

  const criancas = guests.filter(g => g.category === 'crianca');
  const criancasConfirmadas = criancas.filter(g => g.attendance_status === 'confirmado' || (g.confirmed && !g.attendance_status));
  const criancasPendentes = criancas.filter(g => !g.attendance_status || g.attendance_status === 'pendente');
  const criancasRecusadas = criancas.filter(g => g.attendance_status === 'recusado');

  const convitesEnviados = guests.filter(g => g.attendance_status !== 'recusado').length;
  const convitesRecusadosTotal = adultosRecusados.length + criancasRecusadas.length;
  const convitesDisponiveis = MAX_CONVIDADOS_ADULTOS - adultosConfirmados.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO COM SESSÃO E BOTÕES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Painel de Gestão - Aniversário 15 Anos</h1>
            {currentUser && <p className="text-xs text-slate-500 mt-1">Logado como: <strong className="text-slate-800">{currentUser.name}</strong> (<span className="text-pink-600 uppercase font-bold">{currentUser.role}</span>)</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push('/dashboard/users')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
              <Users size={16} /> Utilizadores Cadastrados
            </button>
            <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
              <LogOut size={16} /> Logoff
            </button>
          </div>
        </div>
        
        {/* Painel Totalizador */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Máximo</p><p className="text-xl font-bold text-slate-800">{MAX_CONVIDADOS_ADULTOS}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Enviados</p><p className="text-xl font-bold text-pink-600">{convitesEnviados}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Disponíveis</p><p className="text-xl font-bold text-blue-600">{convitesDisponiveis >= 0 ? convitesDisponiveis : 0}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 leading-tight">Adultos Confirmados</p><p className="text-xl font-bold text-green-600">{adultosConfirmados.length}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 leading-tight">Crianças Confirmadas</p><p className="text-xl font-bold text-emerald-600">{criancasConfirmadas.length}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 leading-tight">Adultos Pendentes</p><p className="text-xl font-bold text-amber-500">{adultosPendentes.length}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[9px] font-semibold text-gray-400 uppercase mb-1 leading-tight">Crianças Pendentes</p><p className="text-xl font-bold text-orange-400">{criancasPendentes.length}</p></div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Recusados</p><p className="text-xl font-bold text-red-600">{convitesRecusadosTotal}</p></div>
        </div>

        {/* Modal de Edição */}
        {editingGuest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Editar Convidado</h2>
              <form onSubmit={saveEdit} className="space-y-4">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border rounded-lg p-3" required />
                <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border rounded-lg p-3" required />
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border rounded-lg p-3 bg-white">
                  <option value="adulto">Adulto</option>
                  <option value="crianca">Criança (&lt;10 anos)</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-pink-600 text-white py-2.5 rounded-lg">Salvar</button>
                  <button type="button" onClick={() => setEditingGuest(null)} className="flex-1 bg-gray-100 py-2.5 rounded-lg">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-4 mb-6 border-b pb-4">
            <button onClick={() => setTab('individual')} className={`px-5 py-2.5 rounded-lg font-medium ${tab === 'individual' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-slate-600'}`}>Cadastrar Individual</button>
            <button onClick={() => setTab('family')} className={`px-5 py-2.5 rounded-lg font-medium ${tab === 'family' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-slate-600'}`}>Cadastrar Família</button>
          </div>

          {tab === 'individual' && (
            <form onSubmit={addIndividual} className="flex flex-col md:flex-row gap-4 items-center">
              <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 w-full border rounded-lg p-3" required />
              <input type="tel" placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 w-full border rounded-lg p-3" required />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full md:w-48 border rounded-lg p-3 bg-white">
                <option value="adulto">Adulto</option>
                <option value="crianca">Criança (&lt;10 anos)</option>
              </select>
              <button type="submit" className="bg-pink-600 text-white px-8 py-3 rounded-lg font-medium">Adicionar</button>
            </form>
          )}

          {tab === 'family' && (
            <form onSubmit={addFamily} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input type="text" placeholder="Sobrenome da Família" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="flex-1 border rounded-lg p-3" required />
                <input type="tel" placeholder="WhatsApp do Responsável" value={familyPhone} onChange={(e) => setFamilyPhone(e.target.value)} className="flex-1 border rounded-lg p-3" required />
                <input type="number" min="0" max="15" value={familySizeInput} onChange={handleFamilySizeChange} placeholder="Qtd Membros" className="w-full md:w-48 border rounded-lg p-3" />
              </div>
              {familyMembers.length > 0 && (
                <div className="bg-pink-50 p-4 rounded-xl space-y-3">
                  {familyMembers.map((m, i) => (
                    <div key={i} className="flex gap-3">
                      <input type="text" placeholder={`Nome do Membro ${i + 1}`} value={m.name} onChange={(e) => handleMemberChange(i, 'name', e.target.value)} className="flex-1 border bg-white rounded-lg p-2.5 text-sm" required />
                      <select value={m.category} onChange={(e) => handleMemberChange(i, 'category', e.target.value)} className="w-40 border bg-white rounded-lg p-2.5 text-sm">
                        <option value="adulto">Adulto</option>
                        <option value="crianca">Criança (&lt;10 anos)</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium">Cadastrar Família</button>
            </form>
          )}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-slate-600">
              <tr>
                <th className="p-4 font-medium">Convidado / Família</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">WhatsApp</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">QR Code</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">A carregar...</td></tr>
              ) : (
                <>
                  {individualGuests.map((guest) => {
                    const st = guest.attendance_status || (guest.confirmed ? 'confirmado' : 'pendente');
                    const formattedCategory = (guest.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                    return (
                      <tr key={guest.id} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-800">{guest.name}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${guest.category === 'crianca' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100'}`}>{formattedCategory}</span></td>
                        <td className="p-4 text-slate-600">{guest.phone}</td>
                        <td className="p-4">{renderStatusBadge(st)}</td>
                        <td className="p-4"><div className="w-12 h-12 bg-white p-1 border rounded-md"><QRCodeSVG value={guest.qr_code} size={100} style={{ width: '100%', height: '100%' }} /></div></td>
                        <td className="p-4 text-right space-x-2">
                          {st.toLowerCase() === 'confirmado' ? (
                            <button onClick={() => sendWhatsApp(guest, null, true)} className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium"><QrCode size={14} className="inline mr-1"/> QR Code</button>
                          ) : (
                            <button onClick={() => sendWhatsApp(guest, null, false)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium"><Send size={14} className="inline mr-1"/> Convite</button>
                          )}
                          <button onClick={() => startEditing(guest)} className="p-2 text-blue-400 hover:text-blue-600"><Edit3 size={18} /></button>
                          <button onClick={() => deleteGuest(guest.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    );
                  })}

                  {Object.entries(familyGroupsMap).map(([groupKey, members]) => {
                    const isExpanded = expandedFamilies[groupKey];
                    const confirmedCount = members.filter(m => {
                      const st = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                      return st.toLowerCase() === 'confirmado';
                    }).length;
                    return (
                      <Fragment key={groupKey}>
                        <tr className="bg-pink-50/30 border-t-2 border-pink-100">
                          <td className="p-4 font-bold text-slate-800">
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleExpandFamily(groupKey)} className="text-pink-600 bg-white p-1 rounded-md border">{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                              <span>Família {groupKey}</span>
                              <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">{members.length} membros</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-gray-500">Família</td>
                          <td className="p-4 text-slate-600">{members[0]?.phone}</td>
                          <td className="p-4"><span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{confirmedCount} de {members.length} Confirmados</span></td>
                          <td className="p-4 text-xs text-gray-400">Ver membros</td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => sendWhatsApp(members[0], members, false)} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium"><Send size={14} className="inline mr-1"/> Convite</button>
                            <button onClick={() => deleteFamilyGroup(groupKey)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                        {isExpanded && members.map(m => {
                          const memberSt = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                          const formattedCategory = (m.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                          return (
                            <tr key={m.id} className="bg-white border-l-4 border-l-pink-400">
                              <td className="p-3 pl-10 text-slate-700 font-medium">{m.name}</td>
                              <td className="p-3"><span className="text-xs px-2 py-0.5 bg-slate-100 rounded">{formattedCategory}</span></td>
                              <td className="p-3 text-sm text-slate-500">{m.phone}</td>
                              <td className="p-3">{renderStatusBadge(memberSt, true)}</td>
                              <td className="p-3"><div className="w-10 h-10 bg-white p-1 border rounded"><QRCodeSVG value={m.qr_code} size={80} style={{ width: '100%', height: '100%' }} /></div></td>
                              <td className="p-3 text-right space-x-1">
                                {memberSt.toLowerCase() === 'confirmado' && (
                                  <button onClick={() => sendWhatsApp(m, null, true)} className="p-1.5 bg-purple-600 text-white rounded"><QrCode size={16}/></button>
                                )}
                                <button onClick={() => startEditing(m)} className="p-1.5 text-blue-400"><Edit3 size={16}/></button>
                                <button onClick={() => deleteGuest(m.id)} className="p-1.5 text-red-400"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}