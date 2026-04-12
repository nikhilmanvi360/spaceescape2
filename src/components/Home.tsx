import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rocket, ShieldAlert, Terminal, LogIn, LogOut, ShieldCheck, Trophy, Clock, User as UserIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

interface ScoreRecord {
  id: string;
  userName: string;
  score: number;
  timeTaken: number;
  timestamp: Timestamp;
}

interface HomeProps {
  onStart: () => void;
  onOpenAdmin: () => void;
  user: User | null;
  userRole: 'admin' | 'user' | null;
}

export const Home: React.FC<HomeProps> = ({ onStart, onOpenAdmin, user, userRole }) => {
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const records: ScoreRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as ScoreRecord);
      });
      setLeaderboard(records);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 relative overflow-x-hidden">
      {/* Auth Bar */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4 bg-black/40 border border-primary/20 p-2 rounded-sm backdrop-blur-sm">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-primary font-mono uppercase tracking-widest">{user.displayName}</div>
              <div className="text-[8px] text-muted-foreground font-mono uppercase flex items-center justify-end gap-1">
                {userRole === 'admin' && <ShieldCheck className="w-2 h-2 text-accent" />}
                {userRole || 'Authenticating...'}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleLogin} className="tech-button h-10 px-6 text-xs font-bold uppercase tracking-widest">
            <LogIn className="w-4 h-4 mr-2" />
            Establish Neural Link
          </Button>
        )}
      </div>
      {/* Background elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1] 
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <Rocket className="w-20 h-20 text-primary animate-pulse" />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
          </div>
        </div>

        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-4 neon-text text-primary italic font-heading">
          MISSION OVERRIDE
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-4 font-mono uppercase tracking-[0.3em] opacity-80">
          Space Escape Protocol: <span className="text-destructive animate-flicker">Active</span>
        </p>
        <div className="flex items-center justify-center gap-6 mb-16 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
          <span className="px-3 py-1 bg-primary/5 border border-primary/20 rounded-sm">Duration: 4 Hours</span>
          <span className="px-3 py-1 bg-accent/5 border border-accent/20 rounded-sm">Status: Persistent</span>
          <span className="px-3 py-1 bg-destructive/5 border border-destructive/20 rounded-sm">Difficulty: Extreme</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <div className="tech-card p-8 flex flex-col items-center group hover:border-accent/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Terminal className="w-6 h-6 text-accent" />
            </div>
            <h3 className="font-bold mb-2 tracking-widest text-accent uppercase">BOOT SEQUENCE</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed">Initialize core logic & pattern recognition systems.</p>
          </div>
          <div className="tech-card p-8 flex flex-col items-center group hover:border-destructive/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="font-bold mb-2 tracking-widest text-destructive uppercase">SYSTEM FAILURE</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed">Debug critical flow errors & restore life support.</p>
          </div>
          <div className="tech-card p-8 flex flex-col items-center group hover:border-primary/40 transition-colors">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2 tracking-widest text-primary uppercase">FINAL OVERRIDE</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight leading-relaxed">Combine decrypted clues for total core stabilization.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-16 p-8 bg-primary/5 border border-primary/10 rounded-sm backdrop-blur-sm text-left">
          <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Mission Briefing
          </h3>
          <div className="space-y-4 text-[11px] text-muted-foreground uppercase tracking-widest leading-loose font-mono">
            <p>1. You are the lead engineer aboard the <span className="text-primary">Aegis-7</span>. A catastrophic system failure has locked out all manual controls.</p>
            <p>2. Your objective is to bypass the security protocols by solving a series of logic and code-based puzzles.</p>
            <p>3. Each successful override restores a critical system: <span className="text-blue-400">Navigation</span>, <span className="text-green-400">Oxygen</span>, and <span className="text-cyan-400">Fuel</span>.</p>
            <p>4. You have <span className="text-destructive">4 hours</span> before core meltdown. Failure is not an option.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button 
            size="lg" 
            onClick={onStart}
            disabled={!user}
            className={`tech-button h-20 px-16 text-2xl font-black uppercase tracking-[0.4em] text-primary-foreground ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {user ? 'Initiate Mission' : 'Login Required'}
          </Button>
          
          {!user && (
            <p className="text-[10px] text-destructive font-mono uppercase tracking-widest animate-pulse">
              Authentication Required to Access Command Deck
            </p>
          )}

          {/* Leaderboard Section */}
          <div className="mt-16 w-full max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-primary/20" />
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> Hall of Fame
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={fetchLeaderboard}
                  disabled={loadingLeaderboard}
                  className="h-6 w-6 text-primary/40 hover:text-primary"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex-1 h-px bg-primary/20" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {loadingLeaderboard ? (
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest animate-pulse py-4">Retrieving Top Pilots...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest py-4">No Mission Records Yet</div>
              ) : (
                leaderboard.map((record, idx) => (
                  <motion.div 
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-sm group hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-primary/40 w-4">#{idx + 1}</span>
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{record.userName}</span>
                        <span className="text-[8px] text-muted-foreground uppercase tracking-tighter">Pilot ID: {record.id.substring(0, 8)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Score</span>
                        <span className="text-xs font-bold text-accent">{record.score}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Time</span>
                        <span className="text-xs font-bold text-primary">{Math.floor(record.timeTaken / 60)}:{(record.timeTaken % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {userRole === 'admin' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-12 p-6 border-2 border-accent/50 bg-accent/10 rounded-sm backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.2)] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-accent animate-pulse" />
              <div className="flex items-center justify-between gap-8">
                <div className="flex items-center gap-4 text-accent">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black uppercase tracking-[0.3em] text-accent neon-text">Command Deck Access</span>
                    <span className="block text-[10px] text-accent/60 uppercase tracking-widest font-mono">Root Privileges Authenticated</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={onOpenAdmin}
                    className="tech-button border-accent/40 text-accent hover:bg-accent/20 h-12 px-8 text-[10px] font-bold uppercase tracking-[0.2em]"
                  >
                    Enter Command Center
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-8 text-left font-mono text-[10px] text-muted-foreground opacity-50 uppercase tracking-tighter">
        <p>System: AIS-OS v4.2.0</p>
        <p>User: {new Date().toISOString()}</p>
        <p>Status: Awaiting Input...</p>
      </div>
    </div>
  );
};
