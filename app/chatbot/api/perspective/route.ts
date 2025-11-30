// app/chatbot/api/perspective/route.ts
// Server API route: Handles Perspective API calls with rate limiting and timeout

import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (TODO: Replace with Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

// Manipulation detection keywords (heuristic approach)
const MANIPULATION_KEYWORDS = [
  'you\'re crazy',
  'you\'re overreacting',
  'no one else',
  'if you cared you would',
  'you\'re too sensitive',
  'you\'re imagining',
  'that never happened',
  'you\'re being dramatic',
];

interface PerspectiveResponse {
  attributeScores: {
    [key: string]: {
      summaryScore: { value: number };
    };
  };
}

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

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function calculateManipulation(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

    // Loop through every keyword in the manipulation keyword list
  MANIPULATION_KEYWORDS.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = lower.match(regex);      // Find all matches of the keyword in the text

    if (matches) {
      score += matches.length * 0.1;  // Add 0.1 per occurrence
    }
  });

  return Math.min(score, 1.0);
}


function calculateDistressLevel(
  toxicity: number,
  harassment: number,
  manipulation: number,
  emotion?: { [key: string]: number }
): 'low' | 'medium' | 'high' {
  // High distress conditions
  if (toxicity >= 0.8 || manipulation >= 0.6 || harassment >= 0.5) {
    return 'high';
  }

  // Check for negative emotions
  const hasSadnessOrFear = emotion && 
    ((emotion.sadness && emotion.sadness >= 0.5) || 
     (emotion.fear && emotion.fear >= 0.5));

  // Medium distress conditions
  if (
    toxicity >= 0.5 ||
    manipulation >= 0.4 ||
    harassment >= 0.3 ||
    hasSadnessOrFear
  ) {
    return 'medium';
  }

  return 'low';
}

function getRecommendations(distressLevel: 'low' | 'medium' | 'high'): string[] {
  if (distressLevel === 'high') {
    return [
      'This content shows high distress indicators. Consider reaching out to a trusted friend or counselor.',
      'If you\'re experiencing emotional distress, professional support can help.',
      'Take breaks from distressing conversations and prioritize your wellbeing.',
    ];
  }

  if (distressLevel === 'medium') {
    return [
      'This content has some concerning elements. Be mindful of your emotional response.',
      'Consider discussing these concerns with someone you trust.',
      'Set boundaries in conversations that feel uncomfortable.',
    ];
  }

  return [
    'This content appears relatively safe, but trust your instincts.',
    'Maintain healthy communication boundaries.',
  ];
}

function getResources() {
  return [
    { title: 'Bangladesh National Helpline', phone: '109' },
    { title: 'Emergency Services', phone: '999' },
    { 
      title: 'DU Counselling Centre', 
      url: 'https://www.du.ac.bd/body/Counselling_Centre',
    },
    { 
      title: 'Naripokkho (Women\'s Rights)', 
      phone: '+880-2-9669130',
      url: 'http://www.naripokkho.org',
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    if (text.length < 6) {
      return NextResponse.json(
        { error: 'Text must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Call Perspective API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

    console.log('Calling Perspective API...');
    
    const perspectiveResponse = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=AIzaSyDrrN-ZOg5nk0pmsm7oAKH_hBkGM33RSIs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: { text },
          languages: ["en"],
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            INSULT: {},
            THREAT: {},
            PROFANITY: {},
            IDENTITY_ATTACK: {},
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    
    console.log('Perspective API response status:', perspectiveResponse.status);

    if (!perspectiveResponse.ok) {
      const errorText = await perspectiveResponse.text();
      console.error('Perspective API error response:', errorText);
      throw new Error(`Perspective API error: ${perspectiveResponse.status} - ${errorText}`);
    }

    const data: PerspectiveResponse = await perspectiveResponse.json();

    // Extract scores
    const toxicity = data.attributeScores.TOXICITY?.summaryScore.value || 0;
    const harassment = Math.max(
      data.attributeScores.INSULT?.summaryScore.value || 0,
      data.attributeScores.THREAT?.summaryScore.value || 0,
      data.attributeScores.IDENTITY_ATTACK?.summaryScore.value || 0,
      data.attributeScores.SEVERE_TOXICITY?.summaryScore.value || 0
    );

    // Calculate manipulation score (heuristic)
    const manipulation = calculateManipulation(text);

    // Simple emotion detection (basic heuristic - can be replaced with HuggingFace model)
    // TODO: Replace with HuggingFace emotion classification API call
    const emotion = {
      neutral: 0.6,
      // Add actual emotion detection here
    };

    // Calculate distress level
    const distress_level = calculateDistressLevel(
      toxicity,
      harassment,
      manipulation,
      emotion
    );

    // Build response
    const result: AnalysisResult = {
      emotion,
      sentiment: toxicity > 0.5 ? 'negative' : toxicity > 0.2 ? 'neutral' : 'positive',
      toxicity,
      harassment,
      manipulation,
      distress_level,
      recommendations: getRecommendations(distress_level),
      resources: getResources(),
    };

    return NextResponse.json(result);

  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout. Please try again.' },
        { status: 504 }
      );
    }

    console.error('Perspective API error:', error.message || error);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: `Failed to analyze text: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/* 
Example successful response:
{
  "emotion": { "neutral": 0.6 },
  "sentiment": "positive",
  "toxicity": 0.12,
  "harassment": 0.05,
  "manipulation": 0.0,
  "distress_level": "low",
  "recommendations": ["This content appears relatively safe..."],
  "resources": [{ "title": "Bangladesh National Helpline", "phone": "109" }]
}
*/
