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
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-black/40">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-xl"
      >
        <Card className={`tech-card border-none overflow-hidden bg-black/60 shadow-[0_0_100px_rgba(0,0,0,0.8)]`}>
          <CardHeader className={`text-center py-12 md:py-16 ${success ? 'bg-primary/5' : 'bg-destructive/5'} relative border-b-2 border-white/10`}>
            <div className={`absolute top-0 left-0 w-full h-1 ${success ? 'bg-primary' : 'bg-destructive'} shadow-[0_0_15px_rgba(0,255,128,0.5)]`} />
            <div className="flex justify-center mb-8">
              {success ? (
                <div className="relative">
                  <Trophy className="w-24 h-24 text-primary animate-pulse" />
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                  />
                </div>
              ) : (
                <div className="relative">
                  <XCircle className="w-24 h-24 text-destructive animate-flicker" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 bg-destructive/20 rounded-full blur-3xl"
                  />
                </div>
              )}
            </div>
            <CardTitle className={`text-5xl md:text-7xl font-black tracking-[-0.05em] uppercase italic font-heading neon-text ${success ? 'text-primary' : 'text-destructive'}`}>
              {success ? 'SUCCESS' : 'FAILED'}
            </CardTitle>
            <p className="text-primary/40 mt-4 font-mono uppercase tracking-[0.5em] text-[10px] font-black">
              {success ? 'Status: Ship Systems Restored' : 'Status: Critical System Failure'}
            </p>
          </CardHeader>
          <CardContent className="p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="text-center p-6 bg-black/40 border-2 border-primary/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                <p className="text-[7px] text-primary/40 uppercase tracking-[0.3em] mb-2 font-black">Rating</p>
                <p className="text-2xl font-black text-accent tabular-nums tracking-tighter">{score.toString().padStart(4, '0')}</p>
              </div>
              <div className="text-center p-6 bg-black/40 border-2 border-primary/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                <p className="text-[7px] text-primary/40 uppercase tracking-[0.3em] mb-2 font-black">Time</p>
                <p className="text-2xl font-black text-primary tabular-nums tracking-tighter">{formatTime(timeTaken)}</p>
              </div>
              <div className="text-center p-6 bg-black/40 border-2 border-primary/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                <p className="text-[7px] text-primary/40 uppercase tracking-[0.3em] mb-2 font-black">Intel</p>
                <p className="text-2xl font-black text-destructive tabular-nums tracking-tighter">{hintsUsed}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <Button 
                onClick={onRestart}
                className="tech-button flex-1 h-14 text-sm font-black uppercase tracking-[0.3em] bg-primary text-black"
              >
                <RefreshCw className="w-5 h-5 mr-3" /> Re-Initialize
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const text = `🚀 MISSION OVERRIDE: ${success ? 'SUCCESS' : 'FAILED'}\n🏆 Rating: ${score}\n⏱️ Time: ${formatTime(timeTaken)}\nAuthorized Personnel Only.`;
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
                className="flex-1 h-14 border-2 border-accent/40 text-accent hover:bg-accent/10 font-black uppercase tracking-[0.2em] rounded-none transition-all active:translate-y-0.5"
              >
                <Share2 className="w-5 h-5 mr-3" /> Share Intel
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center font-mono text-[8px] text-primary/10 font-black uppercase tracking-[0.5em]">
          <p>Transmission ID: {Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
          <p>USCSS AEGIS // SEC_7G</p>
        </div>
      </motion.div>
    </div>
  );
};
