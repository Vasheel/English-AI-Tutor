export interface UserProgress {
  grammarScore: number;
  grammarAttempts: number;
  wordScrambleScore: number;
  wordScrambleAttempts: number;
  sentenceBuilderScore: number;
  sentenceBuilderAttempts: number;
  totalTimeSpent: number; // in minutes
  lastActivity: string;
  achievements: string[];
  strengths: string[];
  areasToImprove: string[];
}

export interface ActivitySession {
  activity: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  date: string;
}

const STORAGE_KEY = 'english_tutor_progress';
const SESSIONS_KEY = 'english_tutor_sessions';

export const getProgress = (): UserProgress => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    grammarScore: 0,
    grammarAttempts: 0,
    wordScrambleScore: 0,
    wordScrambleAttempts: 0,
    sentenceBuilderScore: 0,
    sentenceBuilderAttempts: 0,
    totalTimeSpent: 0,
    lastActivity: new Date().toISOString(),
    achievements: [],
    strengths: [],
    areasToImprove: []
  };
};

export const updateProgress = (updates: Partial<UserProgress>) => {
  const current = getProgress();
  const updated = { 
    ...current, 
    ...updates, 
    lastActivity: new Date().toISOString() 
  };
  
  // Calculate achievements
  updated.achievements = calculateAchievements(updated);
  
  // Analyze strengths and areas to improve
  const analysis = analyzePerformance(updated);
  updated.strengths = analysis.strengths;
  updated.areasToImprove = analysis.areasToImprove;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const addSession = (session: ActivitySession) => {
  const sessions = getSessions();
  sessions.push(session);
  
  // Keep only last 50 sessions
  if (sessions.length > 50) {
    sessions.splice(0, sessions.length - 50);
  }
  
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const getSessions = (): ActivitySession[] => {
  const stored = localStorage.getItem(SESSIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const calculateAchievements = (progress: UserProgress): string[] => {
  const achievements: string[] = [];
  
  // Grammar achievements
  if (progress.grammarAttempts >= 1 && !achievements.includes('First Grammar Check')) {
    achievements.push('First Grammar Check');
  }
  if (progress.grammarScore >= 5 && !achievements.includes('Grammar Novice')) {
    achievements.push('Grammar Novice');
  }
  if (progress.grammarScore >= 20 && !achievements.includes('Grammar Expert')) {
    achievements.push('Grammar Expert');
  }
  
  // Word Scramble achievements
  if (progress.wordScrambleAttempts >= 1 && !achievements.includes('Word Unscrambler')) {
    achievements.push('Word Unscrambler');
  }
  if (progress.wordScrambleScore >= 10 && !achievements.includes('Scramble Master')) {
    achievements.push('Scramble Master');
  }
  
  // Sentence Builder achievements
  if (progress.sentenceBuilderAttempts >= 1 && !achievements.includes('Sentence Architect')) {
    achievements.push('Sentence Architect');
  }
  if (progress.sentenceBuilderScore >= 10 && !achievements.includes('Sentence Master')) {
    achievements.push('Sentence Master');
  }
  
  // Time-based achievements
  if (progress.totalTimeSpent >= 30 && !achievements.includes('Dedicated Learner')) {
    achievements.push('Dedicated Learner');
  }
  if (progress.totalTimeSpent >= 120 && !achievements.includes('Study Champion')) {
    achievements.push('Study Champion');
  }
  
  return achievements;
};

const analyzePerformance = (progress: UserProgress) => {
  const strengths: string[] = [];
  const areasToImprove: string[] = [];
  
  // Grammar analysis
  const grammarAccuracy = progress.grammarAttempts > 0 ? 
    (progress.grammarScore / progress.grammarAttempts) * 100 : 0;
  
  if (grammarAccuracy >= 80) {
    strengths.push('Grammar Correction');
  } else if (grammarAccuracy < 60 && progress.grammarAttempts >= 5) {
    areasToImprove.push('Grammar Rules');
  }
  
  // Word Scramble analysis
  const scrambleAccuracy = progress.wordScrambleAttempts > 0 ? 
    (progress.wordScrambleScore / progress.wordScrambleAttempts) * 100 : 0;
  
  if (scrambleAccuracy >= 80) {
    strengths.push('Spelling & Vocabulary');
  } else if (scrambleAccuracy < 60 && progress.wordScrambleAttempts >= 5) {
    areasToImprove.push('Vocabulary Building');
  }
  
  // Sentence Builder analysis
  const sentenceAccuracy = progress.sentenceBuilderAttempts > 0 ? 
    (progress.sentenceBuilderScore / progress.sentenceBuilderAttempts) * 100 : 0;
  
  if (sentenceAccuracy >= 80) {
    strengths.push('Sentence Structure');
  } else if (sentenceAccuracy < 60 && progress.sentenceBuilderAttempts >= 5) {
    areasToImprove.push('Sentence Formation');
  }
  
  return { strengths, areasToImprove };
};

export const getEncouragingMessage = (progress: UserProgress): string => {
  const messages = [
    "You're doing great! Keep practicing!",
    "Every mistake is a step toward improvement!",
    "Your English skills are getting stronger!",
    "Practice makes perfect - you're on the right track!",
    "Great job staying committed to learning!",
    "You're building excellent language skills!",
    "Keep up the fantastic work!",
    "Your progress is inspiring!",
    "Learning is a journey - you're moving forward!",
    "You're becoming a better writer every day!"
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};
