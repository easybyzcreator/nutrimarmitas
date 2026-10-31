import React, { useState, useEffect } from 'react';
import Menu from './components/Menu';
import Admin from './components/Admin';
import Footer from './components/Footer';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Settings } from './types';
import { Toaster } from 'sonner';
import { ensureDefaultCatalogSeeded } from './lib/catalogInit';
import { DEFAULT_CATALOG2_FORM_TITLE, DEFAULT_CATALOG2_FORM_INTRO, DEFAULT_CATALOG2_FORM_QUESTIONS } from './data/defaultCateringForm';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    logo: 'https://i.ibb.co/cKDSMnnW/egnn.png',
    primaryColor: '#865d39',
    whatsappNumber: '',
    whatsappCountryCode: '+55',
    slug: 'nutrimarmitas',
    brandName: 'NutriMarmitas',
    slogan: 'Alimentação saudável e consciente.',
    whatsappClosingMessage: 'Obrigada pelo interesse, aguarde que entraremos em contato para confirmação!',
    backgroundImage: 'https://i.ibb.co/X0vYy7L/cakes.png',
    glassColor: 'rgba(255, 255, 255, 0.4)',
    textColor: '#000000',
    language: 'pt',
    currency: 'BRL',
    introEnabled: true,
    introTitle: 'NutriMarmitas',
    introSubtitle: 'Comer bem é o primeiro passo para uma vida saudável.',
    introDescription: 'Se você quer mais leveza, mais saúde e mais qualidade de vida... comece pelo básico bem feito: sua alimentação.',
    introButtonText: 'ACESSAR NOSSO CARDÁPIO',
    introBottomText: 'ALIMENTO • CORPO • ALMA',
    selectorEnabled: true,
    selectorTitle: 'NutriMarmitas',
    selectorSubtitle: 'Escolha seu cardápio',
    catalog1Title: 'Marmitas Fit',
    catalog1Image: 'https://i.ibb.co/TBH5Ctp2/Gemini-Generated-Image-jq7rrvjq7rrvjq7r.jpg',
    catalog1Desc: 'Ingredientes frescos e selecionados para o seu dia a dia.',
    catalog1Slogan: 'Faça seu pedido até 12h para entrega no mesmo dia\nMarmitas ultracongeladas de alta qualidade',
    catalog1Active: true,
    catalog2Title: 'Marmitas Tradicionais',
    catalog2Image: 'https://i.ibb.co/68XwD57/meals.png',
    catalog2Desc: 'Sabor caseiro e qualidade para sua rotina diária.',
    catalog2Slogan: 'Pratos com tempero caseiro especial\nProntas em 5 minutos no micro-ondas',
    catalog2Active: true,
    catalog2FormTitle: DEFAULT_CATALOG2_FORM_TITLE,
    catalog2FormIntro: DEFAULT_CATALOG2_FORM_INTRO,
    catalog2FormQuestions: DEFAULT_CATALOG2_FORM_QUESTIONS,
    catalog3Title: 'Cardápio Especial',
    catalog3Image: 'https://i.ibb.co/cKDSMnnW/egnn.png',
    catalog3Desc: 'Práticas e prontas em apenas 5 minutos no micro-ondas.',
    catalog3Slogan: 'Kits promocionais e combos para a sua semana',
    catalog3Active: true,
    catalog4Title: 'Dietas Hipertróficas',
    catalog4Image: 'https://i.ibb.co/X0vYy7L/cakes.png',
    catalog4Desc: 'Refeições com alto teor calórico saudável e ricas em proteínas para ganho de massa.',
    catalog4Slogan: 'Combustível de alta qualidade para o seu treino',
    catalog4Active: false,
    storageInstructionsImage: 'https://i.ibb.co/svKxrfsF/Gemini-Generated-Image-6nqnq66nqnq66nqn.jpg'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for admin path
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
      setIsAdmin(true);
    }

    // Ensure initial default catalog is safely seeded in Firebase
    ensureDefaultCatalogSeeded();

    // Load settings for global styles
    const unsub = onSnapshot(doc(db, 'configuracoes', 'geral'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Settings;
        if (!data.whatsappCountryCode || data.whatsappCountryCode !== '+55') {
          data.whatsappCountryCode = '+55';
        }
        setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);

        // Update Page Title
        if (data.brandName) {
          document.title = data.brandName;
        }

        // Update Theme Color
        const themeColorMeta = document.getElementById('theme-color');
        if (themeColorMeta) {
          themeColorMeta.setAttribute('content', data.primaryColor || '#865d39');
        }

        // Set Glass Color CSS Variable
        const glassColor = data.glassColor || 'rgba(255, 255, 255, 0.4)';
        const finalGlassColor = (glassColor.startsWith('#') && glassColor.length === 7) 
          ? `${glassColor}66` 
          : glassColor;
        document.documentElement.style.setProperty('--glass-color', finalGlassColor);

        // Set Text Color CSS Variable
        if (data.textColor) {
          document.documentElement.style.setProperty('--text-color', data.textColor);
        }
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error('App: Erro ao carregar configurações:', error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const glassColor = settings?.glassColor || 'rgba(255, 255, 255, 0.4)';
  const finalGlassColor = (glassColor.startsWith('#') && glassColor.length === 7) 
    ? `${glassColor}66` 
    : glassColor;

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#ece6db]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#865d39] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#865d39] font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <Toaster position="top-center" richColors />
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url("${settings?.backgroundImage || 'https://i.ibb.co/X0vYy7L/cakes.png'}")` }}
      />
      
      {/* Glass Overlay */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none" 
        style={{ 
          backgroundColor: finalGlassColor,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      />

      {/* Content */}
      <div className="relative z-0 flex flex-col min-h-screen">
        {isAdmin ? (
          <Admin settings={settings} setSettings={setSettings} setIsAdmin={setIsAdmin} />
        ) : (
          <>
            <Menu settings={{ ...settings, language: 'pt', currency: 'BRL' }} />
            <Footer />
          </>
        )}
      </div>
    </div>
  );
}
