# Admin Service Setup Guide

## Environment Variables Required

To enable admin functionality (user deletion, analytics, etc.), you need to add the Supabase Service Role Key to your environment variables.

### 1. Get Your Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)

### 2. Add to Environment Variables

Add this to your `.env` file:

```env
# Existing variables (for Vite)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Add this new variable for admin operations
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Note**: If you're using Create React App, use `REACT_APP_` prefix instead of `VITE_`.

### 3. Security Warning

⚠️ **IMPORTANT**: The service role key has full admin access to your database. Never expose this key in client-side code in production. This implementation is for development/testing purposes.

For production, consider:

- Moving admin operations to a backend API
- Using server-side admin functions
- Implementing proper role-based access control

### 4. Restart Your Application

After adding the environment variable, restart your development server:

```bash
npm start
# or
yarn start
```

### 5. Test Admin Functions

Once set up, you should be able to:

- ✅ View user analytics
- ✅ Delete users (with confirmation)
- ✅ Export data
- ✅ View detailed user information

## Troubleshooting

### "User not allowed" Error

- Make sure you're using the service role key, not the anon key
- Verify the environment variable is correctly named
- Restart your development server after adding the variable

### "Failed to fetch users" Error

- Check your Supabase URL and keys
- Ensure your database tables exist
- Check browser console for detailed error messages

## Database Setup

Make sure you have run the admin enhancements SQL script:

```sql
-- Run the admin_enhancements.sql file
-- This creates the necessary tables and functions
```

## Admin User Setup

To make a user an admin, add them to the admin_users table:

```sql
INSERT INTO admin_users (user_id, email, role)
VALUES (
  'user-uuid-here',
  'admin@example.com',
  'admin'
);
```
