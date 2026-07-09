-- Course Booking & LMS Platform Supabase Schema

-- =======================================================
-- DESTRUCTION & RESET COMMANDS
-- Run this section to completely reset all tables from scratch
-- =======================================================
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_enrollment_completed on public.enrollments;
drop trigger if exists on_redemption_approved on public.redemptions;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_payment_completion() cascade;
drop function if exists public.handle_redemption_approval() cascade;

drop table if exists public.redemptions cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.batches cascade;
drop table if exists public.courses cascade;
drop table if exists public.wallets cascade;
drop table if exists public.profiles cascade;
drop table if exists public.team_meetings cascade;

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null check (role in ('student', 'mentor', 'admin', 'core')) default 'student',
  dob date,
  contact_number text,
  specialization text, -- Only for mentors
  referral_code text unique, -- Only for students, generated on registration
  referred_by_id uuid references public.profiles(id) on delete set null, -- The student who referred this user
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'approved',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Wallets Table for Students
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null unique,
  balance numeric(10,2) not null default 0.00 check (balance >= 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Courses Table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration text not null default '1 Month',
  class_count integer not null default 12,
  days_of_week text[] not null, -- Array of days (e.g. ['Monday', 'Tuesday'])
  timings text not null, -- e.g. '6:00 PM - 7:30 PM'
  fees numeric(10,2) not null check (fees >= 0), -- Stored in INR (Rupees)
  qr_code_url text, -- Admin uploads or pastes UPI ID / QR Image URL for payment
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Batches Table for Courses
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  name text not null, -- e.g. 'Batch 1'
  mentor_id uuid references public.profiles(id) on delete set null, -- Assigned mentor
  google_meet_link text,
  start_date date not null default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Enrollments Table
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  batch_id uuid references public.batches(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  payment_status text not null check (payment_status in ('pending', 'completed', 'failed')) default 'pending', -- Students start as pending until verified
  payment_method text not null default 'QR Code',
  amount_paid numeric(10,2) not null check (amount_paid >= 0), -- INR
  transaction_id text, -- Students submit GPay/PhonePe transaction reference
  referred_by_id uuid references public.profiles(id) on delete set null, -- Tracks who referred this booking
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (student_id, batch_id)
);

-- Create Redemptions Table
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(10,2) not null check (amount > 0),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  payment_phone text not null, -- Students submit GPay/PhonePe linked mobile number
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.enrollments enable row level security;
alter table public.redemptions enable row level security;

-- Permissive policies for prototype convenience
create policy "Allow read access to profiles" on public.profiles for select using (true);
create policy "Allow all access to profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all access to wallets" on public.wallets for all using (true) with check (true);
create policy "Allow all access to courses" on public.courses for all using (true) with check (true);
create policy "Allow all access to batches" on public.batches for all using (true) with check (true);
create policy "Allow all access to enrollments" on public.enrollments for all using (true) with check (true);
create policy "Allow all access to redemptions" on public.redemptions for all using (true) with check (true);

-- -- TRIGGER: Create profile and wallet on signup (applies to student and core members)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_code text;
  ref_by_id uuid;
  role_val text;
begin
  role_val := coalesce(new.raw_user_meta_data->>'role', 'student');
  
  if role_val = 'student' or role_val = 'core' then
    ref_code := 'REF-' || upper(substring(replace(new.id::text, '-', '') from 1 for 8));
    if new.raw_user_meta_data->>'referred_by_code' is not null then
      select id into ref_by_id from public.profiles where referral_code = new.raw_user_meta_data->>'referred_by_code';
    end if;
  end if;

  insert into public.profiles (id, name, email, role, dob, contact_number, specialization, referral_code, referred_by_id, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    role_val,
    case when new.raw_user_meta_data->>'dob' is not null then (new.raw_user_meta_data->>'dob')::date else null end,
    new.raw_user_meta_data->>'contact_number',
    new.raw_user_meta_data->>'specialization',
    ref_code,
    ref_by_id,
    case when role_val = 'core' then 'pending' else 'approved' end
  );

  if role_val = 'student' or role_val = 'core' then
    insert into public.wallets (student_id, balance)
    values (new.id, 0.00);
  end if;

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: Crediting Wallet on Enrollment Completion (verified by admin)
-- 1. Student: 12.5% cashback, capped at 50% of cumulative paid course fees
-- 2. Core Member: 10% cashback, limitless wallet
create or replace function public.handle_payment_completion()
returns trigger as $$
declare
  ref_profile record;
  ref_wallet record;
  total_paid numeric(10,2) := 0.00;
  max_limit numeric(10,2) := 0.00;
  total_redeemed numeric(10,2) := 0.00;
  total_earned numeric(10,2) := 0.00;
  reward numeric(10,2) := 0.00;
begin
  if (TG_OP = 'UPDATE' and new.payment_status = 'completed' and old.payment_status = 'pending') then
    if new.referred_by_id is not null then
      -- Get referrer profile
      select * into ref_profile from public.profiles where id = new.referred_by_id;
      
      if ref_profile is not null then
        -- Get referrer wallet
        select * into ref_wallet from public.wallets where student_id = new.referred_by_id;
        if ref_wallet is null then
          insert into public.wallets (student_id, balance)
          values (new.referred_by_id, 0.00)
          returning * into ref_wallet;
        end if;

        if ref_profile.role = 'core' then
          -- Core Member: Limitless 10%
          reward := new.amount_paid * 0.10;
          update public.wallets
          set balance = balance + reward
          where student_id = new.referred_by_id;
          
        elsif ref_profile.role = 'student' then
          -- Student: 12.5% capped at 50% cumulative paid fees
          reward := new.amount_paid * 0.125;
          
          -- Sum of course fees student paid for (completed enrollments)
          select coalesce(sum(amount_paid), 0.00) into total_paid
          from public.enrollments
          where student_id = new.referred_by_id and payment_status = 'completed';
          
          max_limit := total_paid * 0.50;
          
          -- Sum of approved cashouts
          select coalesce(sum(amount), 0.00) into total_redeemed
          from public.redemptions
          where student_id = new.referred_by_id and status = 'approved';
          
          total_earned := ref_wallet.balance + total_redeemed;
          
          if total_earned < max_limit then
            if total_earned + reward > max_limit then
              reward := max_limit - total_earned;
            end if;
            
            update public.wallets
            set balance = balance + reward
            where student_id = new.referred_by_id;
          end if;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_enrollment_completed
  after update on public.enrollments
  for each row execute procedure public.handle_payment_completion();

-- TRIGGER: Zero out wallet balance when redemption is approved
create or replace function public.handle_redemption_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status = 'pending' then
    update public.wallets
    set balance = 0.00
    where student_id = new.student_id;
    new.processed_at = now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_redemption_approved
  before update on public.redemptions
  for each row execute procedure public.handle_redemption_approval();

-- Seed default courses in INR (Rupees)
insert into public.courses (id, name, description, duration, class_count, days_of_week, timings, fees, qr_code_url)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Full-Stack Web Development', 'Master Next.js, React, Node.js, and SQL databases.', '1 Month', 16, ARRAY['Monday', 'Wednesday', 'Friday'], '6:00 PM - 8:00 PM', 9999.00, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=9999%26cu=INR'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'UI/UX Design Mastery', 'Learn Figma wireframing, prototyping, and interaction design.', '1 Month', 12, ARRAY['Tuesday', 'Thursday'], '7:00 PM - 9:00 PM', 5999.00, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=5999%26cu=INR'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Data Science & Machine Learning', 'Dive into Python, Pandas, Scikit-Learn, and Neural Networks.', '1 Month', 20, ARRAY['Monday', 'Tuesday', 'Thursday', 'Friday'], '5:00 PM - 7:00 PM', 12999.00, 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=univision@ybl%26pn=Univision%2520Counsel%26am=12999%26cu=INR')
on conflict do nothing;

-- Seed default batches
insert into public.batches (course_id, name, google_meet_link, start_date)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Batch Alpha', 'https://meet.google.com/abc-defg-hij', current_date),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Batch Beta', 'https://meet.google.com/xyz-uvwx-yza', current_date + 7),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'UI Batch 1', 'https://meet.google.com/fig-ma12-des', current_date)
on conflict do nothing;

-- Create Team Meetings Table
create table public.team_meetings (
  team_name text primary key,
  google_meet_link text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS and create policies for team_meetings
alter table public.team_meetings enable row level security;
create policy "Allow all access to team_meetings" on public.team_meetings for all using (true) with check (true);

-- Seed default teams
insert into public.team_meetings (team_name, google_meet_link)
values 
  ('PR Team', null),
  ('Marketing Team', null),
  ('Course Validation Team', null)
on conflict do nothing;

-- =======================================================
-- REFERRAL ANTI-FRAUD & INTEGRITY ENGINE
-- =======================================================

-- Referral validation helper (Strategy A & Strategy C check)
create or replace function public.validate_referral(p_referrer_id uuid, p_referee_id uuid)
returns boolean as $$
declare
  curr_id uuid;
  referrer_created timestamp with time zone;
  referee_created timestamp with time zone;
begin
  if p_referrer_id = p_referee_id then
    return false;
  end if;

  select created_at into referrer_created from public.profiles where id = p_referrer_id;
  select created_at into referee_created from public.profiles where id = p_referee_id;
  
  if referrer_created is not null and referee_created is not null then
    if referrer_created >= referee_created then
      return false;
    end if;
  end if;

  curr_id := p_referrer_id;
  while curr_id is not null loop
    if curr_id = p_referee_id then
      return false; -- Cycle detected!
    end if;
    select referred_by_id into curr_id from public.profiles where id = curr_id;
  end loop;

  return true;
end;
$$ language plpgsql;

-- Check trigger for profiles table
create or replace function public.check_profiles_referral()
returns trigger as $$
begin
  if new.referred_by_id is not null then
    if not public.validate_referral(new.referred_by_id, new.id) then
      raise exception 'Invalid referral link: violates chronological order or forms a cycle';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_profiles_referral_trg on public.profiles;
create trigger check_profiles_referral_trg
  before insert or update on public.profiles
  for each row execute procedure public.check_profiles_referral();

-- Check trigger for enrollments table (Strategy B check)
create or replace function public.check_enrollments_referral()
returns trigger as $$
declare
  completed_count integer;
begin
  if new.referred_by_id is not null then
    select count(*) into completed_count
    from public.enrollments
    where student_id = new.student_id and payment_status = 'completed';

    if completed_count > 0 then
      raise exception 'Referral reward is locked to first-time buyers only';
    end if;

    if not public.validate_referral(new.referred_by_id, new.student_id) then
      raise exception 'Invalid referral on enrollment: violates chronological order or forms a cycle';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists check_enrollments_referral_trg on public.enrollments;
create trigger check_enrollments_referral_trg
  before insert or update on public.enrollments
  for each row execute procedure public.check_enrollments_referral();
