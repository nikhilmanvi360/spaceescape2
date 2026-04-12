import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Result } from './components/Result';
import { AdminDashboard } from './components/AdminDashboard';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

type GameState = 'home' | 'playing' | 'finished' | 'admin';
const STORAGE_KEY = 'mission_override_state';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [finalData, setFinalData] = useState<{ score: number; timeTaken: number; success: boolean; hintsUsed: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    // ==== MOCKED LOGIN FOR LOCAL DEV ====
    const handleMockLogin = () => {
      setUser({ uid: 'mock-123', email: 'local@pilot.com', displayName: 'Local Pilot' } as User);
      setUserRole('admin'); 
    };
    const handleMockLogout = () => {
      setUser(null);
      setUserRole(null);
    };
    
    window.addEventListener('mock-login', handleMockLogin);
    window.addEventListener('mock-logout', handleMockLogout);
    
    // Set initial loading to false
    setLoading(false);

    return () => {
      window.removeEventListener('mock-login', handleMockLogin);
      window.removeEventListener('mock-logout', handleMockLogout);
    };
  }, []);

  // Check for existing game on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && user) {
      setGameState('playing');
    }
  }, [user]);

  const handleStart = () => {
    if (!user) return;
    setGameState('playing');
  };

  const handleComplete = async (score: number, timeTaken: number, success: boolean, hintsUsed: number) => {
    setFinalData({ score, timeTaken, success, hintsUsed });
    setGameState('finished');
    localStorage.removeItem(STORAGE_KEY);

    // Save to Firestore (MOCKED)
    console.log("Mock saved score to Firestore:", { score, timeTaken, success, hintsUsed });
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState('home');
    setFinalData(null);
  };

  const handleOpenAdmin = () => {
    if (userRole === 'admin') {
      setGameState('admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-mono text-primary">
        <div className="animate-pulse tracking-[0.5em] uppercase">Initializing Neural Link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* CRT Effects Overlay */}
      <div className="crt-overlay" />
      <div className="scanline" />
      
      <main className="relative z-10">
        {gameState === 'home' && (
          <Home 
            onStart={handleStart} 
            onOpenAdmin={handleOpenAdmin}
            user={user} 
            userRole={userRole} 
          />
        )}
        {gameState === 'playing' && (
          <Dashboard 
            onComplete={handleComplete} 
            onExit={() => setGameState('home')}
            onOpenAdmin={handleOpenAdmin}
            userRole={userRole}
          />
        )}
        {gameState === 'admin' && <AdminDashboard onBack={() => setGameState('home')} />}
        {gameState === 'finished' && finalData && (
          <Result 
            score={finalData.score} 
            timeTaken={finalData.timeTaken} 
            success={finalData.success} 
            hintsUsed={finalData.hintsUsed}
            onRestart={handleRestart} 
          />
        )}
      </main>
    </div>
  );
}
