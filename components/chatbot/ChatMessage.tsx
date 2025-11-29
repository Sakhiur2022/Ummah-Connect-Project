'use client';

// components/chatbot/ChatMessage.tsx
// Display component: Renders formatted analysis results with visual indicators

import { motion } from 'framer-motion';
import { useThemeSafe } from '@/lib/use-theme-safe';

interface AnalysisResult {
  emotion?: { [emotionName: string]: number };
  sentiment?: 'positive' | 'neutral' | 'negative';
  toxicity: number;
  harassment: number;
  manipulation: number;
  distress_level: 'low' | 'medium' | 'high';
  recommendations: string[];
  resources: { title: string; url?: string; phone?: string }[];
}

interface ChatMessageProps {
  result: AnalysisResult;
}

export default function ChatMessage({ result }: ChatMessageProps) {
  const { theme } = useThemeSafe();
  
  // Get dominant emotion
  const getDominantEmotion = () => {
    if (!result.emotion) return { name: 'neutral', emoji: '😐', score: 0 };
    
    const entries = Object.entries(result.emotion);
    if (entries.length === 0) return { name: 'neutral', emoji: '😐', score: 0 };
    
    const [name, score] = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    
    const emojiMap: { [key: string]: string } = {
      joy: '😊',
      sadness: '😢',
      anger: '😠',
      fear: '😰',
      surprise: '😲',
      neutral: '😐',
    };
    
    return { name, emoji: emojiMap[name] || '😐', score };
  };

  const emotion = getDominantEmotion();

  // Distress level styling
  const distressStyles = {
    low: {
      bg: theme === 'light' ? 'bg-green-100' : 'bg-green-500/20',
      border: theme === 'light' ? 'border-green-300' : 'border-green-500/50',
      text: theme === 'light' ? 'text-green-700' : 'text-green-300',
      label: 'Low Risk',
    },
    medium: {
      bg: theme === 'light' ? 'bg-orange-100' : 'bg-orange-500/20',
      border: theme === 'light' ? 'border-orange-300' : 'border-orange-500/50',
      text: theme === 'light' ? 'text-orange-700' : 'text-orange-300',
      label: 'Medium Risk',
    },
    high: {
      bg: theme === 'light' ? 'bg-red-100' : 'bg-red-500/20',
      border: theme === 'light' ? 'border-red-300' : 'border-red-500/50',
      text: theme === 'light' ? 'text-red-700' : 'text-red-300',
      label: 'High Risk',
    },
  };

  const distressStyle = distressStyles[result.distress_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Emotion & Sentiment */}
      <div className={`rounded-xl p-4 border ${
        theme === 'light' 
          ? 'bg-amber-50 border-amber-200' 
          : 'bg-slate-800/50 border-slate-700'
      }`}>
        <h4 className={`text-sm font-semibold mb-3 ${
          theme === 'light' ? 'text-amber-900' : 'text-gray-400'
        }`}>Emotional Tone</h4>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emotion.emoji}</span>
          <div>
            <p className={`text-lg font-semibold capitalize ${
              theme === 'light' ? 'text-amber-950' : 'text-gray-200'
            }`}>{emotion.name}</p>
            <p className={`text-sm ${
              theme === 'light' ? 'text-amber-800' : 'text-gray-400'
            }`}>
              Sentiment: <span className="capitalize">{result.sentiment}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Safety Scores */}
      <div className={`rounded-xl p-4 border space-y-3 ${
        theme === 'light'
          ? 'bg-amber-50 border-amber-200'
          : 'bg-slate-800/50 border-slate-700'
      }`}>
        <h4 className={`text-sm font-semibold mb-3 ${
          theme === 'light' ? 'text-amber-900' : 'text-gray-400'
        }`}>Safety Indicators</h4>
        
        <ScoreBar label="Toxicity" score={result.toxicity} theme={theme} />
        <ScoreBar label="Harassment" score={result.harassment} theme={theme} />
        <ScoreBar label="Manipulation" score={result.manipulation} theme={theme} />
      </div>

      {/* Distress Level */}
      <div className={`rounded-xl p-4 border ${distressStyle.bg} ${distressStyle.border}`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-semibold ${
            theme === 'light' ? 'text-slate-700' : 'text-gray-300'
          }`}>Distress Level</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${distressStyle.text}`}>
            {distressStyle.label}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className={`rounded-xl p-4 border ${
          theme === 'light'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-blue-500/10 border-blue-500/30'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 ${
            theme === 'light' ? 'text-blue-900' : 'text-blue-300'
          }`}>Recommendations</h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className={`text-sm flex items-start gap-2 ${
                theme === 'light' ? 'text-slate-700' : 'text-gray-300'
              }`}>
                <span className={theme === 'light' ? 'text-blue-600' : 'text-blue-400'} style={{marginTop: '4px'}}>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {result.resources.length > 0 && (
        <div className={`rounded-xl p-4 border ${
          theme === 'light'
            ? 'bg-purple-50 border-purple-200'
            : 'bg-purple-500/10 border-purple-500/30'
        }`}>
          <h4 className={`text-sm font-semibold mb-3 ${
            theme === 'light' ? 'text-purple-900' : 'text-purple-300'
          }`}>Support Resources</h4>
          <div className="space-y-2">
            {result.resources.map((resource, idx) => (
              <div key={idx} className={`text-sm ${
                theme === 'light' ? 'text-slate-700' : 'text-gray-300'
              }`}>
                <span className="font-medium">{resource.title}</span>
                {resource.phone && (
                  <span className={`ml-2 ${theme === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>📞 {resource.phone}</span>
                )}
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`ml-2 underline ${
                      theme === 'light'
                        ? 'text-blue-600 hover:text-blue-700'
                        : 'text-blue-400 hover:text-blue-300'
                    }`}
                  >
                    Visit
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Helper component for score visualization
function ScoreBar({ label, score, theme }: { label: string; score: number; theme: string }) {
  const percentage = Math.round(score * 100);
  const color = score > 0.7 ? 'bg-red-500' : score > 0.4 ? 'bg-orange-500' : 'bg-green-500';
  const bgColor = theme === 'light' ? 'bg-gray-200' : 'bg-slate-700';
  const textColor = theme === 'light' ? 'text-slate-700' : 'text-gray-300';

  return (
    <div>
      <div className={`flex justify-between text-sm mb-1 ${textColor}`}>
        <span>{label}</span>
        <span className="font-mono">{percentage}%</span>
      </div>
      <div className={`w-full ${bgColor} rounded-full h-2 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
