import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'TRY' | 'USD' | 'EUR';

interface Rates {
  [key: string]: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (curr: Currency) => void;
  formatPrice: (priceInTry: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [rates, setRates] = useState<Rates>({ TRY: 1, USD: 0.03, EUR: 0.028 });

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/TRY')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch(err => console.error("Kurlar çekilirken hata oluştu:", err));
  }, []);

  const formatPrice = (priceInTry: number) => {
    const rate = rates[currency] || 1;
    const converted = priceInTry * rate;
    
    const symbols: Record<Currency, string> = {
      TRY: '₺',
      USD: '$',
      EUR: '€'
    };

    return new Intl.NumberFormat('tr-TR', {
      maximumFractionDigits: 0,
    }).format(converted) + ' ' + symbols[currency];
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};