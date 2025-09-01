# Supabase Storage Setup for TaskFlow Eurospin

## Storage Bucket Configuration

To enable photo capture functionality, you need to create a storage bucket in your Supabase project:

### 1. Create Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** section
2. Click **New bucket**
3. Set bucket name: `task-photos`
4. Set bucket to **Public** (for easy access to photos)
5. Click **Create bucket**

### 2. Set Storage Policies

Add these policies to allow authenticated users to upload and view photos:

```sql
-- Policy: Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'task-photos' AND
    auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view photos
CREATE POLICY "Authenticated users can view photos" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'task-photos');

-- Policy: Allow users to update their own photos
CREATE POLICY "Users can update own photos" ON storage.objects
FOR UPDATE TO authenticated USING (
    bucket_id = 'task-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete own photos" ON storage.objects
FOR DELETE TO authenticated USING (
    bucket_id = 'task-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Environment Variables

Make sure your `.env.local` file includes:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Schema Update

Run the SQL commands in `supabase_schema.sql` to add photo support to your database:

- Adds `photo_url`, `captured_data`, and `extracted_text` columns to the `tasks` table
- Creates `photo_captures` table for photo metadata
- Sets up appropriate RLS policies

### 5. Testing

After setup:

1. Start the development server: `npm run dev`
2. Open the app and click the blue camera floating action button
3. Grant camera permissions when prompted
4. Take a photo and fill out the task form
5. The photo should be uploaded and the task created successfully

### Troubleshooting

**Camera not working:**
- Ensure HTTPS is enabled (camera API requires secure context)
- Check browser permissions for camera access
- Use the file upload fallback if camera is unavailable

**Photo upload failing:**
- Verify storage bucket policies are correctly set
- Check that the bucket is public
- Ensure your Supabase URL and API key are correct

**OCR not working:**
- OCR processing happens client-side using Tesseract.js
- It may take a few seconds to analyze photos
- Works best with clear, high-contrast text

### Performance Notes

- Photos are compressed to JPEG format before upload
- OCR processing happens locally in the browser
- Tesseract.js worker files are downloaded on first use
- Consider adding a loading state for better UX