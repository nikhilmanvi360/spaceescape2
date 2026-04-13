import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Timer,
  Activity,
  Zap,
  Wind,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Lock,
  Unlock,
  CheckCircle,
  ShieldAlert,
  Cpu,
  LayoutDashboard,
  Volume2,
  VolumeX,
  ZapOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { GAME_DATA, Question } from '@/src/data/questions';

interface DashboardProps {
  onComplete: (score: number, timeTaken: number, success: boolean, hintsUsed: number) => void;
  onExit: () => void;
  onOpenAdmin: () => void;
  userRole: 'admin' | 'user' | null;
}

const STORAGE_KEY = 'mission_override_state';
const INITIAL_TIME = 14400; // 4 hours in seconds

export const Dashboard: React.FC<DashboardProps> = ({ onComplete, onExit, onOpenAdmin, userRole }) => {
  // Persistence Loading
  const savedState = useMemo(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  }, []);

  const [currentRoundIdx, setCurrentRoundIdx] = useState(savedState?.currentRoundIdx ?? 0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(savedState?.currentQuestionIdx ?? 0);
  const [score, setScore] = useState(savedState?.score ?? 0);
  const [timeLeft, setTimeLeft] = useState(savedState?.timeLeft ?? INITIAL_TIME);
  const [hintsUsed, setHintsUsed] = useState(savedState?.hintsUsed ?? 0);
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>(savedState?.completedQuestionIds ?? []);
  const [hintsUsedForQuestion, setHintsUsedForQuestion] = useState<string[]>(savedState?.hintsUsedForQuestion ?? []);
  const [isGodMode, setIsGodMode] = useState(false);

  const [answer, setAnswer] = useState('');
  const [isDecryptingHint, setIsDecryptingHint] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const [systemStatus, setSystemStatus] = useState({
    oxygen: savedState?.systemStatus?.oxygen ?? 100,
    fuel: savedState?.systemStatus?.fuel ?? 100,
    navigation: savedState?.systemStatus?.navigation ?? 100
  });

  const [emergency, setEmergency] = useState<{ active: boolean, code: string, type: string } | null>(null);
  const [emergencyInput, setEmergencyInput] = useState('');
  const [isGlitching, setIsGlitching] = useState(false);
  const [maintenanceTarget, setMaintenanceTarget] = useState<'oxygen' | 'fuel' | 'navigation' | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  // Audio Refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const ambientRef = useRef<HTMLAudioElement | null>(null);

  const startTime = useRef(savedState?.startTime ?? Date.now());

  const currentRound = GAME_DATA[currentRoundIdx];
  const currentQuestion = currentRound.questions[currentQuestionIdx];

  const totalQuestions = useMemo(() => GAME_DATA.reduce((acc, round) => acc + round.questions.length, 0), []);
  const progress = (completedQuestionIds.length / totalQuestions) * 100;

  const canGoBack = useMemo(() => {
    let prevRIdx = currentRoundIdx;
    let prevQIdx = currentQuestionIdx - 1;

    if (prevQIdx < 0) {
      prevRIdx -= 1;
      if (prevRIdx >= 0) {
        prevQIdx = GAME_DATA[prevRIdx].questions.length - 1;
      }
    }

    if (prevRIdx < 0) return false;

    const prevQuestionId = GAME_DATA[prevRIdx].questions[prevQIdx].id;
    return completedQuestionIds.includes(prevQuestionId);
  }, [currentRoundIdx, currentQuestionIdx, completedQuestionIds]);

  const handlePrevious = () => {
    let prevRIdx = currentRoundIdx;
    let prevQIdx = currentQuestionIdx - 1;

    if (prevQIdx < 0) {
      prevRIdx -= 1;
      if (prevRIdx >= 0) {
        prevQIdx = GAME_DATA[prevRIdx].questions.length - 1;
      }
    }

    if (prevRIdx >= 0) {
      selectQuestion(prevRIdx, prevQIdx);
    }
  };

  // Persistence Saving & Firestore Sync
  useEffect(() => {
    const state = {
      currentRoundIdx,
      currentQuestionIdx,
      score,
      timeLeft,
      hintsUsed,
      completedQuestionIds,
      hintsUsedForQuestion,
      systemStatus,
      startTime: startTime.current
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Sync to Firestore for Admin Monitoring
    const syncProgress = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastActive: serverTimestamp(),
          currentMission: {
            round: currentRoundIdx + 1,
            question: currentQuestionIdx + 1,
            progress: Math.round(progress),
            timeLeft,
            score,
            updatedAt: Date.now()
          }
        });
      } catch (e) {
        console.error("Mission Sync Failed:", e);
      }
    };

    const timeout = setTimeout(syncProgress, 2000); // Debounce sync
    return () => clearTimeout(timeout);
  }, [currentRoundIdx, currentQuestionIdx, score, timeLeft, hintsUsed, completedQuestionIds, hintsUsedForQuestion, progress]);

  // Audio Initialization & Control (Upgrade 4)
  useEffect(() => {
    const sounds = {
      click: '/chaloo.mp3',
      success: '/aji-mangal.mp3',
      error: '/chicken-on-tree-screaming.mp3',
      alarm: '/999-social-credit-siren.mp3',
      hum: 'https://assets.mixkit.co/sfx/preview/mixkit-futuristic-computer-hum-2139.mp3'
    };

    Object.entries(sounds).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = key === 'hum' ? 0.3 : 0.5;
      if (key === 'hum' || key === 'alarm') audio.loop = true;
      audioRefs.current[key] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach(a => {
        a.pause();
        a.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    if (isMuted) {
      Object.values(audioRefs.current).forEach(a => a.muted = true);
    } else {
      Object.values(audioRefs.current).forEach(a => a.muted = false);
      audioRefs.current.hum?.play().catch(console.error);
    }
  }, [isMuted]);

  useEffect(() => {
    const alarm = audioRefs.current.alarm;
    if (!alarm) return;
    if (emergency) {
      alarm.play().catch(console.error);
    } else {
      alarm.pause();
      alarm.currentTime = 0;
    }
  }, [emergency]);

  const playSound = (sound: string) => {
    if (isMuted || !audioRefs.current[sound]) return;
    const a = audioRefs.current[sound];
    a.currentTime = 0;
    a.play().catch(console.error);
  };

  // Timer & Status Decay Logic
  useEffect(() => {
    if (isGodMode || timeLeft === 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft((prev: number) => Math.max(0, prev - 1));

      // Status Decay (Upgrade 3)
      setSystemStatus(prev => ({
        oxygen: Math.max(0, prev.oxygen - 0.05),
        fuel: Math.max(0, prev.fuel - 0.04),
        navigation: Math.max(0, prev.navigation - 0.03)
      }));

      // Random Alerts -> Interactive Emergency (Upgrade 1)
      if (Math.random() < 0.005 && !emergency && !activeAlert) {
        triggerEmergency("SYSTEM INSTABILITY DETECTED");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isGodMode, timeLeft, emergency, activeAlert]);

  // Admin Command Listener (Upgrade 5)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      const data = snapshot.data();
      if (data?.pendingCommand) {
        handleAdminCommand(data.pendingCommand);
        // Clear command after handling
        updateDoc(doc(db, 'users', user.uid), { pendingCommand: null });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdminCommand = (command: string) => {
    switch (command) {
      case 'SABOTAGE':
        triggerEmergency("UNIDENTIFIED SYSTEM ANOMALY DETECTED");
        break;
      case 'SUPPORT':
        setSystemStatus({ oxygen: 100, fuel: 100, navigation: 100 });
        setFeedback({ type: 'success', message: 'EXTERNAL SYSTEM RECOVERY INITIATED' });
        setTimeout(() => setFeedback(null), 3000);
        break;
      case 'GLITCH':
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 10000);
        break;
      default:
        break;
    }
  };

  const triggerEmergency = (type: string) => {
    const codes = ["VX-4", "CORE-7", "BYPASS-0", "DELTA-9", "SYNC-X"];
    const code = codes[Math.floor(Math.random() * codes.length)];
    setEmergency({ active: true, code, type });
    setEmergencyInput('');
  };

  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emergencyInput.toUpperCase() === emergency?.code) {
      setEmergency(null);
      playSound('success');
      setFeedback({ type: 'success', message: 'EMERGENCY BYPASS SUCCESSFUL' });
      setTimeout(() => setFeedback(null), 2000);
    } else {
      playSound('error');
      setFeedback({ type: 'error', message: 'INVALID BYPASS CODE' });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleMaintenance = (target: 'oxygen' | 'fuel' | 'navigation') => {
    playSound('success');
    setSystemStatus(prev => ({
      ...prev,
      [target]: Math.min(100, prev[target] + 25)
    }));
    setFeedback({ type: 'success', message: `${target.toUpperCase()} REPLENISHED` });
    setTimeout(() => setFeedback(null), 2000);
  };

  // System Status Mapping - Round Buffs
  useEffect(() => {
    const r1Completed = completedQuestionIds.filter(id => id.startsWith('1-')).length;
    const r2Completed = completedQuestionIds.filter(id => id.startsWith('2-')).length;

    if (r1Completed > 0) setSystemStatus(prev => ({ ...prev, navigation: Math.min(100, prev.navigation + 2) }));
    if (r2Completed > 0) setSystemStatus(prev => ({ ...prev, oxygen: Math.min(100, prev.oxygen + 2), fuel: Math.min(100, prev.fuel + 2) }));
  }, [completedQuestionIds]);

  // Game over check
  useEffect(() => {
    if (timeLeft === 0) {
      const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
      onComplete(score, timeTaken, false, hintsUsed);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [timeLeft, onComplete, score, hintsUsed]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft === 0) return;

    if (isGodMode) {
      setScore(prev => prev + 10);
      setFeedback({ type: 'success', message: 'GOD MODE OVERRIDE SUCCESSFUL' });
      setTimeout(() => {
        setFeedback(null);
        setAnswer('');
        if (currentQuestionIdx < currentRound.questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
        } else if (currentRoundIdx < GAME_DATA.length - 1) {
          setCurrentRoundIdx(prev => prev + 1);
          setCurrentQuestionIdx(0);
        } else {
          onComplete(score + 10, 0, true, hintsUsed);
        }
      }, 500);
      return;
    }

    const userAnswer = answer.toLowerCase().trim();
    let isCorrect = false;

    if (currentQuestion.type === 'code' && currentQuestion.validAnswers) {
      isCorrect = currentQuestion.validAnswers.some(valid =>
        userAnswer.includes(valid.toLowerCase().trim()) ||
        valid.toLowerCase().trim().includes(userAnswer)
      );
    } else if (currentQuestion.correctAnswer) {
      isCorrect = userAnswer === currentQuestion.correctAnswer.toLowerCase();
    }

    if (isCorrect) {
      const isFirstTime = !completedQuestionIds.includes(currentQuestion.id);
      if (isFirstTime) {
        setScore(prev => prev + 10);
        setCompletedQuestionIds(prev => [...prev, currentQuestion.id]);
      }

      playSound('success');
      setFeedback({ type: 'success', message: 'SYSTEM OVERRIDE SUCCESSFUL' });

      setTimeout(() => {
        setFeedback(null);
        setAnswer('');

        // Auto-advance logic
        if (currentQuestionIdx < currentRound.questions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
        } else if (currentRoundIdx < GAME_DATA.length - 1) {
          setCurrentRoundIdx(prev => prev + 1);
          setCurrentQuestionIdx(0);
        } else {
          const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);
          onComplete(score + 10, timeTaken, true, hintsUsed);
          localStorage.removeItem(STORAGE_KEY);
        }
      }, 1500);
    } else {
      playSound('error');
      let errorMessage = 'ERROR: INVALID OVERRIDE CODE';

      if (currentQuestion.type === 'code') {
        if (userAnswer === '') {
          errorMessage = 'ERROR: EMPTY BUFFER';
        } else if (currentQuestion.title.includes('Python')) {
          if (!userAnswer.includes('for') && currentQuestion.title.includes('Loop')) errorMessage = 'ERROR: MISSING "for" KEYWORD';
          else if (!userAnswer.includes('range') && currentQuestion.title.includes('Loop')) errorMessage = 'ERROR: MISSING "range" FUNCTION';
          else if (!userAnswer.includes(':')) errorMessage = 'ERROR: MISSING COLON (:)';
          else if (!userAnswer.includes('if') && currentQuestion.title.includes('Condition')) errorMessage = 'ERROR: MISSING "if" KEYWORD';
        } else if (currentQuestion.title.includes('HTML')) {
          if (!userAnswer.startsWith('<')) errorMessage = 'ERROR: INVALID TAG START';
          else if (!userAnswer.includes('>')) errorMessage = 'ERROR: INVALID TAG END';
          else if (!userAnswer.includes('/') && userAnswer.length > 5) errorMessage = 'ERROR: MISSING CLOSING TAG';
        } else if (currentQuestion.title.includes('CSS')) {
          if (!userAnswer.includes('{') || !userAnswer.includes('}')) errorMessage = 'ERROR: MISSING BRACES { }';
          else if (!userAnswer.includes(':')) errorMessage = 'ERROR: MISSING PROPERTY COLON (:)';
          else if (!userAnswer.includes(';')) errorMessage = 'ERROR: MISSING SEMICOLON (;)';
        }
      }

      setFeedback({ type: 'error', message: errorMessage });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleHint = () => {
    if (!hintsUsedForQuestion.includes(currentQuestion.id) && !isDecryptingHint) {
      setIsDecryptingHint(true);
      setScore(prev => Math.max(0, prev - 5));
      setHintsUsed(prev => prev + 1);
      setHintsUsedForQuestion(prev => [...prev, currentQuestion.id]);

      setTimeout(() => {
        setIsDecryptingHint(false);
      }, 1500);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectQuestion = (rIdx: number, qIdx: number) => {
    // Check if unlocked: all previous questions must be completed
    const targetRound = GAME_DATA[rIdx];
    const targetQuestion = targetRound.questions[qIdx];

    // Find absolute index of target
    let absoluteTargetIdx = 0;
    for (let i = 0; i < rIdx; i++) absoluteTargetIdx += GAME_DATA[i].questions.length;
    absoluteTargetIdx += qIdx;

    if (completedQuestionIds.length >= absoluteTargetIdx) {
      setCurrentRoundIdx(rIdx);
      setCurrentQuestionIdx(qIdx);
      setAnswer('');
      setFeedback(null);
    }
  };

  return (
    <div className={`flex flex-col h-screen font-mono relative overflow-hidden transition-colors duration-500 ${systemStatus.oxygen < 20 ? 'bg-destructive/5' : ''}`}>
      {/* CRT Effects Overlay */}
      <div className="crt-overlay" />
      <div className="scanline" />

      {/* Atmospheric Effects (Upgrade 2) */}
      <div 
        className="vignette-effect" 
        style={{ opacity: Math.max(0, (100 - systemStatus.oxygen) / 100) }} 
      />
      {isGlitching && <div className="fixed inset-0 z-[100] terminal-static pointer-events-none glitch-active" />}

      {/* Emergency Override Overlay (Upgrade 1) */}
      <AnimatePresence>
        {emergency && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 emergency-blur backdrop-blur-md"
          >
            <div className="w-full max-w-md tech-card p-8 border-destructive bg-black/90 shadow-[0_0_50px_rgba(255,0,0,0.3)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-destructive animate-pulse" />
              <div className="flex items-center gap-4 text-destructive mb-6">
                <ShieldAlert className="w-8 h-8 animate-bounce" />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter italic">Emergency Override</h2>
                  <p className="text-[10px] opacity-70 tracking-widest uppercase">{emergency.type}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-destructive/10 border border-destructive/20 text-center">
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-50 block mb-2">Bypass Authorization Code</span>
                  <span className="text-3xl font-black tracking-[0.5em] text-destructive">{emergency.code}</span>
                </div>

                <form onSubmit={handleEmergencySubmit} className="space-y-4">
                  <Input
                    placeholder="REPLICATE CODE TO BYPASS..."
                    value={emergencyInput}
                    onChange={(e) => setEmergencyInput(e.target.value.toUpperCase())}
                    className="h-12 bg-black border-destructive text-destructive text-center text-xl font-black tracking-[0.5em] rounded-none focus:ring-destructive"
                    autoFocus
                  />
                  <Button type="submit" className="w-full h-12 bg-destructive text-white font-black uppercase tracking-widest rounded-none hover:bg-destructive/80">
                    Confirm Override
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Alert Overlay */}
      {activeAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.2, repeat: Infinity }}
          className="fixed inset-0 bg-destructive/20 pointer-events-none z-50 border-[20px] border-destructive animate-pulse"
        />
      )}

      {/* Top Bar */}
      <header className="h-14 border-b-2 border-primary/20 bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none bg-primary flex items-center justify-center border-2 border-black shadow-[0_0_10px_rgba(0,255,128,0.3)]">
            <Cpu className="w-5 h-5 text-black animate-pulse" />
          </div>
          <h1 className="text-xl font-black tracking-[0.2em] text-primary italic neon-text font-heading uppercase">Mission Override</h1>
        </div>

        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="text-primary hover:bg-primary/10 border-2 border-primary/20 h-10 w-10 flex items-center justify-center p-0"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>

          {userRole === 'admin' && (
            <div className="flex items-center gap-4 mr-4 border-r-2 border-primary/20 pr-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAdmin}
                className="text-accent hover:bg-accent/10 text-[9px] font-black uppercase tracking-[0.2em] border-2 border-accent/20 flex items-center gap-2 h-8 px-3"
              >
                <LayoutDashboard className="w-3 h-3" />
                Command Deck
              </Button>
              <div className="flex items-center gap-3 px-3 py-1 bg-background border-2 border-primary hazard-stripes rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]">
                <span className="text-[9px] font-black text-black uppercase tracking-[0.2em]">God Mode</span>
                <input
                  type="checkbox"
                  checked={isGodMode}
                  onChange={(e) => setIsGodMode(e.target.checked)}
                  className="toggle-switch scale-75 transform origin-right"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
                className="text-destructive hover:bg-destructive/10 text-[9px] font-black uppercase tracking-[0.2em] border-2 border-destructive/20 h-8 px-3"
              >
                Abort Mission
              </Button>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-primary/40 font-black uppercase tracking-[0.3em]">Reactor Stability Time</span>
            <div className={`flex items-center gap-2 ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              <Timer className="w-3 h-3" />
              <span className="text-lg font-black tabular-nums tracking-tighter">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-primary/20" />
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-primary/40 font-black uppercase tracking-[0.3em]">Efficiency Rating</span>
            <span className="text-lg font-black text-accent tabular-nums tracking-tighter">{score.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 z-10">
        {/* Left Panel: System Status */}
        <aside className="w-72 border-r-2 border-primary/10 bg-black/20 p-6 flex flex-col gap-10">
          <div className="space-y-6">
            <h3 className="text-[9px] font-black text-primary flex items-center gap-3 uppercase tracking-[0.3em]">
              <Activity className="w-4 h-4" /> Service Diagnostics
            </h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                  <span className="flex items-center gap-2 italic"><Navigation className="w-2.5 h-2.5 text-blue-400" /> Thrusters</span>
                  <span className="text-blue-400">{Math.round(systemStatus.navigation)}%</span>
                </div>
                <div className="h-2 bg-black border-2 border-blue-500/20 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.navigation}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                  <span className="flex items-center gap-2 italic"><Wind className="w-2.5 h-2.5 text-green-400" /> Ventilation</span>
                  <span className={systemStatus.oxygen < 30 ? 'text-destructive animate-pulse' : 'text-green-400'}>{Math.round(systemStatus.oxygen)}%</span>
                </div>
                <div className={`h-2 bg-black border-2 p-0.5 ${systemStatus.oxygen < 30 ? 'border-destructive' : 'border-green-500/20'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.oxygen}%` }}
                    className={`h-full shadow-[0_0_8px_rgba(34,197,94,0.5)] ${systemStatus.oxygen < 30 ? 'bg-destructive shadow-destructive/50' : 'bg-green-500'}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                  <span className="flex items-center gap-2 italic"><Zap className="w-2.5 h-2.5 text-accent" /> Fuel Pumps</span>
                  <span className="text-accent">{Math.round(systemStatus.fuel)}%</span>
                </div>
                <div className="h-2 bg-black border-2 border-accent/20 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.fuel}%` }}
                    className="h-full bg-accent shadow-[0_0_8px_rgba(255,165,0,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <h3 className="text-[9px] font-black text-primary/40 uppercase tracking-[0.3em]">System Output Log</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-3 custom-scrollbar font-mono text-[8px] font-bold">
              <AnimatePresence>
                {activeAlert && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-2 bg-destructive/10 border-l-2 border-destructive text-destructive flex items-center gap-2 animate-pulse"
                  >
                    <span className="flex-shrink-0">[ FAIL ]</span>
                    <span className="uppercase tracking-widest">{activeAlert}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="p-2 bg-primary/5 border-l-2 border-primary text-primary flex items-center gap-2">
                <span className="flex-shrink-0">[  OK  ]</span>
                <span className="uppercase tracking-widest">Core Stabilizer: Nominal</span>
              </div>
              <div className="p-2 bg-primary/5 border-l-2 border-primary text-primary flex items-center gap-2">
                <span className="flex-shrink-0">[  OK  ]</span>
                <span className="uppercase tracking-widest">Neural Link: Established</span>
              </div>
              <div className="p-2 bg-accent/5 border-l-2 border-accent text-accent flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0">[ INFO ]</span>
                  <span className="uppercase tracking-widest">Decrypted Hints: {hintsUsed}</span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3 pb-4">
              <h3 className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">Maintenance Sub-routines</h3>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={() => handleMaintenance('oxygen')}
                  className="maintenance-btn group"
                >
                  <span>Repair Ventilation</span>
                  <Wind className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                </button>
                <button 
                  onClick={() => handleMaintenance('fuel')}
                  className="maintenance-btn group"
                >
                   <span>Stabilize Fuel</span>
                   <Zap className="w-3 h-3 group-hover:scale-125 transition-transform" />
                </button>
                <button 
                  onClick={() => handleMaintenance('navigation')}
                  className="maintenance-btn group"
                >
                  <span>Adjust Thrusters</span>
                  <Navigation className="w-3 h-3 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Panel: Active Question */}
        <main className="flex-1 p-6 flex flex-col gap-6 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Card className="dashboard-panel border-none flex-1 flex flex-col overflow-hidden bg-black/40 shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <CardHeader className="border-b-2 border-primary/10 bg-primary/5 p-6 md:p-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center border-2 border-primary/40 shadow-[0_0_20px_rgba(0,255,128,0.1)] relative">
                        <Terminal className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-primary font-black uppercase tracking-tight italic font-heading neon-text">{currentQuestion.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary/70 uppercase tracking-widest bg-primary/5 rounded-none px-3 py-0.5">SEC_Round_{currentRound.id}</Badge>
                          <Badge variant="outline" className="text-[9px] font-black border-accent/40 text-accent/70 uppercase tracking-widest bg-accent/5 rounded-none px-3 py-0.5">QUES_{currentQuestionIdx + 1}</Badge>
                        </div>
                      </div>
                    </div>
                    {completedQuestionIds.includes(currentQuestion.id) && (
                      <div className="animate-pulse bg-primary/20 text-primary border-2 border-primary/40 uppercase text-[9px] font-black px-4 py-1.5 flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5" /> Subsystem Secured
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 overflow-y-auto">
                  <div className="text-lg md:text-xl leading-relaxed text-primary/80 font-bold tracking-tight border-l-4 border-primary/20 pl-6">
                    {currentQuestion.description}
                  </div>

                  {currentQuestion.code && (
                    <div className="bg-black/80 p-6 border-2 border-primary/20 font-mono text-xs text-primary relative group shadow-[inset_0_0_40px_rgba(0,0,0,1)] min-h-[120px] flex flex-col">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 shadow-[0_0_15px_rgba(0,255,128,0.5)]" />
                      <div className="absolute top-2 right-4 text-[8px] text-primary/30 uppercase tracking-[0.4em] font-black italic">Read_Only_Memory // Segment_0x{currentQuestion.id.substring(0,2)}</div>
                      <pre className="whitespace-pre-wrap leading-tight mt-6 mb-2 font-black">{currentQuestion.code}</pre>
                    </div>
                  )}

                  <div className="mt-auto space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex flex-col xl:flex-row gap-4">
                        <div className="flex-1 relative">
                          <div className="absolute -top-3 left-4 px-2 bg-background z-10 text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">Input_Buffer_Stream</div>
                          {currentQuestion.type === 'code' ? (
                            <Textarea
                              placeholder="COMPILE OVERRIDE LOGIC..."
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={timeLeft === 0}
                              className="bg-black/60 border-2 border-primary/30 focus:border-primary text-primary min-h-[120px] text-lg font-mono tracking-wider placeholder:text-primary/10 rounded-none resize-none shadow-[inset_0_0_20px_rgba(0,0,0,1)] p-4"
                              autoFocus
                            />
                          ) : (
                            <Input
                              placeholder="ENTER BYPASS CODE..."
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={timeLeft === 0}
                              className="bg-black/60 border-2 border-primary/30 focus:border-primary text-primary h-14 text-xl md:text-2xl uppercase tracking-[0.3em] font-black placeholder:text-primary/10 rounded-none shadow-[inset_0_0_20px_rgba(0,0,0,1)] px-6"
                              autoFocus
                            />
                          )}
                          <AnimatePresence>
                            {feedback && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className={`absolute -top-10 right-0 text-[8px] font-black px-4 py-1.5 border-2 shadow-lg tracking-[0.2em] ${feedback.type === 'success'
                                    ? 'text-black border-primary bg-primary'
                                    : 'text-white border-destructive bg-destructive animate-bounce'
                                  }`}
                              >
                                [ {feedback.message} ]
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex gap-2">
                          {canGoBack && (
                            <Button
                              type="button"
                              onClick={handlePrevious}
                              variant="outline"
                              className="h-14 px-6 border-2 border-primary/30 text-primary hover:bg-primary/10 rounded-none transition-all active:translate-y-1"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </Button>
                          )}
                          <Button
                            type="submit"
                            disabled={timeLeft === 0}
                            className="tech-button h-14 px-12 text-xl font-black uppercase tracking-[0.2em] flex-1 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-none bg-primary text-black"
                          >
                            Bypass <ChevronRight className="w-6 h-6 ml-2" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t-2 border-primary/10">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={hintsUsedForQuestion.includes(currentQuestion.id) || isDecryptingHint || timeLeft === 0}
                            onClick={handleHint}
                            className="text-primary/30 hover:text-accent hover:bg-accent/10 text-[9px] font-black uppercase tracking-[0.2em] disabled:opacity-50 h-10 px-6 border-2 border-transparent hover:border-accent/30 rounded-none transition-all"
                          >
                            <HelpCircle className="w-4 h-4 mr-3" />
                            {hintsUsedForQuestion.includes(currentQuestion.id) ? 'Information Decrypted' : isDecryptingHint ? 'Bypassing Encryption...' : 'Request Subsystem Hint'}
                          </Button>

                          {isDecryptingHint && (
                            <div className="w-32 h-1.5 bg-black border-2 border-accent/20 overflow-hidden relative">
                              <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full bg-accent"
                              />
                            </div>
                          )}
                        </div>

                        {hintsUsedForQuestion.includes(currentQuestion.id) && !isDecryptingHint && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-accent text-black px-4 py-2 border-2 border-black font-mono font-black italic flex items-center gap-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                          >
                            <Unlock className="w-4 h-4 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-[0.4em] opacity-60 leading-none mb-0.5">Decrypted_Intel</span>
                              <span className="text-[10px] uppercase tracking-wider">{currentQuestion.hint}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right Panel: Question List */}
        <aside className="w-72 border-l-2 border-primary/10 bg-black/30 p-6 flex flex-col gap-8">
          <h3 className="text-[9px] font-black text-primary flex items-center gap-3 uppercase tracking-[0.3em]">
            <Terminal className="w-4 h-4" /> Ship Manifest
          </h3>

          <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar space-y-8">
            {GAME_DATA.map((round, rIdx) => (
              <div key={round.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-black text-primary/30 uppercase tracking-[0.3em]">Module_{round.id.toString().padStart(2, '0')}</span>
                  <div className="flex-1 h-px bg-primary/10" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {round.questions.map((q, qIdx) => {
                    const isCompleted = completedQuestionIds.includes(q.id);
                    const isActive = currentRoundIdx === rIdx && currentQuestionIdx === qIdx;

                    // Unlock logic: first question or previous is completed
                    let absoluteIdx = 0;
                    for (let i = 0; i < rIdx; i++) absoluteIdx += GAME_DATA[i].questions.length;
                    absoluteIdx += qIdx;
                    const isUnlocked = completedQuestionIds.length >= absoluteIdx;

                    return (
                      <button
                        key={q.id}
                        disabled={!isUnlocked}
                        onClick={() => selectQuestion(rIdx, qIdx)}
                        className={`
                          group flex items-center justify-between p-3 border-2 transition-all text-left relative overflow-hidden
                          ${isActive 
                            ? 'bg-primary/10 border-primary shadow-[inset_0_0_10px_rgba(0,255,128,0.1)] translate-x-1' 
                            : isUnlocked 
                              ? 'bg-black/40 border-primary/10 hover:border-primary/30' 
                              : 'bg-black/20 border-white/5 opacity-40 cursor-not-allowed'}
                        `}
                      >
                        {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-6 h-6 flex items-center justify-center text-[9px] font-black
                            ${isCompleted 
                              ? 'bg-primary text-black' 
                              : isActive 
                                ? 'bg-primary/20 text-primary border-2 border-primary' 
                                : 'bg-black border-2 border-white/10 text-white/20'}
                          `}>
                            {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : (qIdx + 1).toString().padStart(2, '0')}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider truncate max-w-[110px] ${isActive ? 'text-primary' : 'text-white/30'}`}>
                            {q.title}
                          </span>
                        </div>
                        {!isUnlocked ? (
                          <Lock className="w-2.5 h-2.5 text-white/10" />
                        ) : isCompleted ? (
                          <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_4px_rgba(0,255,128,1)] rounded-full" />
                        ) : (
                          <div className="w-1.5 h-1.5 bg-white/5 rounded-full group-hover:bg-primary/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Heavy Industrial Footer */}
      <footer className="h-12 border-t-2 border-primary/20 bg-black flex items-center px-6 gap-8 z-20">
        <div className="flex items-center gap-3 min-w-[180px]">
          <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em]">Mission Integrity</span>
          <span className="text-xs font-black text-primary tabular-nums">{Math.round(progress)}%</span>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="flex-1 h-2 bg-black border-2 border-primary/10 p-0.5 relative overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary shadow-[0_0_15px_rgba(0,255,128,0.2)] relative"
            >
              <div className="absolute right-0 top-0 w-1 h-full bg-white shadow-[0_0_8px_white]" />
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-8 text-[8px] font-black text-primary/10 uppercase tracking-[0.4em]">
          <div className="flex gap-6 hidden xl:flex">
            <span>Link: OK</span>
            <span>Sync: 100%</span>
            <span>AIS-OS v4.2.0</span>
          </div>
          <div className="italic text-primary/20">USCSS AEGIS // SEC_7G</div>
        </div>
      </footer>
    </div>
  );
};
