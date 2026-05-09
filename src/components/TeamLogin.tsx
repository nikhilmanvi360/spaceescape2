import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamAuthManager, TeamUser } from '../lib/teamAuth';

interface TeamLoginProps {
  onLoginSuccess: (user: TeamUser) => void;
  isOpen: boolean;
}

export const TeamLogin: React.FC<TeamLoginProps> = ({ onLoginSuccess, isOpen }) => {
  const [selectedTeam, setSelectedTeam] = useState<'alpha' | 'beta' | 'gamma' | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const teams = [
    { id: 'alpha' as const, name: 'ALPHA COMMAND', color: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'beta' as const, name: 'BETA CONTROL', color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'gamma' as const, name: 'GAMMA STATION', color: 'from-orange-500/20 to-red-500/20' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!selectedTeam) {
        setError('Please select a team');
        return;
      }

      const user = TeamAuthManager.loginTeam(selectedTeam, password);
      setPassword('');
      setSelectedTeam(null);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-background border border-primary/30 rounded-lg p-8 max-w-md w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold tracking-widest uppercase">TEAM AUTHENTICATION</h2>
        </div>

        <p className="text-sm text-white/60 mb-6">
          Firebase connection compromised. Activate team credentials to proceed.
        </p>

        {/* Team Selection */}
        <div className="space-y-3 mb-6">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`w-full p-3 rounded border-2 transition-all ${
                selectedTeam === team.id
                  ? 'border-primary bg-primary/20'
                  : 'border-white/10 bg-white/5 hover:border-primary/50'
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-sm uppercase tracking-widest">{team.name}</div>
                <div className="text-xs text-white/50 mt-1">ID: {team.id.toUpperCase()}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Password Input */}
        {selectedTeam && (
          <motion.form onSubmit={handleLogin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-white/70">
                Secure Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter team password"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm focus:border-primary focus:outline-none"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-200 text-xs">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full uppercase font-bold tracking-widest"
            >
              {loading ? 'Authenticating...' : 'Activate'}
            </Button>
          </motion.form>
        )}

        {/* Info Box */}
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-200">
          <div className="font-bold mb-1">FALLBACK MODE ACTIVE</div>
          <div>This authentication method is available when primary Firebase services are unavailable.</div>
        </div>
      </motion.div>
    </motion.div>
  );
};
