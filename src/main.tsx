import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider} from "@tanstack/react-router";
import { router } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import "./index.css";
import './i18n';

import { CurrencyProvider } from "./context/CurrencyContext";
import axiosInstance from "./api/axiosInstance";

// Uygulama açılırken CSRF token'ı backend'den al
// Bu token backend tarafından cookie'ye yazılacak,
// axiosInstance interceptor'ı da onu okuyacak
axiosInstance.get('/Auth/csrf-token').catch(() => {
  // sessizce hata yut, kritik değil
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 *60, // 1 dakika veri 'fresh' kalır.
      retry: 1, // Hatalarda 1 kez daha dener.
    },
},
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AuthProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  </StrictMode>
);
