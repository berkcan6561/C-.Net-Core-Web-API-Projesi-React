import i18n  from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

//Json dosyalarını içeri alıyor
import translationTR from './locales/tr.json';
import translationEN from './locales/en.json';
import translationDE from './locales/de.json';

//Dilleri i18next'in anlayacağı bir formata çevirme
const resources = {
    tr: { translation: translationTR.translation},
    en: { translation: translationEN.translation},
    de: { translation: translationDE.translation}
};

i18n
    .use(LanguageDetector) //kullanıcının tarayıcı girişinde hangi dil varsa otomarik değiştirir
    .use(initReactI18next) //React ile bağlantı
    .init({
        resources,
        fallbackLng: 'en', //Eğer kullanıcının tarayıcı dili desteklemediğimiz bir dilse otomatil ingilizce olsun
        interpolation: {
            escapeValue: false 
        }
    });

export default i18n;