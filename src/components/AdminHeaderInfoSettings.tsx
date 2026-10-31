import React from 'react';
import { Settings } from '../types';
import { Sparkles, Calendar, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

interface AdminHeaderInfoSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

export const DEFAULT_CONSULTATION_URL = 'https://dietstudio.com.br/agendar/tF7HkRcs6XOy-TuE5FRmvA';
export const DEFAULT_CONSULTATION_BUTTON_NAME = 'Agendar consulta com a nutri';

export default function AdminHeaderInfoSettings({
  settings,
  setSettings
}: AdminHeaderInfoSettingsProps) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-200/80 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div 
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: `${settings.primaryColor || '#865d39'}15`, color: settings.primaryColor || '#865d39' }}
        >
          <Sparkles size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Texto no Topo & Botão de Agendamento
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
            Configure o texto de apresentação institucional no topo do cardápio e o botão de redirecionamento direto para agendamento de consultas ou serviços.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Toggle Cardápio 1 */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stone-900">Exibir no Cardápio Principal (Produtos)</p>
            <p className="text-[11px] text-stone-500">Mostra este texto e botão logo no topo da lista de marmitas</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.headerInfoShowInCatalog1 !== false}
              onChange={e => setSettings(prev => ({ ...prev, headerInfoShowInCatalog1: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
          </label>
        </div>

        {/* Toggle Cardápio 2 */}
        <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stone-900">Exibir Botão no Cardápio 2 (Ficha/Nutri)</p>
            <p className="text-[11px] text-stone-500">Insere o botão de agendamento no final do texto da chef</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.headerInfoShowInCatalog2 !== false}
              onChange={e => setSettings(prev => ({ ...prev, headerInfoShowInCatalog2: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
          </label>
        </div>
      </div>

      <div className="space-y-4 pt-1">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-700">
            Título da Apresentação (Topo)
          </label>
          <input
            type="text"
            value={settings.headerInfoTitle || ''}
            onChange={e => setSettings(prev => ({ ...prev, headerInfoTitle: e.target.value }))}
            placeholder="Ex: Sua personal nutri"
            className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 outline-none font-bold"
            style={{ '--tw-ring-color': settings.primaryColor } as any}
          />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase text-stone-700">
            Texto de Apresentação no Topo
          </label>
          <textarea
            rows={5}
            value={settings.headerInfoText || ''}
            onChange={e => setSettings(prev => ({ ...prev, headerInfoText: e.target.value }))}
            placeholder="Digite o texto de apresentação que aparecerá no topo do cardápio..."
            className="w-full p-3.5 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 outline-none font-normal leading-relaxed"
            style={{ '--tw-ring-color': settings.primaryColor } as any}
          />
          <p className="text-[11px] text-stone-500">
            Dica: você pode pular linhas para organizar parágrafos bem espaçados.
          </p>
        </div>

        {/* Button Fields */}
        <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4">
          <div className="flex items-center gap-2 text-amber-900">
            <Calendar size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Configuração do Botão com Link de Agendamento
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase text-stone-700">
                Nome do Botão
              </label>
              <input
                type="text"
                value={settings.consultationButtonText || ''}
                onChange={e => setSettings(prev => ({ ...prev, consultationButtonText: e.target.value }))}
                placeholder={DEFAULT_CONSULTATION_BUTTON_NAME}
                className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 outline-none font-semibold"
                style={{ '--tw-ring-color': settings.primaryColor } as any}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase text-stone-700">
                Link de Destino do Botão (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={settings.consultationButtonUrl || ''}
                  onChange={e => setSettings(prev => ({ ...prev, consultationButtonUrl: e.target.value }))}
                  placeholder={DEFAULT_CONSULTATION_URL}
                  className="w-full p-3 pr-10 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:ring-2 outline-none font-medium text-blue-700"
                  style={{ '--tw-ring-color': settings.primaryColor } as any}
                />
                <ExternalLink size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Test Link Button */}
          <div className="flex items-center justify-between pt-1">
            <a
              href={settings.consultationButtonUrl || DEFAULT_CONSULTATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 underline cursor-pointer"
            >
              <span>Testar link de agendamento em nova aba</span>
              <ExternalLink size={13} />
            </a>

            <button
              type="button"
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  consultationButtonText: DEFAULT_CONSULTATION_BUTTON_NAME,
                  consultationButtonUrl: DEFAULT_CONSULTATION_URL
                }));
              }}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 transition-colors"
            >
              Restaurar padrão DietStudio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
