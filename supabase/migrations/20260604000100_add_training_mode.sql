-- Add training_mode column to child_profiles.
-- Existing rows default to 'speech_clarity' (migration-safe).
-- Check constraint mirrors the TrainingMode type in childProfileStorage.ts.

alter table child_profiles
  add column if not exists training_mode text not null default 'speech_clarity'
  check (training_mode in ('speech_clarity', 'kindergarten_phonics'));

comment on column child_profiles.training_mode is
  'Active training mode for this child profile. Mirrors ChildProfileData.trainingMode.';
