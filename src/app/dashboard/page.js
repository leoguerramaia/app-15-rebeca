"use client";

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';
import { Trash2, CheckCircle, Clock, Send, Users, User, ChevronDown, ChevronUp, XCircle, Edit3, QrCode, LogOut, Shield, Filter, Printer, Sparkles, Check, AlertTriangle, UserCheck, UserX, Award, Bookmark, FileSpreadsheet, Eye } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [guests, setGuests] = useState([]);
  const [tab, setTab] = useState('individual');
  
  // Filtros múltiplos
  const [activeFilters, setActiveFilters] = useState([]);
  
  // Modals de Relatório (Excel & Pré-visualização para Impressão)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [printPreviewData, setPrintPreviewData] = useState(null);
  const [printPreviewTitle, setPrintPreviewTitle] = useState('');

  // Estados Individual
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('adulto');
  const [categoriaConvite, setCategoriaConvite] = useState('REGULARES');
  const [observacao, setObservacao] = useState('Amiga Rebeca');

  // Estados Família
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familySizeInput, setFamilySizeInput] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyCategoriaConvite, setFamilyCategoriaConvite] = useState('REGULARES');
  const [familyObservacao, setFamilyObservacao] = useState('Amiga Rebeca');

  // Estados de Edição Individual / Membro
  const [editingGuest, setEditingGuest] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCategory, setEditCategory] = useState('adulto');
  const [editCategoriaConvite, setEditCategoriaConvite] = useState('REGULARES');
  const [editObservacao, setEditObservacao] = useState('Amiga Rebeca');

  // Estados de Edição de Grupo Familiar Inteiro
  const [editingFamilyGroup, setEditingFamilyGroup] = useState(null);
  const [editFamilyGroupName, setEditFamilyGroupName] = useState('');
  const [editFamilyGroupPhone, setEditFamilyGroupPhone] = useState('');
  const [editFamilyGroupCategoria, setEditFamilyGroupCategoria] = useState('REGULARES');
  const [editFamilyGroupObs, setEditFamilyGroupObs] = useState('Amiga Rebeca');

  const [expandedFamilies, setExpandedFamilies] = useState({}); // Fechadas por padrão
  const [loading, setLoading] = useState(true);

  const observacaoOptions = ['Amiga Rebeca', 'Petrolina', 'Teresina', 'Recife', 'Garanhuns', 'Brasília', 'Outros'];

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

    if (!error) {
      setGuests(data || []);
      setExpandedFamilies({});
    }
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
      .insert([{
        name,
        phone,
        category,
        family_group: null,
        attendance_status: 'pendente',
        confirmed: false,
        qr_code: qrCodeData,
        categoria_convite: categoriaConvite,
        observacao,
        status_envio: false
      }])
      .select();

    if (!error && data) {
      setGuests([data[0], ...guests]);
      setName(''); setPhone(''); setCategory('adulto'); setCategoriaConvite('REGULARES'); setObservacao('Amiga Rebeca');
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
      categoria_convite: familyCategoriaConvite,
      observacao: familyObservacao,
      status_envio: false,
      qr_code: `EVENTO: Aniversário 15 Anos Rebeca Guerra | CONVIDADO: ${m.name.trim()} (${groupIdentifier}) | STATUS: Pessoal e Intransferível`
    }));

    const { data, error } = await supabase.from('guests').insert(rowsToInsert).select();
    if (!error && data) {
      setGuests([...data, ...guests]);
      setFamilyName(''); setFamilyPhone(''); setFamilySizeInput(''); setFamilyMembers([]); setFamilyCategoriaConvite('REGULARES'); setFamilyObservacao('Amiga Rebeca');
    }
  };

  const startEditing = (guest) => {
    setEditingGuest(guest);
    setEditName(guest.name);
    setEditPhone(guest.phone);
    setEditCategory(guest.category || 'adulto');
    setEditCategoriaConvite(guest.categoria_convite || 'REGULARES');
    setEditObservacao(guest.observacao || 'Amiga Rebeca');
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;

    const cleanNameQr = editName.trim().replace(/[^a-zA-Z0-9 ]/g, '');
    const updatedQr = `EVENTO: Aniversário 15 Anos Rebeca Guerra | CONVIDADO: ${cleanNameQr} | STATUS: Pessoal e Intransferível`;

    const { error } = await supabase
      .from('guests')
      .update({
        name: editName,
        phone: editPhone,
        category: editCategory,
        categoria_convite: editCategoriaConvite,
        observacao: editObservacao,
        qr_code: updatedQr
      })
      .eq('id', editingGuest.id);

    if (!error) {
      setGuests(guests.map(g => g.id === editingGuest.id ? { ...g, name: editName, phone: editPhone, category: editCategory, categoria_convite: editCategoriaConvite, observacao: editObservacao, qr_code: updatedQr } : g));
      setEditingGuest(null);
    }
  };

  const startEditingFamilyGroup = (groupKey, members) => {
    setEditingFamilyGroup(groupKey);
    setEditFamilyGroupName(groupKey);
    setEditFamilyGroupPhone(members[0]?.phone || '');
    setEditFamilyGroupCategoria(members[0]?.categoria_convite || 'REGULARES');
    setEditFamilyGroupObs(members[0]?.observacao || 'Amiga Rebeca');
  };

  const saveFamilyGroupEdit = async (e) => {
    e.preventDefault();
    if (!editingFamilyGroup) return;

    const oldGroupName = `Família ${editingFamilyGroup}`;
    const newGroupName = `Família ${editFamilyGroupName.trim()}`;

    const { error } = await supabase
      .from('guests')
      .update({
        family_group: newGroupName,
        phone: editFamilyGroupPhone,
        categoria_convite: editFamilyGroupCategoria,
        observacao: editFamilyGroupObs
      })
      .eq('family_group', oldGroupName);

    if (!error) {
      fetchGuests();
      setEditingFamilyGroup(null);
    } else {
      alert('Erro ao atualizar dados da família.');
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

  const sendWhatsApp = async (guest, familyMembersList = null, isQrCode = false) => {
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

    if (familyMembersList && familyMembersList.length > 1) {
      const ids = familyMembersList.map(m => m.id);
      await supabase.from('guests').update({ status_envio: true }).in('id', ids);
      setGuests(guests.map(g => ids.includes(g.id) ? { ...g, status_envio: true } : g));
    } else {
      await supabase.from('guests').update({ status_envio: true }).eq('id', guest.id);
      setGuests(guests.map(g => g.id === guest.id ? { ...g, status_envio: true } : g));
    }

    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const renderStatusBadge = (statusValue, isCompact = false) => {
    const st = (statusValue || 'pendente').toLowerCase();
    const padding = isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px] font-semibold';

    if (st === 'confirmado') {
      return <span className={`rounded-full font-semibold bg-green-100 text-green-700 ${padding}`}>Confirmado</span>;
    }
    if (st === 'recusado') {
      return <span className={`rounded-full font-semibold bg-red-100 text-red-700 ${padding}`}>Recusado</span>;
    }
    return <span className={`rounded-full font-semibold bg-amber-100 text-amber-700 ${padding}`}>Pendente</span>;
  };

  // --- FILTROS MÚLTIPLOS ---
  const toggleFilter = (filterName) => {
    if (filterName === 'TODOS') {
      setActiveFilters([]);
      return;
    }
    setActiveFilters(prev => {
      if (prev.includes(filterName)) {
        return prev.filter(f => f !== filterName);
      } else {
        return [...prev, filterName];
      }
    });
  };

  const filteredGuests = guests.filter(g => {
    if (activeFilters.length === 0) return true;

    const st = (g.attendance_status || (g.confirmed ? 'confirmado' : 'pendente')).toUpperCase();
    const cat = (g.category || '').toUpperCase();
    const tipo = (g.categoria_convite || 'REGULARES').toUpperCase();
    const obs = (g.observacao || '').toUpperCase();

    let matches = true;

    const statusFilters = ['CONFIRMADOS', 'PENDENTES', 'RECUSADOS'];
    const categoryFilters = ['ADULTOS', 'CRIANCAS'];
    const typeFilters = ['REGULARES', 'POSSIBILIDADE'];
    const obsFilters = observacaoOptions.map(o => o.toUpperCase());

    const activeStatus = activeFilters.filter(f => statusFilters.includes(f));
    const activeCategory = activeFilters.filter(f => categoryFilters.includes(f));
    const activeType = activeFilters.filter(f => typeFilters.includes(f));
    const activeObs = activeFilters.filter(f => obsFilters.includes(f));

    if (activeStatus.length > 0) {
      const matchSt = activeStatus.some(f => {
        if (f === 'CONFIRMADOS') return st === 'CONFIRMADO';
        if (f === 'PENDENTES') return st === 'PENDENTE';
        if (f === 'RECUSADOS') return st === 'RECUSADO';
        return false;
      });
      if (!matchSt) matches = false;
    }

    if (activeCategory.length > 0) {
      const matchCat = activeCategory.some(f => {
        if (f === 'ADULTOS') return cat !== 'CRIANCA';
        if (f === 'CRIANCAS') return cat === 'CRIANCA';
        return false;
      });
      if (!matchCat) matches = false;
    }

    if (activeType.length > 0) {
      const matchType = activeType.some(f => tipo === f);
      if (!matchType) matches = false;
    }

    if (activeObs.length > 0) {
      const matchObs = activeObs.some(f => obs === f);
      if (!matchObs) matches = false;
    }

    return matches;
  });

  // --- SEPARAÇÃO E ORDENAÇÃO ALFABÉTICA POR CLASSIFICAÇÃO ---
  const individualGuests = filteredGuests.filter(g => !g.family_group);
  const familyGroupsMap = {};
  filteredGuests.filter(g => g.family_group).forEach(g => {
    const key = g.family_group.replace(/\s*\(\d+\)/g, '').replace('Família ', '').trim();
    if (!familyGroupsMap[key]) familyGroupsMap[key] = [];
    familyGroupsMap[key].push(g);
  });

  const sortedFamilyKeys = Object.keys(familyGroupsMap).sort((a, b) => a.localeCompare(b));

  const regularFamilies = sortedFamilyKeys.filter(key => {
    const tipo = (familyGroupsMap[key][0]?.categoria_convite || 'REGULARES').toUpperCase();
    return tipo === 'REGULARES';
  });

  const possibilityFamilies = sortedFamilyKeys.filter(key => {
    const tipo = (familyGroupsMap[key][0]?.categoria_convite || 'REGULARES').toUpperCase();
    return tipo === 'POSSIBILIDADE';
  });

  const sortedIndividuals = [...individualGuests].sort((a, b) => a.name.localeCompare(b.name));

  const regularIndividuals = sortedIndividuals.filter(g => {
    const tipo = (g.categoria_convite || 'REGULARES').toUpperCase();
    return tipo === 'REGULARES';
  });

  const possibilityIndividuals = sortedIndividuals.filter(g => {
    const tipo = (g.categoria_convite || 'REGULARES').toUpperCase();
    return tipo === 'POSSIBILIDADE';
  });

  // --- MÉTRICAS ---
  const sourceGuestsForMetrics = activeFilters.length > 0 ? filteredGuests : guests;

  const MAX_CONVIDADOS_ADULTOS = 55;
  const adultos = sourceGuestsForMetrics.filter(g => g.category !== 'crianca');
  const adultosConfirmados = adultos.filter(g => g.attendance_status === 'confirmado' || (g.confirmed && !g.attendance_status));
  const adultosPendentes = adultos.filter(g => !g.attendance_status || g.attendance_status === 'pendente');
  const adultosRecusados = adultos.filter(g => g.attendance_status === 'recusado');

  const criancas = sourceGuestsForMetrics.filter(g => g.category === 'crianca');
  const criancasConfirmadas = criancas.filter(g => g.attendance_status === 'confirmado' || (g.confirmed && !g.attendance_status));
  const criancasPendentes = criancas.filter(g => !g.attendance_status || g.attendance_status === 'pendente');
  const criancasRecusadas = criancas.filter(g => g.attendance_status === 'recusado');

  const regularesCount = sourceGuestsForMetrics.filter(g => (g.categoria_convite || 'REGULARES').toUpperCase() === 'REGULARES').length;
  const possibilidadeCount = sourceGuestsForMetrics.filter(g => (g.categoria_convite || '').toUpperCase() === 'POSSIBILIDADE').length;

  const convitesEnviados = sourceGuestsForMetrics.filter(g => g.status_envio === true).length;
  const convitesRecusadosTotal = adultosRecusados.length + criancasRecusadas.length;
  
  const convitesDisponiveis = MAX_CONVIDADOS_ADULTOS - adultosPendentes.length + adultosConfirmados.length;
  const calculoExcedentes = MAX_CONVIDADOS_ADULTOS - adultosPendentes.length + adultosConfirmados.length;
  const excedentesCount = calculoExcedentes < 0 ? Math.abs(calculoExcedentes) : 0;

  // --- GERAÇÃO DE EXCEL (.xlsx) ---
  const exportExcelFile = (statusFilter) => {
    const targetGuests = guests.filter(g => {
      const st = (g.attendance_status || (g.confirmed ? 'confirmado' : 'pendente')).toLowerCase();
      if (statusFilter === 'TODOS') return true;
      if (statusFilter === 'CONFIRMADOS' && st === 'confirmado') return true;
      if (statusFilter === 'PENDENTES' && st === 'pendente') return true;
      if (statusFilter === 'RECUSADOS' && st === 'recusado') return true;
      return false;
    });

    if (targetGuests.length === 0) {
      alert(`Nenhum registo encontrado para o status: ${statusFilter}`);
      return;
    }

    const dataToExport = targetGuests.map(g => ({
      'Nome': g.name,
      'Categoria': (g.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto',
      'Tipo de Convite': g.categoria_convite || 'REGULARES',
      'Grupo Familiar': g.family_group ? g.family_group : '—',
      'WhatsApp': g.phone || '',
      'Status': (g.attendance_status || (g.confirmed ? 'confirmado' : 'pendente')).toUpperCase(),
      'Observação': g.observacao || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Convidados_${statusFilter}`);
    XLSX.writeFile(workbook, `relatorio_convidados_${statusFilter.toLowerCase()}.xlsx`);
    setIsReportModalOpen(false);
  };

  // --- VISUALIZAR PARA IMPRESSÃO ---
  const openPrintPreview = (statusFilter) => {
    const targetGuests = guests.filter(g => {
      const st = (g.attendance_status || (g.confirmed ? 'confirmado' : 'pendente')).toLowerCase();
      if (statusFilter === 'TODOS') return true;
      if (statusFilter === 'CONFIRMADOS' && st === 'confirmado') return true;
      if (statusFilter === 'PENDENTES' && st === 'pendente') return true;
      if (statusFilter === 'RECUSADOS' && st === 'recusado') return true;
      return false;
    });

    if (targetGuests.length === 0) {
      alert(`Nenhum registo encontrado para o status: ${statusFilter}`);
      return;
    }

    setPrintPreviewData(targetGuests);
    setPrintPreviewTitle(`Relatório de Convidados - ${statusFilter}`);
    setIsReportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 font-sans overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} className="text-pink-600" /> Baile Real • Gestão Oficial
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Painel de Gestão - Aniversário 15 Anos</h1>
            {currentUser && <p className="text-xs text-slate-500 mt-1">Logado como: <strong className="text-slate-800">{currentUser.name}</strong> (<span className="text-pink-600 uppercase font-bold">{currentUser.role}</span>)</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => router.push('/dashboard/users')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
              <Users size={14} /> Utilizadores
            </button>
            <button onClick={() => setIsReportModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-pink-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-pink-500/40">
              <FileSpreadsheet size={14} /> Relatórios & Excel
            </button>
            <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all">
              <LogOut size={14} /> Logoff
            </button>
          </div>
        </div>
        
        {/* Painel Totalizador em Exatamente 6 Colunas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-slate-200 text-slate-700 rounded-lg shrink-0"><Shield size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-slate-500 uppercase truncate">Máximo</p><p className="text-base font-extrabold text-slate-800">{MAX_CONVIDADOS_ADULTOS}</p></div>
          </div>
          <div className="bg-pink-50 border border-pink-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-pink-200 text-pink-700 rounded-lg shrink-0"><Send size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-pink-600 uppercase truncate">Enviados</p><p className="text-base font-extrabold text-pink-700">{convitesEnviados}</p></div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-blue-200 text-blue-700 rounded-lg shrink-0"><Users size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-blue-600 uppercase truncate">Disponíveis</p><p className={`text-base font-extrabold ${convitesDisponiveis < 0 ? 'text-red-600' : 'text-blue-700'}`}>{convitesDisponiveis}</p></div>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-amber-200 text-amber-700 rounded-lg shrink-0"><AlertTriangle size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-amber-600 uppercase truncate">Excedentes</p><p className="text-base font-extrabold text-amber-700">{excedentesCount}</p></div>
          </div>
          <div className="bg-green-50 border border-green-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-green-200 text-green-700 rounded-lg shrink-0"><UserCheck size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-green-600 uppercase truncate">Adultos Conf.</p><p className="text-base font-extrabold text-green-700">{adultosConfirmados.length}</p></div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-emerald-200 text-emerald-700 rounded-lg shrink-0"><CheckCircle size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-emerald-600 uppercase truncate">Crianças Conf.</p><p className="text-base font-extrabold text-emerald-700">{criancasConfirmadas.length}</p></div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-yellow-200 text-yellow-700 rounded-lg shrink-0"><Clock size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-yellow-600 uppercase truncate">Adultos Pend.</p><p className="text-base font-extrabold text-yellow-700">{adultosPendentes.length}</p></div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-orange-200 text-orange-700 rounded-lg shrink-0"><Clock size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-orange-600 uppercase truncate">Crianças Pend.</p><p className="text-base font-extrabold text-orange-700">{criancasPendentes.length}</p></div>
          </div>
          <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-red-200 text-red-700 rounded-lg shrink-0"><UserX size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-red-600 uppercase truncate">Recusados</p><p className="text-base font-extrabold text-red-700">{convitesRecusadosTotal}</p></div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-indigo-200 text-indigo-700 rounded-lg shrink-0"><Bookmark size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-indigo-600 uppercase truncate">Regulares</p><p className="text-base font-extrabold text-indigo-700">{regularesCount}</p></div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl shadow-sm flex items-center gap-2.5">
            <div className="p-2 bg-purple-200 text-purple-700 rounded-lg shrink-0"><Award size={16}/></div>
            <div className="min-w-0"><p className="text-[9px] font-bold text-purple-600 uppercase truncate">Possibilidade</p><p className="text-base font-extrabold text-purple-700">{possibilidadeCount}</p></div>
          </div>
        </div>

        {/* BARRA DE FILTROS MÚLTIPLOS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Filter size={14} /> Filtros Múltiplos:</span>
            {activeFilters.length > 0 && (
              <button onClick={() => setActiveFilters([])} className="text-xs text-pink-600 hover:underline font-semibold">Limpar Filtros</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => toggleFilter('TODOS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${activeFilters.length === 0 ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-pink-50'}`}
            >
              TODOS
            </button>
            {['ADULTOS', 'CRIANCAS', 'CONFIRMADOS', 'PENDENTES', 'RECUSADOS', 'REGULARES', 'POSSIBILIDADE', ...observacaoOptions].map((filterName) => {
              const isActive = activeFilters.includes(filterName);
              return (
                <button
                  key={filterName}
                  onClick={() => toggleFilter(filterName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${isActive ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-pink-50'}`}
                >
                  {isActive && <Check size={12} />}
                  {filterName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal para Escolha de Relatório (Excel vs Visualizar para Impressão) */}
        {isReportModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Centro de Relatórios</h2>
              <p className="text-xs text-slate-500">Escolha o status e a ação desejada (Gerar Excel ou Visualizar para Impressão):</p>
              
              <div className="space-y-3">
                {['TODOS', 'CONFIRMADOS', 'PENDENTES', 'RECUSADOS'].map((statusOpt) => (
                  <div key={statusOpt} className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-700">{statusOpt}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPrintPreview(statusOpt)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Eye size={13} /> Visualizar
                      </button>
                      <button
                        onClick={() => exportExcelFile(statusOpt)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <FileSpreadsheet size={13} /> Excel (.xlsx)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="w-full bg-gray-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold mt-2">Fechar</button>
            </div>
          </div>
        )}

        {/* Modal de Pré-Visualização para Impressão */}
        {printPreviewData && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm">{printPreviewTitle}</h3>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <Printer size={14} /> Imprimir / Salvar PDF
                  </button>
                  <button onClick={() => setPrintPreviewData(null)} className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold">Fechar</button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 bg-white text-slate-800">
                <div className="text-center border-b pb-4">
                  <h2 className="text-lg font-bold">Aniversário 15 Anos • Rebeca Guerra</h2>
                  <p className="text-xs text-slate-500">{printPreviewTitle} — Gerado em {new Date().toLocaleDateString()}</p>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b">
                      <th className="p-2.5 font-bold">Nome</th>
                      <th className="p-2.5 font-bold">Categoria</th>
                      <th className="p-2.5 font-bold">Tipo</th>
                      <th className="p-2.5 font-bold">Grupo Familiar</th>
                      <th className="p-2.5 font-bold">WhatsApp</th>
                      <th className="p-2.5 font-bold">Status</th>
                      <th className="p-2.5 font-bold">Observação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {printPreviewData.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium">{g.name}</td>
                        <td className="p-2.5">{(g.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto'}</td>
                        <td className="p-2.5">{g.categoria_convite || 'REGULARES'}</td>
                        <td className="p-2.5">{g.family_group || '—'}</td>
                        <td className="p-2.5">{g.phone}</td>
                        <td className="p-2.5 uppercase font-bold text-[11px]">{g.attendance_status || (g.confirmed ? 'confirmado' : 'pendente')}</td>
                        <td className="p-2.5">{g.observacao || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição Individual */}
        {editingGuest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Editar Convidado</h2>
              <form onSubmit={saveEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                  <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Categoria</label>
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                      <option value="adulto">Adulto</option>
                      <option value="crianca">Criança (&lt;10 anos)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Convite</label>
                    <select value={editCategoriaConvite} onChange={(e) => setEditCategoriaConvite(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                      <option value="REGULARES">REGULARES</option>
                      <option value="POSSIBILIDADE">POSSIBILIDADE</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Observação</label>
                  <select value={editObservacao} onChange={(e) => setEditObservacao(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                    {observacaoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-pink-600 text-white py-2.5 rounded-lg font-medium text-sm">Salvar</button>
                  <button type="button" onClick={() => setEditingGuest(null)} className="flex-1 bg-gray-100 py-2.5 rounded-lg font-medium text-sm">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edição de Grupo Familiar Inteiro */}
        {editingFamilyGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-slate-800">Editar Grupo Familiar: {editingFamilyGroup}</h2>
              <form onSubmit={saveFamilyGroupEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Família / Grupo</label>
                  <input type="text" value={editFamilyGroupName} onChange={(e) => setEditFamilyGroupName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp do Responsável</label>
                  <input type="tel" value={editFamilyGroupPhone} onChange={(e) => setEditFamilyGroupPhone(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Convite (Geral)</label>
                  <select value={editFamilyGroupCategoria} onChange={(e) => setEditFamilyGroupCategoria(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                    <option value="REGULARES">REGULARES</option>
                    <option value="POSSIBILIDADE">POSSIBILIDADE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Observação do Grupo</label>
                  <select value={editFamilyGroupObs} onChange={(e) => setEditFamilyGroupObs(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                    {observacaoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-pink-600 text-white py-2.5 rounded-lg font-medium text-sm">Salvar Alterações</button>
                  <button type="button" onClick={() => setEditingFamilyGroup(null)} className="flex-1 bg-gray-100 py-2.5 rounded-lg font-medium text-sm">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Abas de Cadastro com Observação (Select) e Categoria */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex gap-4 mb-6 border-b pb-4">
            <button onClick={() => setTab('individual')} className={`px-5 py-2.5 rounded-lg font-medium text-sm ${tab === 'individual' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-slate-600'}`}>Cadastrar Individual</button>
            <button onClick={() => setTab('family')} className={`px-5 py-2.5 rounded-lg font-medium text-sm ${tab === 'family' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-slate-600'}`}>Cadastrar Família</button>
          </div>

          {tab === 'individual' && (
            <form onSubmit={addIndividual} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} className="border rounded-lg p-3 text-sm" required />
                <input type="tel" placeholder="WhatsApp" value={phone} onChange={(e) => setPhone(e.target.value)} className="border rounded-lg p-3 text-sm" required />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-lg p-3 text-sm bg-white">
                  <option value="adulto">Adulto</option>
                  <option value="crianca">Criança (&lt;10 anos)</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={categoriaConvite} onChange={(e) => setCategoriaConvite(e.target.value)} className="border rounded-lg p-3 text-sm bg-white">
                  <option value="REGULARES">REGULARES</option>
                  <option value="POSSIBILIDADE">POSSIBILIDADE</option>
                </select>
                <select value={observacao} onChange={(e) => setObservacao(e.target.value)} className="border rounded-lg p-3 text-sm bg-white">
                  {observacaoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium text-sm">Adicionar Convidado</button>
            </form>
          )}

          {tab === 'family' && (
            <form onSubmit={addFamily} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Sobrenome da Família" value={familyName} onChange={(e) => setFamilyName(e.target.value)} className="border rounded-lg p-3 text-sm" required />
                <input type="tel" placeholder="WhatsApp do Responsável" value={familyPhone} onChange={(e) => setFamilyPhone(e.target.value)} className="border rounded-lg p-3 text-sm" required />
                <input type="number" min="0" max="15" value={familySizeInput} onChange={handleFamilySizeChange} placeholder="Qtd Membros" className="border rounded-lg p-3 text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={familyCategoriaConvite} onChange={(e) => setFamilyCategoriaConvite(e.target.value)} className="border rounded-lg p-3 text-sm bg-white">
                  <option value="REGULARES">REGULARES</option>
                  <option value="POSSIBILIDADE">POSSIBILIDADE</option>
                </select>
                <select value={familyObservacao} onChange={(e) => setFamilyObservacao(e.target.value)} className="border rounded-lg p-3 text-sm bg-white">
                  {observacaoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
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
              <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-lg font-medium text-sm">Cadastrar Família</button>
            </form>
          )}
        </div>

        {/* Tabela de Convidados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="w-full overflow-x-hidden">
            <table className="w-full text-left border-collapse table-auto">
              <thead className="bg-slate-50 border-b text-slate-600 text-[11px]">
                <tr>
                  <th className="p-2.5 font-medium">Convidado / Família</th>
                  <th className="p-2.5 font-medium">Categoria</th>
                  <th className="p-2.5 font-medium">Tipo</th>
                  <th className="p-2.5 font-medium">WhatsApp</th>
                  <th className="p-2.5 font-medium">Status</th>
                  <th className="p-2.5 font-medium">Observação</th>
                  <th className="p-2.5 font-medium">QR Code</th>
                  <th className="p-2.5 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {loading ? (
                  <tr><td colSpan="8" className="p-8 text-center text-gray-500">A carregar...</td></tr>
                ) : (
                  <>
                    {/* 1. FAMÍLIAS REGULARES */}
                    {regularFamilies.map(groupKey => {
                      const members = familyGroupsMap[groupKey];
                      const isExpanded = expandedFamilies[groupKey];
                      const confirmedCount = members.filter(m => {
                        const st = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                        return st.toLowerCase() === 'confirmado';
                      }).length;
                      const tipoConvite = members[0]?.categoria_convite || 'REGULARES';
                      return (
                        <Fragment key={groupKey}>
                          <tr className="bg-pink-50/30 border-t-2 border-pink-100">
                            <td className="p-2.5 font-bold text-slate-800" colSpan="2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button onClick={() => toggleExpandFamily(groupKey)} className="text-pink-600 bg-white p-1 rounded-md border">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
                                <span className="truncate">Família {groupKey}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded-full">{members.length} membros</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">{tipoConvite}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 truncate" colSpan="2">Resp: {members[0]?.phone}</td>
                            <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">{confirmedCount}/{members.length} Conf.</span></td>
                            <td className="p-2.5 text-[11px] text-slate-500 truncate" colSpan="1">{members[0]?.observacao || '—'}</td>
                            <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap" colSpan="2">
                              <button onClick={() => startEditingFamilyGroup(groupKey, members)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[11px] font-bold">Editar</button>
                              <button onClick={() => sendWhatsApp(members[0], members, false)} className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><Send size={11} className="inline mr-1"/> Convite</button>
                              <button onClick={() => deleteFamilyGroup(groupKey)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                          {isExpanded && members.map(m => {
                            const memberSt = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                            const formattedCategory = (m.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                            return (
                              <tr key={m.id} className="bg-white border-l-4 border-l-pink-400">
                                <td className="p-2.5 pl-6 text-slate-700 font-medium truncate" colSpan="2">{m.name}</td>
                                <td className="p-2.5"><span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">{formattedCategory}</span></td>
                                <td className="p-2.5 text-[11px] text-slate-500 truncate">{m.phone}</td>
                                <td className="p-2.5">{renderStatusBadge(memberSt, true)}</td>
                                <td className="p-2.5 text-[11px] text-slate-500 truncate">{m.observacao || '—'}</td>
                                <td className="p-2.5"><div className="w-8 h-8 bg-white p-0.5 border rounded"><QRCodeSVG value={m.qr_code} size={64} style={{ width: '100%', height: '100%' }} /></div></td>
                                <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                                  {memberSt.toLowerCase() === 'confirmado' && (
                                    <button onClick={() => sendWhatsApp(m, null, true)} className="p-1 bg-purple-600 text-white rounded"><QrCode size={13}/></button>
                                  )}
                                  <button onClick={() => startEditing(m)} className="p-1 text-blue-400"><Edit3 size={13}/></button>
                                  <button onClick={() => deleteGuest(m.id)} className="p-1 text-red-400"><Trash2 size={13}/></button>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}

                    {/* 2. FAMÍLIAS POSSIBILIDADE */}
                    {possibilityFamilies.map(groupKey => {
                      const members = familyGroupsMap[groupKey];
                      const isExpanded = expandedFamilies[groupKey];
                      const confirmedCount = members.filter(m => {
                        const st = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                        return st.toLowerCase() === 'confirmado';
                      }).length;
                      const tipoConvite = members[0]?.categoria_convite || 'POSSIBILIDADE';
                      return (
                        <Fragment key={groupKey}>
                          <tr className="bg-amber-50/30 border-t-2 border-amber-100">
                            <td className="p-2.5 font-bold text-slate-800" colSpan="2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button onClick={() => toggleExpandFamily(groupKey)} className="text-amber-600 bg-white p-1 rounded-md border">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
                                <span className="truncate">Família {groupKey}</span>
                                <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full">{members.length} membros</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">{tipoConvite}</span>
                              </div>
                            </td>
                            <td className="p-2.5 text-[11px] text-slate-600 truncate" colSpan="2">Resp: {members[0]?.phone}</td>
                            <td className="p-2.5"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">{confirmedCount}/{members.length} Conf.</span></td>
                            <td className="p-2.5 text-[11px] text-slate-500 truncate" colSpan="1">{members[0]?.observacao || '—'}</td>
                            <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap" colSpan="2">
                              <button onClick={() => startEditingFamilyGroup(groupKey, members)} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[11px] font-bold">Editar</button>
                              <button onClick={() => sendWhatsApp(members[0], members, false)} className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><Send size={11} className="inline mr-1"/> Convite</button>
                              <button onClick={() => deleteFamilyGroup(groupKey)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                          {isExpanded && members.map(m => {
                            const memberSt = m.attendance_status || (m.confirmed ? 'confirmado' : 'pendente');
                            const formattedCategory = (m.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                            return (
                              <tr key={m.id} className="bg-white border-l-4 border-l-amber-400">
                                <td className="p-2.5 pl-6 text-slate-700 font-medium truncate" colSpan="2">{m.name}</td>
                                <td className="p-2.5"><span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">{formattedCategory}</span></td>
                                <td className="p-2.5 text-[11px] text-slate-500 truncate">{m.phone}</td>
                                <td className="p-2.5">{renderStatusBadge(memberSt, true)}</td>
                                <td className="p-2.5 text-[11px] text-slate-500 truncate">{m.observacao || '—'}</td>
                                <td className="p-2.5"><div className="w-8 h-8 bg-white p-0.5 border rounded"><QRCodeSVG value={m.qr_code} size={64} style={{ width: '100%', height: '100%' }} /></div></td>
                                <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                                  {memberSt.toLowerCase() === 'confirmado' && (
                                    <button onClick={() => sendWhatsApp(m, null, true)} className="p-1 bg-purple-600 text-white rounded"><QrCode size={13}/></button>
                                  )}
                                  <button onClick={() => startEditing(m)} className="p-1 text-blue-400"><Edit3 size={13}/></button>
                                  <button onClick={() => deleteGuest(m.id)} className="p-1 text-red-400"><Trash2 size={13}/></button>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}

                    {/* 3. INDIVIDUAL REGULARES */}
                    {regularIndividuals.map((guest) => {
                      const st = guest.attendance_status || (guest.confirmed ? 'confirmado' : 'pendente');
                      const formattedCategory = (guest.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                      const tipoConvite = guest.categoria_convite || 'REGULARES';
                      return (
                        <tr key={guest.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800 truncate">{guest.name}</td>
                          <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${guest.category === 'crianca' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100'}`}>{formattedCategory}</span></td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{tipoConvite}</span></td>
                          <td className="p-2.5 text-slate-600 text-[11px] truncate">{guest.phone}</td>
                          <td className="p-2.5">{renderStatusBadge(st)}</td>
                          <td className="p-2.5 text-[11px] text-slate-500 truncate">{guest.observacao || '—'}</td>
                          <td className="p-2.5"><div className="w-8 h-8 bg-white p-0.5 border rounded-md"><QRCodeSVG value={guest.qr_code} size={64} style={{ width: '100%', height: '100%' }} /></div></td>
                          <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                            {st.toLowerCase() === 'confirmado' ? (
                              <button onClick={() => sendWhatsApp(guest, null, true)} className="bg-purple-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><QrCode size={11} className="inline mr-1"/> QR</button>
                            ) : (
                              <button onClick={() => sendWhatsApp(guest, null, false)} className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><Send size={11} className="inline mr-1"/> Convite</button>
                            )}
                            <button onClick={() => startEditing(guest)} className="p-1 text-blue-400 hover:text-blue-600"><Edit3 size={14} /></button>
                            <button onClick={() => deleteGuest(guest.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* 4. INDIVIDUAL POSSIBILIDADE */}
                    {possibilityIndividuals.map((guest) => {
                      const st = guest.attendance_status || (guest.confirmed ? 'confirmado' : 'pendente');
                      const formattedCategory = (guest.category || '').toLowerCase() === 'crianca' ? 'Criança' : 'Adulto';
                      const tipoConvite = guest.categoria_convite || 'POSSIBILIDADE';
                      return (
                        <tr key={guest.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-800 truncate">{guest.name}</td>
                          <td className="p-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${guest.category === 'crianca' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100'}`}>{formattedCategory}</span></td>
                          <td className="p-2.5"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">{tipoConvite}</span></td>
                          <td className="p-2.5 text-slate-600 text-[11px] truncate">{guest.phone}</td>
                          <td className="p-2.5">{renderStatusBadge(st)}</td>
                          <td className="p-2.5 text-[11px] text-slate-500 truncate">{guest.observacao || '—'}</td>
                          <td className="p-2.5"><div className="w-8 h-8 bg-white p-0.5 border rounded-md"><QRCodeSVG value={guest.qr_code} size={64} style={{ width: '100%', height: '100%' }} /></div></td>
                          <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                            {st.toLowerCase() === 'confirmado' ? (
                              <button onClick={() => sendWhatsApp(guest, null, true)} className="bg-purple-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><QrCode size={11} className="inline mr-1"/> QR</button>
                            ) : (
                              <button onClick={() => sendWhatsApp(guest, null, false)} className="bg-emerald-600 text-white px-2 py-1 rounded-md text-[11px] font-medium"><Send size={11} className="inline mr-1"/> Convite</button>
                            )}
                            <button onClick={() => startEditing(guest)} className="p-1 text-blue-400 hover:text-blue-600"><Edit3 size={14} /></button>
                            <button onClick={() => deleteGuest(guest.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}