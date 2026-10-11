"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, Trash2, Edit3, Key, ArrowLeft, Shield } from 'lucide-react';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados Edição
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('portaria');

  useEffect(() => {
    const session = localStorage.getItem('currentUser');
    if (!session) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(session);
    setCurrentUser(parsed);
    if (parsed.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setUsers(data || []);
    setLoading(false);
  };

  const approveUser = async (id, currentStatus) => {
    const newStatus = currentStatus === 'aprovado' ? 'pendente' : 'aprovado';
    const { error } = await supabase
      .from('system_users')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    } else {
      alert('Erro ao atualizar status do utilizador.');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este utilizador?')) return;
    const { error } = await supabase.from('system_users').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter(u => u.id !== id));
    } else {
      alert('Erro ao excluir utilizador.');
    }
  };

  const startEditing = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const { error } = await supabase
      .from('system_users')
      .update({ name: editName, role: editRole })
      .eq('id', editingUser.id);

    if (!error) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, name: editName, role: editRole } : u));
      setEditingUser(null);
    } else {
      alert('Erro ao atualizar dados.');
    }
  };

  const sendNewPasswordWhatsApp = (user) => {
    const newPass = Math.random().toString(36).slice(-6); // Gera senha aleatória de 6 chars
    const cleanPhone = user.phone.replace(/\D/g, '');

    // Atualiza na base de dados
    supabase.from('system_users').update({ password: newPass }).eq('id', user.id).then(({ error }) => {
      if (!error) {
        const msg = encodeURIComponent(`Olá ${user.name}! A sua nova palavra-passe de acesso ao sistema do Aniversário 15 Anos Rebeca Guerra é: *${newPass}*`);
        window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
      } else {
        alert('Erro ao gerar nova senha.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Gestão de Utilizadores do Sistema</h1>
              <p className="text-xs text-slate-500">Aprove novos registos, edite acessos e envie credenciais</p>
            </div>
          </div>
          {currentUser && (
            <div className="text-right text-xs">
              <p className="font-semibold text-slate-800">{currentUser.name}</p>
              <span className="text-pink-600 uppercase font-bold">{currentUser.role}</span>
            </div>
          )}
        </div>

        {/* Tabela de Utilizadores */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">Telemóvel / Login</th>
                <th className="p-4">Perfil</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">A carregar utilizadores...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{u.name}</td>
                  <td className="p-4 text-slate-600">{u.phone}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${u.role === 'admin' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => approveUser(u.id, u.status)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition-all ${u.status === 'aprovado' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                    >
                      <CheckCircle size={12} />
                      {u.status === 'aprovado' ? 'Aprovado' : 'Pendente (Aprovar)'}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button onClick={() => sendNewPasswordWhatsApp(u)} className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors inline-block" title="Enviar Nova Senha por WhatsApp">
                      <Key size={16} />
                    </button>
                    <button onClick={() => startEditing(u)} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors inline-block" title="Editar Utilizador">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors inline-block" title="Excluir Utilizador">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de Edição */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-sm w-full p-6 rounded-3xl shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-800">Editar Utilizador</h2>
              <form onSubmit={saveEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Perfil</label>
                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm bg-white">
                    <option value="admin">Administrador</option>
                    <option value="portaria">Portaria</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-xl text-xs">Salvar</button>
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 rounded-xl text-xs">Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}