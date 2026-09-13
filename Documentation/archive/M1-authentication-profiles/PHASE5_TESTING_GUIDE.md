# Phase 5: Avatar Upload - Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the avatar upload functionality implemented in Phase 5.

## Prerequisites

- Development server running (`npm run dev`)
- Auth bypass enabled in `.env.local`:
  ```
  NEXT_PUBLIC_DISABLE_AUTH=true
  DEV_TEST_EMAIL=dev@telopillo.test
  DEV_TEST_PASSWORD=DevTest123
  ```
- Test images available (JPG, PNG, or WebP format)

## Test Cases

### Test 1: Initial State

**Steps:**
1. Navigate to http://localhost:3001/profile/edit
2. Observe the "Foto de Perfil" section

**Expected Results:**
- ✅ Avatar section is visible at the top of the form
- ✅ Shows user initials "UD" (Usuario de Desarrollo)
- ✅ "Cambiar Foto" button is enabled
- ✅ "Eliminar" button is visible (even without avatar)
- ✅ Instructions text: "JPG, PNG o WebP. Máximo 5MB. La imagen se redimensionará automáticamente."

### Test 2: Upload Valid Image

**Steps:**
1. Click "Cambiar Foto" button
2. Select a valid image file:
   - Format: JPG, PNG, or WebP
   - Size: < 5MB
3. Wait for upload to complete

**Expected Results:**
- ✅ File picker dialog opens
- ✅ After selection, loading spinner appears
- ✅ Button text changes to "Subiendo..."
- ✅ Preview updates with selected image
- ✅ "Eliminar" button remains visible
- ✅ No error messages appear
- ✅ Console shows no errors

### Test 3: Verify Avatar in Profile View

**Steps:**
1. After successful upload, navigate to http://localhost:3001/profile
2. Observe the profile page

**Expected Results:**
- ✅ Uploaded avatar is displayed in the profile header
- ✅ Avatar is visible in the large circle (h-20 w-20)
- ✅ Image loads correctly

### Test 4: Remove Avatar

**Steps:**
1. Navigate back to http://localhost:3001/profile/edit
2. Click "Eliminar" button
3. Wait for removal to complete

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Avatar preview changes back to initials "UD"
- ✅ "Eliminar" button disappears
- ✅ No error messages appear
- ✅ Console shows no errors

### Test 5: Verify Avatar Removed in Profile View

**Steps:**
1. Navigate to http://localhost:3001/profile
2. Observe the profile page

**Expected Results:**
- ✅ Avatar shows initials "UD" instead of image
- ✅ No broken image placeholder

### Test 6: Upload Invalid File Type

**Steps:**
1. Navigate to http://localhost:3001/profile/edit
2. Click "Cambiar Foto" button
3. Try to select a non-image file (e.g., .txt, .pdf, .zip)

**Expected Results:**
- ✅ Error message appears: "Por favor selecciona una imagen"
- ✅ Preview does not change
- ✅ Upload does not proceed

### Test 7: Upload Large File

**Steps:**
1. Navigate to http://localhost:3001/profile/edit
2. Click "Cambiar Foto" button
3. Try to select an image file > 5MB

**Expected Results:**
- ✅ Error message appears: "La imagen debe ser menor a 5MB"
- ✅ Preview does not change
- ✅ Upload does not proceed

### Test 8: Multiple Uploads

**Steps:**
1. Upload an image (Test 2)
2. Without removing, upload a different image
3. Verify the new image replaces the old one

**Expected Results:**
- ✅ New image preview appears
- ✅ Old image is replaced in Supabase Storage (upsert: true)
- ✅ Profile updates with new avatar_url
- ✅ No duplicate files in storage

### Test 9: Accessibility

**Steps:**
1. Navigate to http://localhost:3001/profile/edit
2. Use keyboard navigation (Tab key)
3. Use screen reader (if available)

