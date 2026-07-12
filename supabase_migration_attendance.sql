-- 출석 이벤트를 위한 컬럼 추가 (Supabase SQL Editor에서 1회 실행)
ALTER TABLE game_profiles
  ADD COLUMN IF NOT EXISTS last_attendance_date text,
  ADD COLUMN IF NOT EXISTS attendance_streak integer DEFAULT 0;
