import React, { useState } from 'react';
import { Settings, FormQuestion } from '../types';
import { 
  DEFAULT_CATALOG2_FORM_TITLE, 
  DEFAULT_CATALOG2_FORM_INTRO, 
  DEFAULT_CATALOG2_FORM_QUESTIONS 
} from '../data/defaultCateringForm';
import { MessageSquare, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

interface Catalog2FormViewProps {
  settings: Settings;
  onBack: () => void;
}

export default function Catalog2FormView({ settings, onBack }: Catalog2FormViewProps) {
  const renderTitle = (title: string) => {
    if (title && title.toLowerCase() === 'escola de gastronomia e negócios') {
      return (
        <>
          Escola de gastronomia<br />e negócios
        </>
      );
    }
    return title;
  };

  const formTitle = settings.catalog2FormTitle || DEFAULT_CATALOG2_FORM_TITLE;
  const formIntro = settings.catalog2FormIntro || DEFAULT_CATALOG2_FORM_INTRO;
  const questions: FormQuestion[] = (settings.catalog2FormQuestions && settings.catalog2FormQuestions.length > 0)
    ? settings.catalog2FormQuestions
    : DEFAULT_CATALOG2_FORM_QUESTIONS;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRadioSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate client info
    if (!clientName.trim()) {
      toast.error('Por favor, informe seu nome completo.');
      return;
    }
    if (!clientPhone.trim()) {
      toast.error('Por favor, informe seu WhatsApp para retorno.');
      return;
    }

    // Validate required questions
    for (const q of questions) {
      if (q.required) {
        const val = answers[q.id];
        if (!val || !val.trim()) {
          toast.error(`Por favor, responda à pergunta obrigatória: "${q.title}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Build clean WhatsApp message
      const titleCatalog = settings.catalog2Title || 'Personal Chef';
      let message = `🍽️ *SOLICITAÇÃO DE ORÇAMENTO - ${titleCatalog.toUpperCase()}*\n`;
      message += `-----------------------------------------\n`;
      message += `👤 *Nome:* ${clientName.trim()}\n`;
      message += `📱 *WhatsApp:* ${clientPhone.trim()}\n\n`;
      message += `📋 *RESPOSTAS DO FORMULÁRIO:*\n`;

      questions.forEach((q, idx) => {
        const answer = answers[q.id] || 'Não informado';
        message += `\n*${idx + 1}. ${q.title}*\n👉 ${answer}\n`;
      });

      message += `\n-----------------------------------------\n`;
      message += `Enviado através do cardápio digital *${settings.brandName || 'Easy Menu'}*`;

      // Save inquiry to Firebase
      try {
        await addDoc(collection(db, 'pedidos'), {
          customerName: clientName.trim(),
          phone: clientPhone.trim(),
          address: answers['q4'] || '',
          observation: `Solicitação de Orçamento: ${titleCatalog}\n` + 
            questions.map(q => `${q.title}: ${answers[q.id] || '-'}`).join('\n'),
          total: 0,
          catalog: 'catalog2',
          items: [{
            title: `Orçamento ${titleCatalog}: ${clientName.trim()}`,
            quantity: 1,
            price: 0,
            notes: questions.map(q => `${q.title}: ${answers[q.id] || '-'}`).join(' | ')
          }],
          createdAt: serverTimestamp(),
          paymentStatus: 'pending'
        });
      } catch (fbErr) {
        console.warn('Could not save inquiry to firestore, proceeding with WhatsApp:', fbErr);
      }

      // Open WhatsApp
      const rawPhone = (settings.whatsappNumber || '').replace(/\D/g, '');
      const fullPhone = rawPhone.startsWith('55') ? rawPhone : (rawPhone ? `55${rawPhone}` : '');
      const encodedMsg = encodeURIComponent(message);
      const whatsappUrl = fullPhone 
        ? `https://wa.me/${fullPhone}?text=${encodedMsg}`
        : `https://api.whatsapp.com/send?text=${encodedMsg}`;

      window.open(whatsappUrl, '_blank');
      setSubmitted(true);
      toast.success('Solicitação preparada! Abrindo WhatsApp...');
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      toast.error('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Return button */}
      {settings.selectorEnabled !== false && (
        <div className="w-full flex items-center justify-center mb-4 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-normal text-black transition-all shadow-sm cursor-pointer hover:shadow hover:scale-[1.02] active:scale-[0.98] bg-[#ded8ca]/90 hover:bg-[#ded8ca] backdrop-blur-md border border-black/10"
          >
            <span>← Voltar aos Cardápios</span>
          </button>
        </div>
      )}

      {/* Profile Avatar */}
      <div className="mt-2 mb-4 relative">
        <div 
          className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white p-1 shadow-2xl overflow-hidden flex items-center justify-center border-2"
          style={{ borderColor: settings.primaryColor || '#865d39' }}
        >
          <img 
            src={settings.catalog2Image || settings.logo || 'https://i.ibb.co/68XwD57/meals.png'} 
            alt="Logo" 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Catalog Title */}
      <h1 
        className={cn(
          "text-3xl sm:text-4xl font-serif font-black text-center tracking-tight",
          settings.catalog2Slogan ? "mb-6" : "mb-10 sm:mb-12"
        )}
        style={{ color: settings.primaryColor || '#865d39' }}
      >
        {renderTitle(settings.catalog2Title || settings.introTitle || settings.brandName || 'NutriMarmitas')}
      </h1>

      {/* Catalog Slogan Pill */}
      {settings.catalog2Slogan && (
        <div className="mb-10 sm:mb-12 px-6 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/40 shadow-sm text-center">
          <p className="text-xs sm:text-sm font-sans font-semibold text-stone-800">
            {settings.catalog2Slogan}
          </p>
        </div>
      )}

      {/* Main Glassmorphic Form Card */}
      <div className="w-full rounded-[2.5rem] bg-white/40 backdrop-blur-md border border-white/40 shadow-xl p-6 sm:p-10 space-y-6 text-stone-900">
        
        {/* Form Header */}
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📋</span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            {formTitle}
          </h2>
        </div>

        {/* Intro Text */}
        {formIntro && (
          <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-stone-800/90 font-medium space-y-3">
            {formIntro}
          </div>
        )}

        <hr className="border-stone-800/20 my-6" />

        {/* Form Questions */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700/95">
                {q.title} {q.required && <span className="text-red-600">*</span>}
              </label>

              {/* Type: SELECT */}
              {q.type === 'select' && (
                <div className="relative">
                  <select
                    value={answers[q.id] || ''}
                    onChange={e => handleTextChange(q.id, e.target.value)}
                    required={q.required}
                    className="w-full p-3.5 rounded-2xl bg-white/50 border border-white/60 text-stone-900 font-medium focus:bg-white/80 focus:ring-2 focus:ring-stone-600 outline-none backdrop-blur-sm shadow-sm transition-all cursor-pointer"
                  >
                    <option value="">Selecione uma opção...</option>
                    {q.options?.map(opt => (
                      <option key={opt} value={opt} className="text-black bg-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type: RADIO (Grid 2x2 style) */}
              {q.type === 'radio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {q.options?.map(opt => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <div
                        key={opt}
                        onClick={() => handleRadioSelect(q.id, opt)}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all backdrop-blur-sm ${
                          isSelected
                            ? 'bg-stone-900/15 border-stone-800 shadow-sm'
                            : 'bg-white/30 border-white/50 hover:bg-white/50'
                        }`}
                      >
                        <span className="text-xs sm:text-sm font-bold text-stone-900">
                          {opt}
                        </span>
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            isSelected 
                              ? 'border-stone-900 bg-stone-900' 
                              : 'border-stone-400 bg-white/60'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Type: TEXT */}
              {q.type === 'text' && (
                <input
                  type="text"
                  placeholder="Digite aqui..."
                  value={answers[q.id] || ''}
                  onChange={e => handleTextChange(q.id, e.target.value)}
                  required={q.required}
                  className="w-full p-3.5 rounded-2xl bg-white/50 border border-white/60 text-stone-900 font-medium placeholder:text-stone-500/70 focus:bg-white/80 focus:ring-2 focus:ring-stone-600 outline-none backdrop-blur-sm shadow-sm transition-all"
                />
              )}

              {/* Type: TEXTAREA */}
              {q.type === 'textarea' && (
                <textarea
                  rows={3}
                  placeholder="Forneça mais detalhes ou observações..."
                  value={answers[q.id] || ''}
                  onChange={e => handleTextChange(q.id, e.target.value)}
                  required={q.required}
                  className="w-full p-3.5 rounded-2xl bg-white/50 border border-white/60 text-stone-900 font-medium placeholder:text-stone-500/70 focus:bg-white/80 focus:ring-2 focus:ring-stone-600 outline-none backdrop-blur-sm shadow-sm transition-all leading-relaxed"
                />
              )}
            </div>
          ))}

          <hr className="border-stone-800/20 my-6" />

          {/* Client Contact Details */}
          <div className="space-y-4">
            <h3 className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-stone-700/90">
              Seus Dados para Retorno do Orçamento
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-stone-700">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-2xl bg-white/50 border border-white/60 text-stone-900 font-medium placeholder:text-stone-500/70 focus:bg-white/80 focus:ring-2 focus:ring-stone-600 outline-none backdrop-blur-sm shadow-sm transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-stone-700">
                  Seu WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  placeholder="(DDD) 99999-9999"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  required
                  className="w-full p-3.5 rounded-2xl bg-white/50 border border-white/60 text-stone-900 font-medium placeholder:text-stone-500/70 focus:bg-white/80 focus:ring-2 focus:ring-stone-600 outline-none backdrop-blur-sm shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl font-bold text-base text-white shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: settings.primaryColor || '#2d4f1e' }}
            >
              <MessageSquare size={20} />
              <span>{isSubmitting ? 'Preparando...' : 'Enviar Solicitação via WhatsApp'}</span>
            </button>

            <p className="text-center text-xs text-stone-600 font-medium">
              Sua solicitação será enviada diretamente para o nosso WhatsApp com todas as suas respostas preenchidas.
            </p>
          </div>
        </form>

        {submitted && (
          <div className="p-4 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 size={24} className="shrink-0 text-emerald-700" />
            <div className="text-xs sm:text-sm font-semibold">
              Sua solicitação foi preparada! Se a conversa do WhatsApp não abriu automaticamente, clique no botão acima novamente.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
