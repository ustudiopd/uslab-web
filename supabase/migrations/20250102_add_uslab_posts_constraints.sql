-- USLab 블로그 제약조건 추가
-- 마이그레이션 날짜: 2025-01-02
-- 목적: published_at/is_published 일관성 보장 및 canonical_id FK 삭제 정책 정의

-- 1. published_at/is_published 일관성 보장 (체크 제약조건)
alter table uslab_posts
  add constraint uslab_check_published_consistency
  check (
    (is_published = false AND published_at IS NULL) OR
    (is_published = true AND published_at IS NOT NULL)
  );

-- 2. published_at 자동 설정 트리거 (대안: 제약조건 대신 트리거 사용)
create or replace function uslab_set_published_at()
returns trigger as $$
begin
  if new.is_published = true AND new.published_at IS NULL then
    new.published_at = now();
  elsif new.is_published = false then
    new.published_at = NULL;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger uslab_trigger_set_published_at
  before insert or update on uslab_posts
  for each row
  execute function uslab_set_published_at();

-- 3. canonical_id FK 삭제 정책 변경 (SET NULL: 번역 보존)
alter table uslab_posts
  drop constraint if exists uslab_posts_canonical_id_fkey;

alter table uslab_posts
  add constraint uslab_posts_canonical_id_fkey
  foreign key (canonical_id)
  references uslab_posts(id)
  on delete set null;

-- 제약조건 확인 쿼리
-- select conname, contype, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'uslab_posts'::regclass;






