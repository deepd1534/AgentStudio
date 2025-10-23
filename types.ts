export enum Tone {
  PROFESSIONAL = 'Professional',
  CASUAL = 'Casual',
  TECHNICAL = 'Technical',
  FUNNY = 'Funny',
  INSPIRATIONAL = 'Inspirational',
}

export enum Audience {
  GENERAL = 'General Public',
  DEVELOPERS = 'Developers',
  MARKETERS = 'Marketers',
  STUDENTS = 'Students',
  ENTREPRENEURS = 'Entrepreneurs',
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
  is_google_search: boolean;
  url_context?: string[];
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

export enum BlogStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  IN_REVIEW = 'In Review',
}

export interface SavedBlog {
  id: string;
  title: string;
  lastEdited: string;
  summary: string;
  status: BlogStatus;
}

// Chat Types
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isStreaming?: boolean;
  attachments?: Attachment[];
  agent?: Agent;

  // For regeneration and response versioning
  userMessageId?: string; // Links a bot message to the user message it's responding to
  versions?: {
    text: string;
    attachments?: Attachment[];
  }[];
  activeVersionIndex?: number;
}

export interface Attachment {
  id:string;
  file: File;
  previewUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
}