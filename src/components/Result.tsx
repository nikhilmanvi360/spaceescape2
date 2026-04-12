import React from 'react';
import { motion } from 'motion/react';
import { Trophy, XCircle, RefreshCw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultProps {
  score: number;
  timeTaken: number;
  success: boolean;
  hintsUsed: number;
  onRestart: () => void;
}

export const Result: React.FC<ResultProps> = ({ score, timeTaken, success, hintsUsed, onRestart }) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-2xl"
      >
        <Card className={`tech-card border-none overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]`}>
          <CardHeader className={`text-center py-16 ${success ? 'bg-primary/5' : 'bg-destructive/5'} relative`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex justify-center mb-8">
              {success ? (
                <div className="relative">
                  <Trophy className="w-28 h-28 text-primary animate-pulse" />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                  />
                </div>
              ) : (
                <div className="relative">
                  <XCircle className="w-28 h-28 text-destructive animate-glitch" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 bg-destructive/20 rounded-full blur-3xl"
                  />
                </div>
              )}
            </div>
            <CardTitle className={`text-6xl md:text-7xl font-black tracking-tighter uppercase italic font-heading neon-text ${success ? 'text-primary' : 'text-destructive'}`}>
              {success ? 'MISSION SUCCESS' : 'MISSION FAILED'}
            </CardTitle>
            <p className="text-muted-foreground mt-4 font-mono uppercase tracking-[0.4em] text-sm opacity-70">
              {success ? 'Ship Systems Restored // Core Stable' : 'Critical System Failure // Core Unstable'}
            </p>
          </CardHeader>
          <CardContent className="p-12 bg-black/20">
            <div className="grid grid-cols-3 gap-6 mb-16">
              <div className="text-center p-6 bg-secondary/20 rounded-sm border border-primary/10 shadow-inner">
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">Final Score</p>
                <p className="text-4xl font-black text-accent neon-text">{score.toString().padStart(4, '0')}</p>
              </div>
              <div className="text-center p-6 bg-secondary/20 rounded-sm border border-primary/10 shadow-inner">
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">Time Taken</p>
                <p className="text-4xl font-black text-primary neon-text">{formatTime(timeTaken)}</p>
              </div>
              <div className="text-center p-6 bg-secondary/20 rounded-sm border border-primary/10 shadow-inner">
                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-2 font-bold">Hints Used</p>
                <p className="text-4xl font-black text-destructive neon-text">{hintsUsed}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <Button 
                onClick={onRestart}
                className="tech-button flex-1 h-16 text-lg font-black uppercase tracking-[0.2em] text-primary-foreground"
              >
                <RefreshCw className="w-5 h-5 mr-3" /> Restart Mission
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const text = `🚀 MISSION OVERRIDE: ${success ? 'SUCCESS' : 'FAILED'}\n🏆 Score: ${score}\n⏱️ Time: ${formatTime(timeTaken)}\n💡 Hints: ${hintsUsed}\nCan you beat my score?`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Mission Override Result',
                      text: text,
                      url: window.location.href
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(text);
                    alert("MISSION REPORT COPIED TO CLIPBOARD");
                  }
                }}
                className="flex-1 h-16 border-2 border-accent/50 text-accent hover:bg-accent/10 font-black uppercase tracking-[0.2em] rounded-sm transition-all"
              >
                <Share2 className="w-5 h-5 mr-3" /> Share Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
          <p>Transmission ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
          <p>Location: Sector 7G, Deep Space</p>
        </div>
      </motion.div>
    </div>
  );
};
