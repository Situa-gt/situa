-- Optional visible name for a model floor plan, e.g. "Tipo A1". Additive: old code ignores it.
alter table public.project_media add column if not exists label text;

alter table public.project_media drop constraint if exists project_media_label_check;
alter table public.project_media add constraint project_media_label_check
  check (label is null or (char_length(label) between 1 and 60 and label = btrim(label)));
