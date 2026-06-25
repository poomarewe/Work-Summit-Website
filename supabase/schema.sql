create table if not exists submissions (
  id text primary key,
  group_number integer not null,
  file_name text not null,
  mime_type text not null,
  storage_kind text not null,
  storage_path text not null,
  submission_date text not null,
  uploaded_at text not null
);

create index if not exists submissions_date_idx on submissions (submission_date);
create index if not exists submissions_group_idx on submissions (group_number);
