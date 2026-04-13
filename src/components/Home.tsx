import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, ShieldCheck, Trophy, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// Custom SVGs to match the reference exactly
const LogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 20 C65 20, 80 35, 80 55 C80 75, 65 90, 50 90 C35 90, 20 75, 20 55 C20 35, 35 20, 50 20 Z M50 30 C40 30, 30 40, 30 55 C30 70, 40 80, 50 80 C60 80, 70 70, 70 55 C70 40, 60 30, 50 30 Z" />
    <path d="M45 10 C55 10, 65 20, 65 35 L55 35 C55 25, 50 20, 45 20 Z" transform="rotate(-30 50 50)" />
    <path d="M55 10 C45 10, 35 20, 35 35 L45 35 C45 25, 50 20, 55 20 Z" transform="rotate(30 50 50)" />
  </svg>
);

const DiagnosticsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <path d="M7 8l5 5-5 5M13 18h4" />
  </svg>
);

const RecalibrationIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
    <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21a8 8 0 00-16 0h16z" />
  </svg>
);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-12 text-center md:p-12 relative overflow-x-hidden bg-background">
      {/* Top Left User Info */}
      <div className="absolute top-8 left-8 z-50 flex items-center gap-3 opacity-60">
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center p-2">
          <ProfileIcon className="w-full h-full text-white/40" />
        </div>
        <div className="text-left font-mono">
          <div className="text-[10px] text-white/80 font-black uppercase tracking-widest">{user?.displayName || 'NIKHIL MANVI'}</div>
          <div className="text-[8px] text-white/30 uppercase tracking-[0.2em]">@ {userRole || 'ADMIN'}</div>
        </div>
      </div>

      {/* Auth Control (Top Right) */}
      <div className="absolute top-8 right-8 z-50">
        {user ? (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/20 hover:text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
          </Button>
        ) : (
          <Button onClick={handleLogin} variant="outline" className="border-primary/40 text-primary uppercase text-[10px] tracking-widest h-10 px-6 bg-black/40">
            Initialize
          </Button>
        )}
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="z-10 w-full max-w-6xl mt-8"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <LogoIcon className="w-16 h-16 text-[#ebd600] opacity-90" />
        </motion.div>

        {/* Title */}
        <motion.h1 
          variants={itemVariants}
          className="text-6xl md:text-8xl font-black mb-8 title-glow font-heading uppercase"
        >
          Mission Override
        </motion.h1>

        {/* Status */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <div className="status-capsule">
            <span className="text-xs md:text-lg font-black tracking-[0.5em] text-destructive uppercase">
              Engineering Status: <span className="animate-pulse">Critical Failure</span>
            </span>
          </div>
        </motion.div>

        {/* Context Stats */}
        <motion.div variants={itemVariants} className="flex justify-center gap-4 mb-20">
          <div className="stat-label">Duration: 4 Hours</div>
          <div className="stat-label">Status: Persistent</div>
          <div className="stat-label">Difficulty: Extreme</div>
        </motion.div>

        {/* Action Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 px-4 items-center">
          {/* Diagnostics */}
          <div className="tech-card p-10 h-64 flex flex-col items-center justify-center border-white/5 bg-white/[0.03] group transition-all duration-300 hover:bg-white/[0.06]">
            <div className="w-12 h-12 flex items-center justify-center mb-6 border border-accent/40 text-accent group-hover:scale-110 transition-transform">
              <DiagnosticsIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black mb-3 tracking-[0.3em] text-white/90 uppercase">Diagnostics</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] leading-relaxed max-w-[200px]">Initialize hardware logic & test sensors.</p>
          </div>

          {/* Recalibration (Central) */}
          <div className="hazard-border-container">
            <div className="tech-card p-10 h-64 flex flex-col items-center justify-center group transition-all duration-300">
              <div className="w-12 h-12 flex items-center justify-center mb-6 border border-primary/40 text-primary group-hover:rotate-180 transition-transform duration-500">
                <RecalibrationIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black mb-3 tracking-[0.3em] text-white/90 uppercase">System Recalibration</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] leading-relaxed max-w-[200px]">Recalibrate the core systems to ensure your navigation.</p>
            </div>
          </div>

          {/* Override */}
          <div className="tech-card p-10 h-64 flex flex-col items-center justify-center border-white/5 bg-white/[0.03] group transition-all duration-300 hover:bg-white/[0.06]">
            <div className="w-12 h-12 flex items-center justify-center mb-6 border border-primary/40 text-primary group-hover:scale-110 transition-transform">
              <LogoIcon className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-sm font-black mb-3 tracking-[0.3em] text-white/90 uppercase">Engineering Override</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-[0.1em] leading-relaxed max-w-[200px]">Combine sub-routines for manual core restart.</p>
          </div>
        </motion.div>

        {/* Engineering Directive */}
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-20 directive-box text-left">
          <h3 className="text-[12px] font-black text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <DiagnosticsIcon className="w-5 h-5" /> Engineering Directive
          </h3>
          <div className="space-y-4 text-[11px] text-white/60 uppercase tracking-[0.15em] leading-loose font-mono">
            <p>1. You are the lead engineer aboard the USCSS AEGIS. The main engineering deck has suffered a critical mechanical failure.</p>
            <p>2. Stabilize the magnetic confinement field before core breach occurs. All sub-systems must be synchronized manually.</p>
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 mb-24">
          <Button
            size="lg"
            onClick={onStart}
            disabled={!user}
            className={`tech-button h-20 px-24 text-2xl font-black uppercase tracking-[0.4em] ${!user ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            {user ? 'Acknowledge & Start' : 'Login Required'}
          </Button>
          {!user && (
            <p className="text-[10px] text-destructive font-black uppercase tracking-[0.3em] animate-pulse">
              [ ERROR ] SECURE CHANNEL DISCONNECTED. AUTHENTICATION MANDATORY.
            </p>
          )}
        </motion.div>

        {/* Leaderboard Section (Optional fold) */}
        <motion.div variants={itemVariants} className="w-full max-w-4xl mx-auto pb-32">
          <div className="flex items-center gap-6 mb-12">
            <div className="flex-1 h-px bg-white/5" />
            <div className="flex items-center gap-6">
              <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                <Trophy className="w-4 h-4" /> Personnel Records
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchLeaderboard}
                disabled={loadingLeaderboard}
                className="h-8 w-8 text-white/20 hover:text-primary transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLeaderboard ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="font-mono text-left space-y-1">
            {leaderboard.map((record, idx) => (
              <div
                key={record.id}
                className="flex items-center p-4 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"
              >
                <span className="w-12 text-[10px] font-black text-white/20">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="flex-1 text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">{record.userName}</span>
                <span className="w-32 text-right text-[10px] font-black text-[#ebd600]">{record.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {userRole === 'admin' && (
          <motion.div
            variants={itemVariants}
            className="mt-12 p-8 border-2 border-accent/40 bg-accent/5 backdrop-blur-xl relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-accent">
                <ShieldCheck className="w-8 h-8" />
                <div className="text-left">
                  <span className="block text-xs font-black uppercase tracking-[0.3em]">Command Deck</span>
                  <span className="block text-[8px] text-accent/50 uppercase tracking-widest font-mono">Root Privileges Authenticated</span>
                </div>
              </div>
              <Button
                onClick={onOpenAdmin}
                className="tech-button border-accent text-accent hover:bg-accent/10 h-10 px-8 text-[10px]"
              >
                Enter Admin Hub
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>

      <div className="absolute bottom-12 left-12 text-left font-mono text-[9px] text-white/10 uppercase tracking-widest hidden md:block">
        <p>TERMINAL: USCSS-AEGIS-CONSOLE-4</p>
        <p>TIMESTAMP: {new Date().toISOString()}</p>
        <p>LOCATION: SECTOR 7-B // ENGINEERING</p>
      </div>
    </div>
  );
};
