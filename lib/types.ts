export type Topic = {
  id: number;
  slug: string;
  name_uz: string;
  name_en: string;
  intro_uz: string | null;
  intro_en: string | null;
  sort: number;
};

export type PublicAnswer = {
  id: number;
  question_id: number;
  lang: "uz" | "en";
  is_translation: boolean;
  title: string;
  question_text: string;
  short_answer: string;
  body: string;
  madhhab: string;
  author_id: string | null;
  reviewer_id: string | null;
  translator_id: string | null;
  views: number;
  published_at: string | null;
  topic_id: number | null;
  asked_at: string;
};

export type Byline = {
  id: string;
  full_name: string | null;
  role: string;
  title_uz: string | null;
  title_en: string | null;
  bio_uz: string | null;
  bio_en: string | null;
  credentials: string | null;
  is_public: boolean;
};

export type QStatus = "received" | "assigned" | "answering" | "in_review" | "answered" | "declined" | "duplicate";
