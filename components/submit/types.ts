/**
 * Types shared between the Submit page components.
 *
 * A SubmitItem is one row in the Submit form:
 *  - Holds the raw File, its extracted text / hash / fingerprint, and the
 *    metadata values (auto-detected or user-edited).
 *  - Tracks processing state so the UI can render spinners, warnings, and
 *    duplicate banners independently for each file in bulk mode.
 */
import type { DuplicateCheckResponse } from '@/types/directus';
import type { DetectedLanguage } from '@/lib/pdf/detect';

export type ProcessingState =
  | 'queued'
  | 'extracting'
  | 'hashing'
  | 'checking_duplicates'
  | 'ready'
  | 'duplicate_exact'
  | 'duplicate_fuzzy_pending'
  | 'submitting'
  | 'submitted'
  | 'error';

export interface SubmitItemMetadata {
  title: string;
  author: string;
  organization: string;
  date_published: string;
  abstract: string;
  language: DetectedLanguage | '';
  document_type: string;
  themes: string[];
  governorates: string[];
  keywords: string;
  auto: {
    title?: boolean;
    language?: boolean;
    year?: boolean;
  };
}

export interface SubmitItem {
  id: string;
  file: File;
  state: ProcessingState;
  error?: string;
  extractedText: string;
  file_hash: string;
  content_fingerprint: string;
  metadata: SubmitItemMetadata;
  duplicateCheck?: DuplicateCheckResponse;
  confirmedNotDuplicate: boolean;
}

export function emptyMetadata(): SubmitItemMetadata {
  return {
    title: '',
    author: '',
    organization: '',
    date_published: '',
    abstract: '',
    language: '',
    document_type: '',
    themes: [],
    governorates: [],
    keywords: '',
    auto: {},
  };
}