**Expected Results:**
- ✅ "Cambiar Foto" button is keyboard accessible
- ✅ "Eliminar" button is keyboard accessible
- ✅ Hidden file input has aria-label: "Seleccionar imagen de avatar"
- ✅ Icons have aria-hidden="true"
- ✅ Error messages have role="alert"

### Test 10: Loading States

**Steps:**
1. Upload a large image (but < 5MB)
2. Observe the loading states during upload
3. Remove the avatar
4. Observe the loading states during removal

**Expected Results:**
- ✅ During upload:
  - Spinner icon in avatar fallback
  - "Subiendo..." text on button
  - Buttons disabled
- ✅ During removal:
  - Buttons disabled
  - Loading state visible

## Supabase Storage Verification

### Check Storage Bucket

**Steps:**
1. Go to Supabase Dashboard → Storage → avatars bucket
2. Look for folder with user ID
3. Verify uploaded file exists

**Expected Results:**
- ✅ Folder named with user UUID exists
- ✅ File named `avatar.[ext]` exists
- ✅ File is publicly accessible (if bucket is public)

### Check Profile Table

**Steps:**
1. Go to Supabase Dashboard → Table Editor → profiles
2. Find the dev user's profile
3. Check `avatar_url` column

**Expected Results:**
- ✅ After upload: `avatar_url` contains public URL
- ✅ After removal: `avatar_url` is NULL
- ✅ URL format: `https://[project-ref].supabase.co/storage/v1/object/public/avatars/[user-id]/avatar.[ext]`

## Known Limitations

1. **File Upload via Automation**: Playwright browser automation cannot easily test file uploads without real files. Manual testing is required.
2. **Storage Bucket Policies**: Ensure the `avatars` bucket has proper RLS policies set up (from Phase 1).
3. **Auth Bypass**: Only works in development with `NEXT_PUBLIC_DISABLE_AUTH=true`.

## Troubleshooting

### Issue: "Eliminar" button doesn't work

**Solution:**
- The remove function tries multiple file extensions (jpg, jpeg, png, webp, gif)
- Check Supabase Storage to see the actual file extension
- Verify RLS policies allow deletion

### Issue: Upload succeeds but avatar doesn't display

**Solution:**
- Check browser console for CORS errors
- Verify `avatars` bucket is public or has proper RLS policies
- Check that `avatar_url` in database matches the actual file URL

### Issue: "Database error" during upload

**Solution:**
- Verify the `profiles` table has `avatar_url` column
- Check RLS policies on `profiles` table
- Ensure user is authenticated

### Issue: Auth bypass not working

**Solution:**
- Verify `.env.local` has correct values
- Restart dev server after changing `.env.local`
- Check middleware console logs for errors

## Next Steps

After completing all tests:
1. Document any bugs found
2. Fix critical issues
3. Proceed to Phase 6: Protected Routes
4. Or commit Phase 5 changes

## Test Report Template

```markdown
## Phase 5 Avatar Upload - Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** Development (localhost:3001)

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Test 1: Initial State | ✅ / ❌ | |
| Test 2: Upload Valid Image | ✅ / ❌ | |
| Test 3: Verify Avatar in Profile View | ✅ / ❌ | |
| Test 4: Remove Avatar | ✅ / ❌ | |
| Test 5: Verify Avatar Removed | ✅ / ❌ | |
| Test 6: Invalid File Type | ✅ / ❌ | |
| Test 7: Large File | ✅ / ❌ | |
| Test 8: Multiple Uploads | ✅ / ❌ | |
| Test 9: Accessibility | ✅ / ❌ | |
| Test 10: Loading States | ✅ / ❌ | |

### Bugs Found

1. [Bug description]
   - **Severity:** Critical / High / Medium / Low
   - **Steps to reproduce:**
   - **Expected:**
   - **Actual:**

### Recommendations

- [Recommendation 1]
- [Recommendation 2]

### Sign-off

- [ ] All critical tests passed
- [ ] No blocking bugs
- [ ] Ready for Phase 6
```

---

**Document Version:** 1.0
**Last Updated:** February 13, 2026
