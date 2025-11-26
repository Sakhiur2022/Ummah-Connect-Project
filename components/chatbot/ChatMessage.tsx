'use client';

// components/chatbot/ChatMessage.tsx
// Display component: Renders formatted analysis results with visual indicators

import { motion } from 'framer-motion';

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
      bg: 'bg-green-500/20',
      border: 'border-green-500/50',
      text: 'text-green-300',
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-300',
      label: 'Medium Risk',
    },
    high: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-300',
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
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Emotional Tone</h4>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emotion.emoji}</span>
          <div>
            <p className="text-lg font-semibold text-gray-200 capitalize">{emotion.name}</p>
            <p className="text-sm text-gray-400">
              Sentiment: <span className="capitalize">{result.sentiment}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Safety Scores */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
        <h4 className="text-sm font-semibold text-gray-400 mb-3">Safety Indicators</h4>
        
        <ScoreBar label="Toxicity" score={result.toxicity} />
        <ScoreBar label="Harassment" score={result.harassment} />
        <ScoreBar label="Manipulation" score={result.manipulation} />
      </div>

      {/* Distress Level */}
      <div className={`rounded-xl p-4 border ${distressStyle.bg} ${distressStyle.border}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-300">Distress Level</span>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${distressStyle.text}`}>
            {distressStyle.label}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
          <h4 className="text-sm font-semibold text-blue-300 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {result.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resources */}
      {result.resources.length > 0 && (
        <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
          <h4 className="text-sm font-semibold text-purple-300 mb-3">Support Resources</h4>
          <div className="space-y-2">
            {result.resources.map((resource, idx) => (
              <div key={idx} className="text-sm text-gray-300">
                <span className="font-medium">{resource.title}</span>
                {resource.phone && (
                  <span className="text-purple-300 ml-2">📞 {resource.phone}</span>
                )}
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 ml-2 underline"
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
function ScoreBar({ label, score }: { label: string; score: number }) {
  const percentage = Math.round(score * 100);
  const color = score > 0.7 ? 'bg-red-500' : score > 0.4 ? 'bg-orange-500' : 'bg-green-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400 font-mono">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
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
