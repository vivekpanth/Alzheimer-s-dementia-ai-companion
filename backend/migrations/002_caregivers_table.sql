-- Migration: Create caregivers table for auth-linked caregiver accounts
-- Run this in the Supabase SQL editor

-- Caregivers table (1:1 with Supabase Auth users, 1:1 with patient)
create table if not exists caregivers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  full_name text not null,
  email text not null,
  patient_user_id text,            -- links to user_id in biography_chunks, sessions, etc.
  created_at timestamptz default now()
);

-- Enable RLS
alter table caregivers enable row level security;

-- RLS policies: users can only see/edit their own caregiver row
create policy "Users can read own caregiver profile"
  on caregivers for select
  using (auth.uid() = auth_user_id);

create policy "Users can insert own caregiver profile"
  on caregivers for insert
  with check (auth.uid() = auth_user_id);

create policy "Users can update own caregiver profile"
  on caregivers for update
  using (auth.uid() = auth_user_id);
