-- German/Italian Learner Research prototype schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'abandoned')),
  language text not null default 'de'
    check (language in ('de', 'it')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_seconds integer,
  generated_summary jsonb,
  provider text
);

create table if not exists public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  role text not null check (role in ('interviewer', 'participant')),
  text text not null,
  created_at timestamptz not null default now(),
  question_category text,
  is_followup boolean not null default false,
  audio_ref text,
  provider text
);

create index if not exists idx_messages_interview
  on public.interview_messages (interview_id, created_at);

create index if not exists idx_interviews_started
  on public.interviews (started_at desc);
