import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Trophy, 
  Clock, 
  User, 
  Calendar, 
  ShieldCheck, 
  Search, 
  Users, 
  Trash2, 
  Shield, 
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Download,
  BookOpen,
  Radio
} from 'lucide-react';
import { GAME_DATA } from '../data/questions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface ScoreRecord {
  id: string;
  userId: string;
  userName: string;
  score: number;
  timeTaken: number;
  success: boolean;
  hintsUsed: number;
  timestamp: Timestamp;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: Timestamp;
  lastActive?: Timestamp;
  currentMission?: {
    round: number;
    question: number;
    progress: number;
    timeLeft: number;
    score: number;
  };
}

interface AdminDashboardProps {
  onBack: () => void;
}

type Tab = 'overview' | 'logs' | 'users' | 'live' | 'manifest';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const scoresQ = query(collection(db, 'scores'), orderBy('timestamp', 'desc'));
    const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribeScores = onSnapshot(scoresQ, (snapshot) => {
      const records: ScoreRecord[] = [];
      snapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as ScoreRecord);
      });
      setScores(records);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scores');
    });

    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      const records: UserProfile[] = [];
      snapshot.forEach((doc) => {
        records.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(records);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubscribeScores();
      unsubscribeUsers();
    };
  }, []);

  const chartData = useMemo(() => {
    const sortedScores = [...scores].sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    return sortedScores.map(s => ({
      name: s.timestamp.toDate().toLocaleDateString(),
      score: s.score,
      time: s.timeTaken
    })).slice(-10); // Last 10 missions
  }, [scores]);

  const successData = useMemo(() => {
    const successCount = scores.filter(s => s.success).length;
    const failCount = scores.length - successCount;
    return [
      { name: 'Success', value: successCount, color: '#00ff80' },
      { name: 'Failure', value: failCount, color: '#ff4d4d' }
    ];
  }, [scores]);

  const filteredScores = scores.filter(s => 
    s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (user.email === 'nikhilmanvi360@gmail.com') {
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'scores', id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `scores/${id}`);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Pilot', 'Score', 'Time (s)', 'Status', 'Hints', 'Timestamp'];
    const rows = scores.map(s => [
      s.userName,
      s.score,
      s.timeTaken,
      s.success ? 'SUCCESS' : 'FAILED',
      s.hintsUsed,
      s.timestamp.toDate().toISOString()
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `mission_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-primary hover:bg-primary/10">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-primary flex items-center gap-3 italic">
              <ShieldCheck className="w-8 h-8" />
              Command Center
            </h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Fleet Operations // Level 5 Clearance</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 border border-primary/20 p-1 rounded-md">
            <Button 
              variant={activeTab === 'overview' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('overview')}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              Overview
            </Button>
            <Button 
              variant={activeTab === 'logs' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('logs')}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              Mission Logs
            </Button>
            <Button 
              variant={activeTab === 'users' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('users')}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              Personnel
            </Button>
            <Button 
              variant={activeTab === 'live' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('live')}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              Live Monitor
            </Button>
            <Button 
              variant={activeTab === 'manifest' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('manifest')}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              Manifest
            </Button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
            <Input 
              placeholder="SEARCH..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black/40 border-primary/20 focus:border-primary text-primary font-mono text-xs tracking-widest h-10"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Stats Summary */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="tech-card p-6 border-primary/20 bg-primary/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Missions</div>
                <div className="text-3xl font-black text-primary font-mono">{scores.length}</div>
              </div>
              <div className="tech-card p-6 border-accent/20 bg-accent/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Avg Score</div>
                <div className="text-3xl font-black text-accent font-mono">
                  {scores.length > 0 ? Math.round(scores.reduce((acc, s) => acc + s.score, 0) / scores.length) : 0}
                </div>
              </div>
              <div className="tech-card p-6 border-destructive/20 bg-destructive/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Success Rate</div>
                <div className="text-3xl font-black text-destructive font-mono">
                  {scores.length > 0 ? Math.round((scores.filter(s => s.success).length / scores.length) * 100) : 0}%
                </div>
              </div>
              <div className="tech-card p-6 border-muted/20 bg-muted/5">
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Total Personnel</div>
                <div className="text-3xl font-black text-muted-foreground font-mono">{users.length}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="md:col-span-2 tech-card p-6 border-primary/10 bg-black/20">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Mission Performance Trend</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #00ff80', fontSize: '10px' }}
                      itemStyle={{ color: '#00ff80' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#00ff80" strokeWidth={2} dot={{ fill: '#00ff80' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="tech-card p-6 border-accent/10 bg-black/20">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-accent">Mission Success Distribution</h3>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={successData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {successData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: '1px solid #00ffff', fontSize: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {successData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 tech-card p-6 border-muted/10 bg-black/20">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Activity Stream</h3>
              </div>
              <div className="space-y-4">
                {scores.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-sm border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${s.success ? 'bg-primary' : 'bg-destructive'}`} />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{s.userName}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">completed mission with score {s.score}</span>
                    </div>
                    <span className="text-[8px] text-muted-foreground opacity-50">{s.timestamp.toDate().toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex justify-end">
              <Button 
                onClick={handleExportCSV}
                variant="outline" 
                size="sm" 
                className="text-[10px] uppercase tracking-widest h-9 border-primary/20 text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
            </div>
            <div className="tech-card overflow-hidden border-primary/10 bg-black/20 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/60">
                      <th className="p-4 pl-8"><div className="flex items-center gap-2"><User className="w-3 h-3" /> Pilot</div></th>
                      <th className="p-4"><div className="flex items-center gap-2"><Trophy className="w-3 h-3" /> Score</div></th>
                      <th className="p-4"><div className="flex items-center gap-2"><Clock className="w-3 h-3" /> Time</div></th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Hints</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4 pr-8 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-primary/40 animate-pulse tracking-widest">RETRIEVING ENCRYPTED DATA...</td>
                      </tr>
                    ) : filteredScores.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-primary/40 tracking-widest">NO MISSION LOGS FOUND</td>
                      </tr>
                    ) : (
                      filteredScores.map((record, idx) => (
                        <motion.tr 
                          key={record.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-primary/5 hover:bg-primary/5 transition-colors group"
                        >
                          <td className="p-4 pl-8">
                            <div className="font-bold text-primary group-hover:text-primary-foreground transition-colors">{record.userName}</div>
                            <div className="text-[8px] text-muted-foreground opacity-50">{record.userId}</div>
                          </td>
                          <td className="p-4">
                            <span className="text-accent font-bold">{record.score}</span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {formatTime(record.timeTaken)}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-tighter ${
                              record.success ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                            }`}>
                              {record.success ? 'Success' : 'Failed'}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {record.hintsUsed}
                          </td>
                          <td className="p-4 text-muted-foreground opacity-60">
                            {record.timestamp?.toDate().toLocaleString()}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {deletingId === record.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setDeletingId(null)}
                                    className="text-[8px] uppercase tracking-widest h-7"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleDeleteLog(record.id)}
                                    className="text-[8px] uppercase tracking-widest h-7"
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setDeletingId(record.id)}
                                  className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div 
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="tech-card overflow-hidden border-primary/10 bg-black/20 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/20 bg-primary/5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/60">
                      <th className="p-4 pl-8"><div className="flex items-center gap-2"><User className="w-3 h-3" /> Pilot Profile</div></th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Role</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4 pr-8 text-right">Clearance Level</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-primary/40 animate-pulse tracking-widest">RETRIEVING PERSONNEL FILES...</td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-primary/40 tracking-widest">NO PERSONNEL FOUND</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => (
                        <motion.tr 
                          key={user.uid}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-primary/5 hover:bg-primary/5 transition-colors group"
                        >
                          <td className="p-4 pl-8">
                            <div className="font-bold text-primary group-hover:text-primary-foreground transition-colors">{user.displayName || 'Anonymous Pilot'}</div>
                            <div className="text-[8px] text-muted-foreground opacity-50">{user.uid}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-[2px] text-[9px] font-bold uppercase tracking-tighter ${
                              user.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground opacity-60">
                            {user.createdAt?.toDate().toLocaleDateString()}
                          </td>
                          <td className="p-4 pr-8 text-right">
                            {user.email === 'nikhilmanvi360@gmail.com' ? (
                              <span className="text-[8px] text-accent font-bold uppercase tracking-widest opacity-50">System Root</span>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleToggleRole(user)}
                                className={`text-[10px] uppercase tracking-widest h-8 ${
                                  user.role === 'admin' ? 'border-destructive/20 text-destructive hover:bg-destructive/10' : 'border-accent/20 text-accent hover:bg-accent/10'
                                }`}
                              >
                                {user.role === 'admin' ? (
                                  <><ShieldAlert className="w-3 h-3 mr-2" /> Demote</>
                                ) : (
                                  <><Shield className="w-3 h-3 mr-2" /> Promote</>
                                )}
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'live' && (
          <motion.div 
            key="live"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {users.filter(u => {
              if (!u.currentMission || !u.lastActive) return false;
              try {
                const lastActiveMillis = typeof u.lastActive.toMillis === 'function' 
                  ? u.lastActive.toMillis() 
                  : (u.lastActive as any).seconds * 1000;
                return (Date.now() - lastActiveMillis < 300000);
              } catch (e) {
                return false;
              }
            }).length === 0 ? (
              <div className="col-span-full py-20 text-center text-muted-foreground uppercase tracking-widest font-mono text-xs opacity-50">
                No Active Transmissions Detected
              </div>
            ) : (
              users.filter(u => {
                if (!u.currentMission || !u.lastActive) return false;
                try {
                  const lastActiveMillis = typeof u.lastActive.toMillis === 'function' 
                    ? u.lastActive.toMillis() 
                    : (u.lastActive as any).seconds * 1000;
                  return (Date.now() - lastActiveMillis < 300000);
                } catch (e) {
                  return false;
                }
              }).map(u => (
                <div key={u.uid} className="tech-card p-6 border-accent/20 bg-accent/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Radio className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-bold text-accent uppercase tracking-widest">{u.displayName}</h3>
                  </div>
                  <div className="space-y-3 font-mono text-[10px] uppercase tracking-widest">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="text-accent animate-pulse">LIVE</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sector:</span>
                      <span className="text-primary">Round {u.currentMission?.round}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Puzzle:</span>
                      <span className="text-primary">{u.currentMission?.question}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integrity:</span>
                      <span className="text-accent">{u.currentMission?.progress}%</span>
                    </div>
                    <div className="mt-4">
                      <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${u.currentMission?.progress}%` }} />
                      </div>
                    </div>
                    <div className="text-[8px] text-muted-foreground/40 text-right mt-2">
                      Last Signal: {new Date(typeof u.lastActive.toMillis === 'function' ? u.lastActive.toMillis() : (u.lastActive as any).seconds * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'manifest' && (
          <motion.div 
            key="manifest"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {GAME_DATA.map(round => (
              <div key={round.id} className="tech-card p-8 border-primary/10 bg-black/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-bold">{round.id}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-primary uppercase tracking-tighter italic">{round.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{round.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {round.questions.map(q => (
                    <div key={q.id} className="p-4 bg-white/5 rounded-sm border border-white/5 hover:border-primary/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{q.title}</span>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-tighter opacity-50">{q.type || 'text'}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{q.description}</p>
                      <div className="p-2 bg-black/40 rounded text-[9px] font-mono text-primary/60">
                        ANS: {q.correctAnswer || q.validAnswers?.join(" | ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
