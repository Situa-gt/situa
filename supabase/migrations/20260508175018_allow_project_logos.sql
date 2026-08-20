
ALTER TABLE project_media DROP CONSTRAINT project_media_check;

ALTER TABLE project_media ADD CONSTRAINT project_media_check CHECK (
  (kind = 'logo'     AND developer_id IS NOT NULL AND project_id IS NULL)   OR
  (kind = 'logo'     AND project_id IS NOT NULL   AND developer_id IS NULL) OR
  (kind = 'floorplan' AND model_id IS NOT NULL    AND project_id IS NOT NULL) OR
  (kind IN ('cover', 'gallery') AND project_id IS NOT NULL)
);
;
