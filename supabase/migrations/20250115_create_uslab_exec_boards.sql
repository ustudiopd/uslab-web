-- 운영진 보드(Executive Board) 시스템 마이그레이션
-- 마이그레이션 날짜: 2025-01-15

-- 1. uslab_admins 테이블 (운영진 화이트리스트)
create table if not exists uslab_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 운영진 판별 함수
create or replace function uslab_is_admin()
returns boolean as $$
  select exists (
    select 1 from uslab_admins a where a.user_id = auth.uid()
  );
$$ language sql stable;

-- 2. uslab_exec_boards 테이블 (보드)
create table uslab_exec_boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index uslab_idx_exec_boards_sort on uslab_exec_boards(sort_order asc, created_at asc);

-- 3. uslab_exec_docs 테이블 (문서)
create table uslab_exec_docs (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references uslab_exec_boards(id) on delete cascade,

  title text not null,
  content jsonb not null default '{}'::jsonb,

  -- ordering
  priority numeric not null default 0,

  -- soft delete
  is_trashed boolean not null default false,
  trashed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

create index uslab_idx_exec_docs_board_priority
  on uslab_exec_docs(board_id, is_trashed asc, priority desc, updated_at desc);

create index uslab_idx_exec_docs_trashed
  on uslab_exec_docs(is_trashed, trashed_at desc);

-- 4. uslab_exec_doc_versions 테이블 (히스토리)
create table uslab_exec_doc_versions (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid not null references uslab_exec_docs(id) on delete cascade,

  title text not null,
  content jsonb not null,

  -- why/how
  change_type text not null check (change_type in ('auto_snapshot','manual_snapshot','restore_point')),
  note text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index uslab_idx_exec_doc_versions_doc
  on uslab_exec_doc_versions(doc_id, created_at desc);

-- 5. updated_at 자동 갱신 트리거 함수
create or replace function uslab_exec_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger uslab_exec_boards_updated_at
before update on uslab_exec_boards
for each row execute function uslab_exec_set_updated_at();

create trigger uslab_exec_docs_updated_at
before update on uslab_exec_docs
for each row execute function uslab_exec_set_updated_at();

-- 6. RLS 활성화
alter table uslab_exec_boards enable row level security;
alter table uslab_exec_docs enable row level security;
alter table uslab_exec_doc_versions enable row level security;

-- 7. RLS 정책 (내부전용 - 운영진만 접근)
-- boards
drop policy if exists uslab_exec_boards_select_admin on uslab_exec_boards;
create policy uslab_exec_boards_select_admin
on uslab_exec_boards for select
to authenticated
using (uslab_is_admin());

drop policy if exists uslab_exec_boards_write_admin on uslab_exec_boards;
create policy uslab_exec_boards_write_admin
on uslab_exec_boards for all
to authenticated
using (uslab_is_admin())
with check (uslab_is_admin());

-- docs
drop policy if exists uslab_exec_docs_select_admin on uslab_exec_docs;
create policy uslab_exec_docs_select_admin
on uslab_exec_docs for select
to authenticated
using (uslab_is_admin());

drop policy if exists uslab_exec_docs_write_admin on uslab_exec_docs;
create policy uslab_exec_docs_write_admin
on uslab_exec_docs for all
to authenticated
using (uslab_is_admin())
with check (uslab_is_admin());

-- versions
drop policy if exists uslab_exec_versions_select_admin on uslab_exec_doc_versions;
create policy uslab_exec_versions_select_admin
on uslab_exec_doc_versions for select
to authenticated
using (uslab_is_admin());

drop policy if exists uslab_exec_versions_insert_admin on uslab_exec_doc_versions;
create policy uslab_exec_versions_insert_admin
on uslab_exec_doc_versions for insert
to authenticated
with check (uslab_is_admin());

-- 8. 권한 부여
grant select, insert, update, delete on uslab_exec_boards to authenticated;
grant select, insert, update, delete on uslab_exec_docs to authenticated;
grant select, insert on uslab_exec_doc_versions to authenticated;
grant select, insert on uslab_admins to authenticated;

-- 9. 초기 데이터 (기본 보드 생성)
insert into uslab_exec_boards (name, description, sort_order)
values 
  ('공지', '운영진 공지사항', 0),
  ('회의록', '주간 회의 기록', 1),
  ('의사결정', '중요 의사결정 로그', 2)
on conflict do nothing;

