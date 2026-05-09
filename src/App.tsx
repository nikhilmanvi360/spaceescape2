import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Dashboard } from './components/Dashboard';
import { Result } from './components/Result';
import { AdminDashboard } from './components/AdminDashboard';
import { TeamLogin } from './components/TeamLogin';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { TeamAuthManager, TeamUser } from './lib/teamAuth';

type GameState = 'home' | 'playing' | 'finished' | 'admin';
const STORAGE_KEY = 'mission_override_state';
const STORAGE_KEY_AUTH_METHOD = 'auth_method'; // 'firebase' or 'team'

export default function App() {
  const [gameState, setGameState] = useState<GameState>('home');
  const [finalData, setFinalData] = useState<{ score: number; timeTaken: number; success: boolean; hintsUsed: number } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [showTeamLogin, setShowTeamLogin] = useState(false);
  const [authMethod, setAuthMethod] = useState<'firebase' | 'team' | null>(null);

  // Check for stored team user on mount
  useEffect(() => {
    const stored = TeamAuthManager.getStoredTeamUser();
    if (stored) {
      setTeamUser(stored);
      setAuthMethod('team');
      setUserRole('user');
      setLoading(false);
    }
  }, []);

  // Auth listener with error handling
  useEffect(() => {
    if (teamUser) return; // Skip Firebase if team user is logged in

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setFirebaseError(null);
        setUser(firebaseUser);
        if (firebaseUser) {
          setAuthMethod('firebase');
          // Check/Create user profile in Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const isDefaultAdmin = firebaseUser.email === 'nikhilmanvi360@gmail.com';
            const role = isDefaultAdmin ? 'admin' : 'user';
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: role,
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, userData);
            setUserRole(role);
          } else {
            const data = userSnap.data();
            const isDefaultAdmin = firebaseUser.email === 'nikhilmanvi360@gmail.com';
            if (isDefaultAdmin && data.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
              setUserRole('admin');
            } else {
              setUserRole(data.role);
            }
          }
        } else {
          setUserRole(null);
        }
      } catch (error) {
        // Firebase error detected - show team login fallback
        const errorMsg = error instanceof Error ? error.message : 'Firebase connection error';
        console.error('Firebase error:', errorMsg);
        setFirebaseError(errorMsg);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [teamUser]);

  // Check for existing game on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (user || teamUser)) {
      setGameState('playing');
    }
  }, [user, teamUser]);

  const handleStart = () => {
    if (!user && !teamUser) return;
    setGameState('playing');
  };

  const handleComplete = async (score: number, timeTaken: number, success: boolean, hintsUsed: number) => {
    setFinalData({ score, timeTaken, success, hintsUsed });
    setGameState('finished');
    localStorage.removeItem(STORAGE_KEY);

    // Save to Firestore (Firebase) or localStorage (Team)
    if (user) {
      try {
        await addDoc(collection(db, 'scores'), {
          userId: user.uid,
          userName: user.displayName || 'Unknown Pilot',
          score,
          timeTaken,
          success,
          hintsUsed,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Failed to save score to Firebase:", error);
        // Fallback to localStorage
        saveScoreLocally(teamUser?.teamName || user?.displayName || 'Unknown', score, timeTaken, success, hintsUsed);
      }
    } else if (teamUser) {
      saveScoreLocally(teamUser.displayName, score, timeTaken, success, hintsUsed);
    }
  };

  const saveScoreLocally = (playerName: string, score: number, timeTaken: number, success: boolean, hintsUsed: number) => {
    const scores = JSON.parse(localStorage.getItem('local_scores') || '[]');
    scores.push({
      playerName,
      score,
      timeTaken,
      success,
      hintsUsed,
      timestamp: Date.now()
    });
    localStorage.setItem('local_scores', JSON.stringify(scores));
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

  const handleTeamLoginSuccess = (teamUser: TeamUser) => {
    setTeamUser(teamUser);
    setAuthMethod('team');
    setUserRole('user');
    setShowTeamLogin(false);
  };

  const handleLogout = async () => {
    if (authMethod === 'team') {
      TeamAuthManager.logoutTeam();
      setTeamUser(null);
      setUser(null);
      setAuthMethod(null);
    } else if (authMethod === 'firebase') {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-mono text-primary font-bold gap-4">
        <div className="animate-pulse tracking-[0.2em] uppercase">Booting Engineering Mainframe...</div>
        {firebaseError && (
          <div className="text-xs text-orange-400 text-center max-w-sm">
            [ALERT] Firebase unavailable. Team authentication fallback available.
          </div>
        )}
      </div>
    );
  }

  const currentUser = user || teamUser;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* CRT Effects Overlay */}
      <div className="crt-overlay" />
      <div className="scanline" />
      <div className="crt-vignette" />
      <div className="noise-bg" />

      {/* Firebase Error Banner */}
      {firebaseError && (
        <div className="fixed top-0 left-0 right-0 bg-orange-900/30 border-b border-orange-500/50 text-orange-300 text-xs p-2 text-center z-40">
          ⚠️ Firebase connection lost. Operating in fallback mode.
        </div>
      )}

      {/* Team Login Modal */}
      <TeamLogin isOpen={showTeamLogin} onLoginSuccess={handleTeamLoginSuccess} />

      <main className="relative z-10">
        {gameState === 'home' && (
          <Home
            onStart={handleStart}
            onOpenAdmin={handleOpenAdmin}
            user={currentUser}
            userRole={userRole}
            firebaseError={firebaseError}
            onShowTeamLogin={() => setShowTeamLogin(true)}
            onLogout={handleLogout}
            authMethod={authMethod}
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
