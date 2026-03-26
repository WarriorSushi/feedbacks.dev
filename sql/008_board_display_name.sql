-- Add display_name column to public_board_settings
ALTER TABLE public_board_settings
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Allow max 60 chars
ALTER TABLE public_board_settings
  ADD CONSTRAINT public_board_settings_display_name_length
  CHECK (display_name IS NULL OR length(display_name) <= 60);
