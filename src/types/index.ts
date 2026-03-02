export interface Lead {
  id: string;
  full_name: string;
  company_name?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  email_content?: string | null;
  campaign_name?: string | null;
  status: 'sent' | 'pending' | 'failed' | 'replied';
  sent_at?: string | null;
  created_at: string;
}

export interface EmailStats {
  id: string;
  total_sent: number;
  sent_today: number;
  sent_this_week: number;
  last_sent_at?: string | null;
  updated_at: string;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
