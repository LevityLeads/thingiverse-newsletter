export interface Creator {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  tagline: string;
  avatarPath: string | null;
  designs: Design[];
}

export interface Design {
  id: number;
  name: string;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  imagePath: string | null;
}

export interface Thing {
  id: number;
  name: string;
  description: string;
  likeCount: number;
  collectCount: number;
  commentCount: number;
  imagePath: string | null;
  secondaryImages: string[];
  creator: {
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface Banner {
  name: string;
  imageUrl: string;
  linkUrl: string;
  description: string;
  active: boolean;
}

export type NewsletterType = 'creator-spotlight' | 'the-build';

export interface SingleSend {
  id: string;
  name: string;
  status: string;
  send_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SendStats {
  delivered: number;
  opens: number;
  unique_opens: number;
  clicks: number;
  unique_clicks: number;
  bounces: number;
  spam_reports: number;
  unsubscribes: number;
  requests: number;
}
