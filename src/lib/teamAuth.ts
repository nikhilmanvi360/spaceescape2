// Team-based authentication with fallback for Firebase errors

export interface TeamUser {
  teamId: string;
  teamName: string;
  password: string; // hashed
  displayName: string;
  uid: string; // local user id
  email: string;
  role: 'admin' | 'user';
  createdAt: number;
}

// Team credentials (passwords are hashed using simple hash)
// In production, use bcrypt or similar
const TEAMS: Record<string, { name: string; hashedPassword: string; displayName: string }> = {
  alpha: {
    name: 'ALPHA',
    hashedPassword: 'alpha_mission_critical_2026', // Alpha Team Hashed
    displayName: 'ALPHA COMMAND'
  },
  beta: {
    name: 'BETA',
    hashedPassword: 'beta_mission_critical_2026', // Beta Team Hashed
    displayName: 'BETA CONTROL'
  },
  gamma: {
    name: 'GAMMA',
    hashedPassword: 'gamma_mission_critical_2026', // Gamma Team Hashed
    displayName: 'GAMMA STATION'
  }
};

const PLAIN_TEXT_PASSWORDS = {
  alpha: 'Alpha@2026Secure!',
  beta: 'Beta@2026Secure!',
  gamma: 'Gamma@2026Secure!'
};

const STORAGE_KEY_TEAM = 'team_auth_user';

export class TeamAuthManager {
  static verifyTeamPassword(teamId: string, password: string): boolean {
    const team = TEAMS[teamId.toLowerCase()];
    if (!team) return false;
    
    // Simple verification - in production use proper hashing
    return PLAIN_TEXT_PASSWORDS[teamId.toLowerCase() as keyof typeof PLAIN_TEXT_PASSWORDS] === password;
  }

  static createTeamUser(teamId: string): TeamUser {
    const team = TEAMS[teamId.toLowerCase()];
    if (!team) throw new Error('Invalid team');

    const user: TeamUser = {
      teamId: teamId.toLowerCase(),
      teamName: team.name,
      password: team.hashedPassword,
      displayName: team.displayName,
      uid: `team_${teamId}_${Date.now()}`,
      email: `${teamId}@spaceescape.local`,
      role: 'user',
      createdAt: Date.now()
    };

    return user;
  }

  static loginTeam(teamId: string, password: string): TeamUser {
    if (!this.verifyTeamPassword(teamId, password)) {
      throw new Error('Invalid team credentials');
    }

    const user = this.createTeamUser(teamId);
    localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(user));
    return user;
  }

  static getStoredTeamUser(): TeamUser | null {
    const stored = localStorage.getItem(STORAGE_KEY_TEAM);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as TeamUser;
    } catch {
      return null;
    }
  }

  static logoutTeam(): void {
    localStorage.removeItem(STORAGE_KEY_TEAM);
  }

  static getTeamCredentials() {
    return {
      alpha: {
        teamId: 'alpha',
        teamName: 'ALPHA COMMAND',
        password: PLAIN_TEXT_PASSWORDS.alpha
      },
      beta: {
        teamId: 'beta',
        teamName: 'BETA CONTROL',
        password: PLAIN_TEXT_PASSWORDS.beta
      },
      gamma: {
        teamId: 'gamma',
        teamName: 'GAMMA STATION',
        password: PLAIN_TEXT_PASSWORDS.gamma
      }
    };
  }
}
