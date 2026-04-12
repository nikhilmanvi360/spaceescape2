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
  LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
    oxygen: 40,
    fuel: 30,
    navigation: 20
  });

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

  // Timer & Status Logic
  useEffect(() => {
    if (isGodMode) return;
    const interval = setInterval(() => {
      setTimeLeft((prev: number) => Math.max(0, prev - 1));

      // Random Alerts
      if (Math.random() < 0.01 && !activeAlert) {
        const alerts = [
          "OXYGEN LEVEL CRITICAL",
          "NAVIGATION FAILURE DETECTED",
          "FUEL LEAK IN SECTOR 4",
          "CORE TEMPERATURE RISING",
          "UNAUTHORIZED ACCESS ATTEMPT"
        ];
        setActiveAlert(alerts[Math.floor(Math.random() * alerts.length)]);
        setTimeout(() => setActiveAlert(null), 5000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAlert]);

  // System Status Mapping
  useEffect(() => {
    // R1 -> Navigation (0-100)
    // R2 -> Oxygen + Fuel (0-100)
    // R3 -> Core (0-100)
    
    const r1Questions = GAME_DATA[0].questions.length;
    const r2Questions = GAME_DATA[1].questions.length;
    const r3Questions = GAME_DATA[2].questions.length;

    const r1Completed = completedQuestionIds.filter(id => id.startsWith('1-')).length;
    const r2Completed = completedQuestionIds.filter(id => id.startsWith('2-')).length;
    const r3Completed = completedQuestionIds.filter(id => id.startsWith('3-')).length;

    setSystemStatus({
      navigation: Math.min(100, 20 + (r1Completed / r1Questions) * 80),
      oxygen: Math.min(100, 40 + (r2Completed / r2Questions) * 60),
      fuel: Math.min(100, 30 + (r2Completed / r2Questions) * 70),
      // Core is implicit in R3 progress
    });
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
    for(let i=0; i<rIdx; i++) absoluteTargetIdx += GAME_DATA[i].questions.length;
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

      {/* Critical Alert Overlay */}
      {activeAlert && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="fixed inset-0 bg-destructive pointer-events-none z-50"
        />
      )}

      {/* Top Bar */}
      <header className="h-16 border-b border-primary/20 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(0,255,128,0.1)]">
            <Cpu className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-primary italic neon-text font-heading">MISSION OVERRIDE</h1>
        </div>

        <div className="flex items-center gap-6">
          {userRole === 'admin' && (
            <div className="flex items-center gap-4 mr-4 border-r border-primary/20 pr-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenAdmin}
                className="text-accent hover:bg-accent/10 text-[10px] uppercase tracking-widest border border-accent/20 flex items-center gap-2"
              >
                <LayoutDashboard className="w-3 h-3" />
                Dashboard View
              </Button>
              <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-md">
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">God Mode</span>
                <input 
                  type="checkbox" 
                  checked={isGodMode} 
                  onChange={(e) => setIsGodMode(e.target.checked)}
                  className="w-3 h-3 accent-accent cursor-pointer"
                />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onExit}
                className="text-destructive hover:bg-destructive/10 text-[10px] uppercase tracking-widest border border-destructive/20"
              >
                Terminate Mission
              </Button>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Time Remaining</span>
            <div className={`flex items-center gap-2 ${timeLeft < 300 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              <Timer className="w-4 h-4" />
              <span className="text-xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-primary/20" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Mission Score</span>
            <span className="text-xl font-bold text-accent">{score.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0 z-10">
        {/* Left Panel: System Status */}
        <aside className="w-72 border-r border-primary/10 bg-card/20 p-6 flex flex-col gap-10">
          <div className="space-y-8">
            <h3 className="text-[10px] font-black text-primary flex items-center gap-2 uppercase tracking-[0.2em]">
              <Activity className="w-4 h-4" /> System Diagnostics
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-70">
                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> Navigation</span>
                  <span>{Math.round(systemStatus.navigation)}%</span>
                </div>
                <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden border border-blue-500/20">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.navigation}%` }}
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-70">
                  <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> Oxygen</span>
                  <span className={systemStatus.oxygen < 30 ? 'text-destructive animate-pulse font-bold' : ''}>{Math.round(systemStatus.oxygen)}%</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden border ${systemStatus.oxygen < 30 ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.oxygen}%` }}
                    className={`h-full ${systemStatus.oxygen < 30 ? 'bg-destructive shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-primary shadow-[0_0_10px_rgba(0,255,128,0.5)]'}`}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-70">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Fuel Reserve</span>
                  <span>{Math.round(systemStatus.fuel)}%</span>
                </div>
                <div className="h-1.5 bg-accent/10 rounded-full overflow-hidden border border-accent/20">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStatus.fuel}%` }}
                    className="h-full bg-accent shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mission Log</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              <AnimatePresence>
                {activeAlert && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="p-2 bg-destructive/10 border border-destructive/30 rounded text-[10px] text-destructive flex items-center gap-2 animate-pulse"
                  >
                    <AlertTriangle className="w-3 h-3" /> {activeAlert}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="p-2 bg-primary/5 border border-primary/10 rounded text-[10px] text-primary/70 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> CORE STABILIZER: ACTIVE
              </div>
              <div className="p-2 bg-accent/5 border border-accent/10 rounded text-[10px] text-accent/70 flex items-center gap-2">
                <Activity className="w-3 h-3" /> NEURAL LINK: STABLE
              </div>
              <div className="p-2 bg-secondary/5 border border-secondary/10 rounded text-[10px] text-muted-foreground flex items-center justify-between">
                <span>HINTS DECRYPTED</span>
                <span>{hintsUsed}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Panel: Active Question */}
        <main className="flex-1 p-8 flex flex-col gap-6 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Card className="dashboard-panel border-none flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b border-primary/10 bg-primary/5 p-8">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-sm bg-primary/10 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(0,255,128,0.2)]">
                        <Terminal className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-3xl text-primary uppercase tracking-tighter italic font-heading neon-text">{currentQuestion.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[9px] border-primary/30 text-primary/70 uppercase tracking-widest bg-primary/5">Round {currentRound.id}</Badge>
                          <Badge variant="outline" className="text-[9px] border-accent/30 text-accent/70 uppercase tracking-widest bg-accent/5">Question {currentQuestionIdx + 1}</Badge>
                        </div>
                      </div>
                    </div>
                    {completedQuestionIds.includes(currentQuestion.id) && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] px-3 py-1">
                        <CheckCircle className="w-3 h-3 mr-2" /> Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 overflow-y-auto">
                  <div className="text-xl md:text-2xl leading-relaxed text-foreground/90 font-light tracking-wide">
                    {currentQuestion.description}
                  </div>

                  {currentQuestion.code && (
                    <div className="bg-black/60 p-6 rounded-sm border border-primary/20 font-mono text-sm text-primary/80 relative group shadow-inner min-h-[120px] flex flex-col">
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40 shadow-[0_0_10px_rgba(0,255,128,0.5)]" />
                      <div className="absolute top-2 right-4 text-[9px] text-primary/40 uppercase tracking-[0.3em] font-bold">Secure Buffer // Read-Only</div>
                      <pre className="whitespace-pre-wrap leading-relaxed mt-6 mb-2">{currentQuestion.code}</pre>
                    </div>
                  )}

                  <div className="mt-auto space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          {currentQuestion.type === 'code' ? (
                            <Textarea
                              placeholder="WRITE YOUR CODE HERE..."
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={timeLeft === 0}
                              className="bg-black/40 border-primary/30 focus:border-primary text-primary min-h-[120px] text-lg font-mono tracking-wider placeholder:text-primary/10 rounded-sm resize-none"
                              autoFocus
                            />
                          ) : (
                            <Input
                              placeholder="ENTER OVERRIDE CODE..."
                              value={answer}
                              onChange={(e) => setAnswer(e.target.value)}
                              disabled={timeLeft === 0}
                              className="bg-black/40 border-primary/30 focus:border-primary text-primary h-14 text-xl md:text-2xl uppercase tracking-[0.3em] font-black placeholder:text-primary/10 rounded-sm"
                              autoFocus
                            />
                          )}
                          <AnimatePresence>
                            {feedback && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`absolute -top-10 left-0 text-sm font-bold px-3 py-1 rounded border ${
                                  feedback.type === 'success' 
                                    ? 'text-primary border-primary/30 bg-primary/10' 
                                    : 'text-destructive border-destructive/30 bg-destructive/10'
                                }`}
                              >
                                {feedback.message}
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
                              className="h-16 px-6 border-primary/30 text-primary hover:bg-primary/10"
                            >
                              <ChevronLeft className="w-6 h-6" />
                            </Button>
                          )}
                          <Button 
                            type="submit" 
                            disabled={timeLeft === 0}
                            className="tech-button h-16 px-12 text-xl font-black uppercase tracking-[0.2em] text-primary-foreground flex-1"
                          >
                            Override <ChevronRight className="w-6 h-6 ml-2" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={hintsUsedForQuestion.includes(currentQuestion.id) || isDecryptingHint || timeLeft === 0}
                            onClick={handleHint}
                            className="text-muted-foreground hover:text-accent hover:bg-accent/5 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 h-12 px-6 border border-transparent hover:border-accent/30 rounded-sm transition-all"
                          >
                            <HelpCircle className="w-4 h-4 mr-3" /> 
                            {hintsUsedForQuestion.includes(currentQuestion.id) ? 'Hint Decrypted' : isDecryptingHint ? 'Decrypting...' : 'Request Hint (-5 pts)'}
                          </Button>
                          
                          {isDecryptingHint && (
                            <div className="w-32 h-1 bg-accent/10 rounded-full overflow-hidden border border-accent/20">
                              <motion.div 
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full bg-accent shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                              />
                            </div>
                          )}
                        </div>
                        
                        {hintsUsedForQuestion.includes(currentQuestion.id) && !isDecryptingHint && (
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs text-accent bg-accent/5 px-5 py-3 border border-accent/30 rounded-sm uppercase font-mono italic flex items-center gap-3 shadow-[0_0_15px_rgba(0,255,255,0.05)]"
                          >
                            <Unlock className="w-4 h-4" />
                            <span className="text-white/30 mr-1 font-bold">DECRYPTED:</span> {currentQuestion.hint}
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
        <aside className="w-80 border-l border-primary/10 bg-card/30 p-6 flex flex-col gap-6">
          <h3 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
            <Terminal className="w-4 h-4" /> Mission Manifest
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            {GAME_DATA.map((round, rIdx) => (
              <div key={round.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Round {round.id}</span>
                  <div className="flex-1 h-px bg-primary/10" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {round.questions.map((q, qIdx) => {
                    const isCompleted = completedQuestionIds.includes(q.id);
                    const isActive = currentRoundIdx === rIdx && currentQuestionIdx === qIdx;
                    
                    // Unlock logic: first question or previous is completed
                    let absoluteIdx = 0;
                    for(let i=0; i<rIdx; i++) absoluteIdx += GAME_DATA[i].questions.length;
                    absoluteIdx += qIdx;
                    const isUnlocked = completedQuestionIds.length >= absoluteIdx;

                    return (
                      <button
                        key={q.id}
                        disabled={!isUnlocked}
                        onClick={() => selectQuestion(rIdx, qIdx)}
                        className={`
                          group flex items-center justify-between p-3 rounded border transition-all text-left
                          ${isActive ? 'bg-primary/10 border-primary/50 shadow-[0_0_10px_rgba(0,255,128,0.1)]' : 'bg-card/50 border-primary/10'}
                          ${!isUnlocked ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/30'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                            ${isCompleted ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}
                          `}>
                            {isCompleted ? <CheckCircle className="w-3 h-3" /> : qIdx + 1}
                          </div>
                          <span className={`text-[10px] font-medium uppercase truncate max-w-[120px] ${isActive ? 'text-primary' : 'text-foreground/70'}`}>
                            {q.title}
                          </span>
                        </div>
                        {!isUnlocked ? (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        ) : isCompleted ? (
                          <CheckCircle className="w-3 h-3 text-primary" />
                        ) : (
                          <Unlock className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
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

      {/* Bottom Progress Bar */}
      <footer className="h-12 border-t border-primary/20 bg-card/50 backdrop-blur-md flex items-center px-6 gap-6 z-20">
        <div className="flex items-center gap-3 min-w-[150px]">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Mission Progress</span>
          <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="flex-1">
          <Progress value={progress} className="h-1.5 bg-secondary/30" />
        </div>
        <div className="flex items-center gap-6 text-[8px] text-muted-foreground uppercase tracking-widest opacity-50">
          <div className="flex gap-4">
            <span>COMMS: ENCRYPTED</span>
            <span>LATENCY: 12ms</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
          <div>PROPERTY OF SPACE COMMAND</div>
        </div>
      </footer>
    </div>
  );
};
