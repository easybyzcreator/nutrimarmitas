import React, { useState } from 'react';
import { Settings, DeliveryNeighborhood } from '../types';
import { MapPin, Plus, Trash2, Edit2, Check, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cleanFirestoreData } from '../lib/utils';

interface AdminDeliveryNeighborhoodsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onSave?: () => Promise<void>;
}

export default function AdminDeliveryNeighborhoods({
  settings,
  setSettings,
  onSave
}: AdminDeliveryNeighborhoodsProps) {
  const [name, setName] = useState('');
  const [feeInput, setFeeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editFee, setEditFee] = useState('');

  const neighborhoods = settings.deliveryNeighborhoods || [];

  const handleAddNeighborhood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do bairro.');
      return;
    }

    const cleanFee = feeInput.replace(',', '.').trim();
    const parsedFee = cleanFee ? parseFloat(cleanFee) : 0;

    if (isNaN(parsedFee) || parsedFee < 0) {
      toast.error('Informe um valor de taxa válido (Ex: 5,00 ou 0 para grátis).');
      return;
    }

    const newNeighborhood: DeliveryNeighborhood = {
      id: Date.now().toString(),
      name: name.trim(),
      fee: Math.round(parsedFee * 100) / 100
    };

    const updated = [...neighborhoods, newNeighborhood];
    setSettings(prev => ({
      ...prev,
      deliveryNeighborhoods: updated
    }));

    setName('');
    setFeeInput('');
    toast.success(`Bairro "${newNeighborhood.name}" adicionado! Clique em Salvar para gravar.`);
  };

  const startEdit = (item: DeliveryNeighborhood) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditFee(item.fee.toString().replace('.', ','));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditFee('');
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) {
      toast.error('O nome do bairro não pode ficar vazio.');
      return;
    }

    const cleanFee = editFee.replace(',', '.').trim();
    const parsedFee = cleanFee ? parseFloat(cleanFee) : 0;

    if (isNaN(parsedFee) || parsedFee < 0) {
      toast.error('Informe um valor de taxa válido.');
      return;
    }

    const updated = neighborhoods.map(n => {
      if (n.id === id) {
        return {
          ...n,
          name: editName.trim(),
          fee: Math.round(parsedFee * 100) / 100
        };
      }
      return n;
    });

    setSettings(prev => ({
      ...prev,
      deliveryNeighborhoods: updated
    }));

    setEditingId(null);
    toast.success('Bairro atualizado!');
  };

  const handleDelete = (id: string, nName: string) => {
    const updated = neighborhoods.filter(n => n.id !== id);
    setSettings(prev => ({
      ...prev,
      deliveryNeighborhoods: updated
    }));
    toast.info(`Bairro "${nName}" removido.`);
  };

  const handlePersistChanges = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave();
      } else {
        const cleaned = cleanFirestoreData({
          ...settings,
          deliveryNeighborhoods: neighborhoods
        });
        await setDoc(doc(db, 'settings', 'general'), cleaned, { merge: true });
      }
      toast.success('Taxas de entrega salvas com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar bairros:', err);
      toast.error('Erro ao salvar configurações de bairros.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-stone-300 bg-stone-50/70 space-y-3 shadow-sm">
      {/* Header enxuto e discreto */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-stone-700" />
          <h5 className="text-xs font-bold uppercase tracking-wide text-stone-900">
            Bairros/Localizações e Taxas de Entrega
          </h5>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700">
            {neighborhoods.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handlePersistChanges}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Save size={13} />
          <span>{isSaving ? 'Salvando...' : 'Salvar Bairros/Localizações'}</span>
        </button>
      </div>

      <p className="text-[11px] text-stone-600">
        Cadastre os bairros/localizações que você atende e o valor da taxa. O cliente seleciona o bairro/localização no carrinho para somar ao total.
      </p>

      {/* Formulário horizontal enxuto */}
      <form onSubmit={handleAddNeighborhood} className="flex flex-col sm:flex-row gap-2 items-center">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Bairro / Localização (ex: Centro, Setor Bueno, etc.)"
          className="w-full sm:flex-1 p-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-900 font-medium outline-none focus:border-stone-500"
        />

        <div className="w-full sm:w-32 relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-stone-400 select-none">
            R$
          </span>
          <input
            type="text"
            value={feeInput}
            onChange={e => setFeeInput(e.target.value)}
            placeholder="0,00"
            className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-900 font-bold outline-none focus:border-stone-500"
          />
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Plus size={14} />
          <span>+ Adicionar</span>
        </button>
      </form>

      {/* Lista de bairros cadastrados */}
      {neighborhoods.length === 0 ? (
        <div className="p-3 text-center text-stone-500 text-[11px] bg-white rounded-lg border border-dashed border-stone-300">
          Nenhum bairro/localização cadastrado. Digite o nome e taxa acima e clique em &quot;+ Adicionar&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-56 overflow-y-auto">
          {neighborhoods.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-lg border border-stone-200 bg-white shadow-xs flex items-center justify-between gap-2"
            >
              {editingId === item.id ? (
                <div className="flex items-center gap-1.5 w-full">
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 p-1 rounded border border-stone-300 text-xs text-stone-900 font-medium"
                  />
                  <input
                    type="text"
                    value={editFee}
                    onChange={e => setEditFee(e.target.value)}
                    className="w-16 p-1 rounded border border-stone-300 text-xs text-stone-900 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(item.id)}
                    className="p-1 rounded bg-green-600 text-white hover:bg-green-700"
                    title="Confirmar"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                    title="Cancelar"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-[10px] font-bold text-amber-900">
                      {Number(item.fee) > 0 ? `Taxa: R$ ${Number(item.fee).toFixed(2).replace('.', ',')}` : 'Entrega Grátis'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="p-1 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100"
                      title="Editar"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
