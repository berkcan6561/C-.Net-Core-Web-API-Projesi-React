import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

interface User{
    userId: number;
    customerId?: number;
    fullName: string;
    role: string;
    avatarUrl?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); //zamanlayıcı
    const IDLE_TIMEOUT = 15* 60 * 1000; //boşta kalma süresi 15 dk

    useEffect(() => {
        const savedToken = sessionStorage.getItem('token');
        const savedUser = sessionStorage.getItem('user');
        
        if(savedToken && savedUser){
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    useEffect(() => {
        if(!token) return;
        // eğer giriş yapılmamışsa sayaç çalıştırma
        const resetTimeout = () => {
            if (timeoutRef.current){
                clearTimeout(timeoutRef.current);
            }
            //süre dolduğunda çıkış yap
            timeoutRef.current = setTimeout(() =>{
                console.log("Uzun süre işlem yapılmadığı için otomatik çıkış yapıldı.");
                logout();
                
            },IDLE_TIMEOUT);
        };
        const events = ['mousemove', 'keydown','click','scroll'];
        events.forEach(event => {
            window.addEventListener(event, resetTimeout);
        });
        resetTimeout(); // sayfaya girer girmez sayaç başlıyor

        //temizlik: compenent unmount olduğunda eventleri kaldır
        return () =>{
            if ( timeoutRef.current){
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimeout);
            });
        };
    },[token]);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(newUser));
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        sessionStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        // çıkış yapıldıktan sonra giriş sayfasına yönlendirme
        window.location.href = '/login'
    };
    return(
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            updateUser,
            isAuthenticated: !!token,
            isAdmin: user?.role === 'Admin',
        }}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};