export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  TECHNICAL = 'Technical',
  FUNNY = 'Funny',
  INSPIRATIONAL = 'Inspirational',
}

export interface BlogAgentRequest {
  session_id: string;
  content: string;
  target_audience: string;
  tone: string;
  word_count: number;
  include_seo: boolean;
  is_hackernews: boolean;
  is_duckduckgo: boolean;
  feedback: string;
}

export interface BlogContent {
  title: string;
  subtitle: string;
  meta_description: string;
  introduction: string;
  headings: string[];
  content: string;
  conclusion: string;
  tags: string[];
  keywords: string[];
  reading_time: string;
  call_to_action: string;
}

export interface BlogAgentResponse {
  blog_content: BlogContent;
  traceId: string;
  generated_at: string;
}