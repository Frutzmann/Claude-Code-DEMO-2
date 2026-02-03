# Database Migrations

Run these SQL files in Supabase Dashboard -> SQL Editor in order:

1. `001_profiles.sql` - Creates profiles table and auto-creation trigger
2. `002_storage.sql` - Creates storage policies for portraits bucket

## Before running 002_storage.sql

Create 'portraits' bucket in Storage (make it public):
1. Go to Supabase Dashboard -> Storage
2. Click "New bucket"
3. Name: `portraits`
4. Public bucket: Yes (toggle on)
5. Click "Create bucket"

Then run the SQL file to create the RLS policies.
