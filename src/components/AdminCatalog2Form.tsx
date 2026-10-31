import React, { useState, useEffect } from 'react';
import { Settings, FormQuestion } from '../types';
import { 
  DEFAULT_CATALOG2_FORM_TITLE, 
  DEFAULT_CATALOG2_FORM_INTRO, 
  DEFAULT_CATALOG2_FORM_QUESTIONS 
} from '../data/defaultCateringForm';
import { 
  FileText, Plus, Trash2, Edit2, Save, ArrowUp, ArrowDown, 
  CheckCircle2, AlertCircle, RefreshCw, X, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { cleanFirestoreData } from '../lib/utils';

interface AdminCatalog2FormProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onSave?: () => Promise<void>;
}

export default function AdminCatalog2Form({ settings, setSettings }: AdminCatalog2FormProps) {
  const [formTitle, setFormTitle] = useState(settings.catalog2FormTitle || DEFAULT_CATALOG2_FORM_TITLE);
  const [formIntro, setFormIntro] = useState(settings.catalog2FormIntro || DEFAULT_CATALOG2_FORM_INTRO);
  const [questions, setQuestions] = useState<FormQuestion[]>(
    settings.catalog2FormQuestions && settings.catalog2FormQuestions.length > 0 
      ? settings.catalog2FormQuestions 
      : DEFAULT_CATALOG2_FORM_QUESTIONS
  );

  // New or Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'textarea' | 'select' | 'radio'>('text');
  const [questionOptions, setQuestionOptions] = useState('');
  const [questionRequired, setQuestionRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync if settings change externally
  useEffect(() => {
    if (settings.catalog2FormTitle !== undefined) {
      setFormTitle(settings.catalog2FormTitle || DEFAULT_CATALOG2_FORM_TITLE);
    }
    if (settings.catalog2FormIntro !== undefined) {
      setFormIntro(settings.catalog2FormIntro || DEFAULT_CATALOG2_FORM_INTRO);
    }
    if (settings.catalog2FormQuestions && settings.catalog2FormQuestions.length > 0) {
      setQuestions(settings.catalog2FormQuestions);
    }
  }, [settings.catalog2FormTitle, settings.catalog2FormIntro, settings.catalog2FormQuestions]);

  const handleStartEdit = (q: FormQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.title);
    setQuestionType(q.type);
    setQuestionOptions(q.options ? q.options.join(', ') : '');
    setQuestionRequired(!!q.required);
    // Smooth scroll down to form
    const elem = document.getElementById('question-builder-card');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setQuestionType('text');
    setQuestionOptions('');
    setQuestionRequired(false);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error('Informe o texto da pergunta.');
      return;
    }

    const optionsArray = (questionType === 'select' || questionType === 'radio')
      ? questionOptions
          .split(',')
          .map(opt => opt.trim())
          .filter(Boolean)
      : undefined;

    if ((questionType === 'select' || questionType === 'radio') && (!optionsArray || optionsArray.length === 0)) {
      toast.error('Para perguntas de Seleção ou Múltipla Escolha, insira pelo menos uma opção separada por vírgula.');
      return;
    }

    if (editingQuestionId) {
      // Update existing
      setQuestions(prev => prev.map(q => {
        if (q.id === editingQuestionId) {
          return {
            ...q,
            title: questionText.trim(),
            type: questionType,
            options: optionsArray,
            required: questionRequired
          };
        }
        return q;
      }));
      toast.success('Pergunta atualizada na lista!');
    } else {
      // Add new
      const newQ: FormQuestion = {
        id: 'q_' + Date.now(),
        title: questionText.trim(),
        type: questionType,
        options: optionsArray,
        required: questionRequired
      };
      setQuestions(prev => [...prev, newQ]);
      toast.success('Pergunta adicionada à lista!');
    }

    handleCancelEdit();
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      if (editingQuestionId === id) {
        handleCancelEdit();
      }
      toast.success('Pergunta removida!');
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setQuestions(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetToDefault = () => {
    if (confirm('Deseja restaurar as perguntas e textos padrão das imagens do Catálogo 2?')) {
      setFormTitle(DEFAULT_CATALOG2_FORM_TITLE);
      setFormIntro(DEFAULT_CATALOG2_FORM_INTRO);
      setQuestions(DEFAULT_CATALOG2_FORM_QUESTIONS);
      handleCancelEdit();
      toast.info('Valores padrão restaurados. Clique em Salvar Formulário para gravar.');
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedSettings: Settings = {
        ...settings,
        catalog2FormTitle: formTitle.trim() || DEFAULT_CATALOG2_FORM_TITLE,
        catalog2FormIntro: formIntro.trim() || DEFAULT_CATALOG2_FORM_INTRO,
        catalog2FormQuestions: questions
      };

      await setDoc(doc(db, 'configuracoes', 'geral'), cleanFirestoreData(updatedSettings), { merge: true });
      setSettings(updatedSettings);
      toast.success('Formulário do Catálogo 2 salvo com sucesso e refletido no cardápio!');
    } catch (err) {
      console.error('Erro ao salvar formulário:', err);
      toast.error('Erro ao salvar formulário no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Formulário de Perguntas de Eventos (Catering)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Aqui você pode criar e gerenciar as perguntas que aparecem para seus clientes na aba de Solicitação de Orçamento (Catálogo 2).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
            title="Restaurar modelo original"
          >
            <RefreshCw size={14} /> Padrão
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: settings.primaryColor || '#865d39' }}
          >
            <Save size={16} />
            {isSaving ? 'Salvando...' : 'Salvar Formulário'}
          </button>
        </div>
      </div>

      {/* Card 1: TÍTULO DO FORMULÁRIO */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200/80 space-y-2">
        <label className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-gray-500">
          TÍTULO DO FORMULÁRIO (PADRÃO: REQUEST EVENT QUOTE)
        </label>
        <input 
          type="text"
          value={formTitle}
          onChange={e => setFormTitle(e.target.value)}
          placeholder="Sua personal chef"
          className="w-full p-3 rounded-xl border border-gray-300 text-sm sm:text-base font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-stone-500 outline-none transition-all shadow-sm"
        />
        <p className="text-[11px] text-gray-400">
          Este título aparecerá em destaque no cabeçalho do formulário de eventos.
        </p>
      </div>

      {/* Card 2: TEXTO DE INTRODUÇÃO */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-200/80 space-y-2">
        <label className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-gray-500">
          TEXTO DE INTRODUÇÃO (EXIBIDO NO TOPO DO FORMULÁRIO DE EVENTOS)
        </label>
        <textarea 
          rows={7}
          value={formIntro}
          onChange={e => setFormIntro(e.target.value)}
          placeholder="Meu nome é Alice Aquino e o meu propósito é levar mais praticidade..."
          className="w-full p-3 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-800 bg-white focus:ring-2 focus:ring-stone-500 outline-none leading-relaxed transition-all shadow-sm"
        />
        <p className="text-[11px] text-gray-400">
          Este texto aparecerá no topo do formulário de orçamento de eventos no cardápio. Você pode usar quebras de linha e emojis livremente.
        </p>
      </div>

      {/* Card 3: Lista de Perguntas Existentes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Perguntas Cadastradas ({questions.length})
          </h3>
          <span className="text-[11px] text-gray-400">
            Arraste ou use as setas para reordenar
          </span>
        </div>

        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-dashed border-gray-300">
            Nenhuma pergunta adicionada ainda. Use o formulário abaixo para adicionar perguntas.
          </div>
        ) : (
          questions.map((q, idx) => (
            <div 
              key={q.id}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border transition-all ${
                editingQuestionId === q.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-grow">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-900 text-white text-[11px] font-black">
                      Q{idx + 1}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                      {q.type.toUpperCase()}
                    </span>
                    {q.required && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                        OBRIGATÓRIO
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">
                    {q.title}
                  </h4>
                  {q.options && q.options.length > 0 && (
                    <p className="text-xs text-gray-500 font-medium">
                      <span className="font-semibold text-gray-600">Opções:</span> {q.options.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                      title="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 cursor-pointer"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(q)}
                    className="text-xs font-bold uppercase text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-1"
                  >
                    EDITAR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-xs font-bold uppercase text-red-600 hover:text-red-800 transition-colors cursor-pointer px-1"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Card 4: Construtor de Nova Pergunta / Edição */}
      <div 
        id="question-builder-card"
        className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border-2 border-stone-800/20 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-900">
            {editingQuestionId ? 'EDITAR PERGUNTA DO FORMULÁRIO' : 'NOVA PERGUNTA DO FORMULÁRIO'}
          </h4>
          {editingQuestionId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-semibold"
            >
              <X size={14} /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                TEXTO DA PERGUNTA
              </label>
              <input 
                type="text"
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                placeholder="Ex: Qual o tipo de buffet desejado?"
                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm bg-white font-medium text-gray-900 focus:ring-2 focus:ring-stone-600 outline-none shadow-sm"
              />
            </div>

            <div className="space-y-1 sm:col-span-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                TIPO DA PERGUNTA
              </label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm bg-white font-medium text-gray-900 focus:ring-2 focus:ring-stone-600 outline-none shadow-sm"
              >
                <option value="text">Texto Simples (Input)</option>
                <option value="textarea">Área de Texto (Textarea)</option>
                <option value="select">Seleção Única (Dropdown / Select)</option>
                <option value="radio">Múltipla Escolha / Opções (Radio)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              OPÇÕES (SEPARADAS POR VÍRGULA - PARA DROPDOWN/RADIO/CHECKBOX)
            </label>
            <input 
              type="text"
              value={questionOptions}
              onChange={e => setQuestionOptions(e.target.value)}
              disabled={questionType === 'text' || questionType === 'textarea'}
              placeholder="Ex: Opção A, Opção B, Opção C"
              className={`w-full p-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:ring-stone-600 outline-none shadow-sm ${
                questionType === 'text' || questionType === 'textarea'
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
            <p className="text-[10px] text-gray-400">
              Necessário apenas para perguntas do tipo Seleção Única (Select) ou Opções (Radio).
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="req-checkbox"
              checked={questionRequired}
              onChange={e => setQuestionRequired(e.target.checked)}
              className="w-4 h-4 rounded text-stone-800 focus:ring-stone-600 cursor-pointer"
            />
            <label htmlFor="req-checkbox" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
              Resposta Obrigatória?
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold shadow transition-all cursor-pointer"
            >
              {editingQuestionId ? 'Salvar Alterações da Pergunta' : '+ Adicionar Pergunta'}
            </button>
            {editingQuestionId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs sm:text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Floating Save Button at bottom */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-6 py-3 rounded-full font-bold text-sm text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          style={{ backgroundColor: settings.primaryColor || '#865d39' }}
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Formulário'}
        </button>
      </div>
    </div>
  );
}
