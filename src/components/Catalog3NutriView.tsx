import React from 'react';
import { Settings, Product, Category } from '../types';
import { Calendar, ExternalLink, ArrowLeft, Sparkles, CheckCircle2, UserCheck, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface Catalog3NutriViewProps {
  settings: Settings;
  onBack: () => void;
  products?: Product[];
  categories?: Category[];
  onSelectProduct?: (product: Product) => void;
  currencySymbol?: string;
}

export default function Catalog3NutriView({
  settings,
  onBack,
  products = [],
  categories = [],
  onSelectProduct,
  currencySymbol = 'R$'
}: Catalog3NutriViewProps) {
  // Title priority: what user typed in admin headerInfoTitle or catalog3Title
  const title = settings.headerInfoTitle || settings.catalog3Title || 'Atendimento com a Nutri';
  
  // Text description priority: what user typed in admin headerInfoText or catalog3Desc or catalog3Slogan
  const text = settings.headerInfoText || settings.catalog3Desc || settings.catalog3Slogan || '';

  // Button config directed to WhatsApp +55 11 94393-6946
  const defaultWhatsAppUrl = 'https://wa.me/5511943936946?text=' + encodeURIComponent('Olá! Gostaria de agendar uma consulta nutricional.');
  const buttonText = settings.consultationButtonText || 'Agendar consulta com a nutri';
  const buttonUrl = (settings.consultationButtonUrl && !settings.consultationButtonUrl.includes('dietstudio.com.br'))
    ? settings.consultationButtonUrl
    : defaultWhatsAppUrl;

  const image = settings.catalog3Image || settings.logo || 'https://i.ibb.co/cKDSMnnW/egnn.png';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-32 flex flex-col items-center">
      {/* Back to Catalogs Button */}
      <div className="w-full flex items-center justify-start mb-6">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-normal text-stone-800 transition-all shadow-sm cursor-pointer hover:shadow hover:scale-[1.02] active:scale-[0.98] bg-[#ded8ca]/90 hover:bg-[#ded8ca] backdrop-blur-md border border-stone-800/10"
        >
          <ArrowLeft size={16} />
          <span>Voltar aos Cardápios</span>
        </button>
      </div>

      {/* Hero / Photo */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 relative"
      >
        <div 
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white p-1.5 shadow-2xl overflow-hidden flex items-center justify-center border-4"
          style={{ borderColor: settings.primaryColor || '#865d39' }}
        >
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.div>

      {/* Main Presentation Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-[2.5rem] bg-white/60 backdrop-blur-md border border-white/60 shadow-xl p-6 sm:p-8 space-y-6 text-stone-900"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-100/90 text-stone-800 mb-1 border border-stone-200">
            <Sparkles size={14} style={{ color: settings.primaryColor || '#865d39' }} />
            <span>Atendimento Nutricional Personalizado</span>
          </div>
          <h1 
            className="text-2xl sm:text-4xl font-serif font-black tracking-tight"
            style={{ color: settings.primaryColor || '#865d39' }}
          >
            {title}
          </h1>
        </div>

        {/* Presentation Text */}
        {text ? (
          <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-stone-800/95 font-medium space-y-3 px-1 sm:px-3 text-center sm:text-left bg-stone-50/50 p-5 rounded-2xl border border-stone-200/50">
            {text}
          </div>
        ) : (
          <div className="text-center text-sm text-stone-600 italic py-2">
            Acompanhamento nutricional completo e personalizado para o seu objetivo de saúde e bem-estar.
          </div>
        )}

        {/* Primary Action Button: Agendar Consulta via WhatsApp */}
        <div className="pt-2 flex flex-col items-stretch sm:items-center justify-center gap-3">
          <a
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base sm:text-lg font-extrabold shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer text-white text-center group"
            style={{
              backgroundColor: settings.primaryColor || '#865d39'
            }}
          >
            <Calendar size={22} className="group-hover:rotate-6 transition-transform" />
            <span>{buttonText}</span>
            <ExternalLink size={18} className="opacity-90" />
          </a>
          
          <p className="text-xs text-center text-stone-500 font-medium">
            Clique no botão acima para agendar seu horário pelo WhatsApp.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
