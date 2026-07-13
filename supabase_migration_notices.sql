-- 전체 공지사항 게시판 (Supabase SQL Editor에서 1회 실행)
-- 공지 작성은 Supabase Table Editor에서 notices 테이블에 직접 행을 추가하면 됩니다 (meals 테이블과 동일한 방식).
--   title: 공지 제목
--   content: 공지 내용 (줄바꿈 그대로 표시됨)
--   is_pinned: true로 두면 메인 화면 상단에 배너로도 노출됩니다.
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notices are publicly readable" ON notices
  FOR SELECT USING (true);
