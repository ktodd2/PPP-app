# Admin User & Company Management Setup

This document explains the new admin user system and company-based invoice visibility features.

## Features

### 1. **Admin Role**
- Admin users can access a special Admin Dashboard
- Create and manage companies
- Create and manage users
- Assign users to companies
- Change user roles (admin/user)

### 2. **Company-Based Invoice Visibility**
- Users in the same company can see ALL invoices created by anyone in that company
- Users not assigned to a company only see their own invoices
- This enables team collaboration within companies

## Setup Instructions

### Step 1: Run the Migration

Run the setup script to add the necessary database tables and columns:

```bash
node setup-admin.js
```

This will:
- Create the `companies` table
- Add `role` and `companyId` columns to the `users` table
- Prompt you to make an existing user an admin

### Step 2: Login as Admin

1. Start your application: `npm run dev`
2. Login with the admin user account
3. You should now see a purple "👑 Admin Dashboard" button in the sidebar

### Step 3: Create Companies

1. Click the Admin Dashboard button
2. In the "Companies" section, enter a company name and click "Add"
3. Create as many companies as you need

### Step 4: Create or Assign Users

**To create a new user:**
1. In the Admin Dashboard, fill out the "Create New User" form
2. Select a role (admin or user)
3. Optionally assign them to a company
4. Click "Create User"

**To assign existing users to companies:**
1. Find the user in the "All Users" table
2. Use the company dropdown to assign them to a company
3. Changes are saved automatically

## Using the System

### As an Admin
- Access the Admin Dashboard from the sidebar
- Create and manage companies
- Create users and assign them to companies
- Change user roles as needed

### As a Regular User
- Create invoices as normal
- If you're in a company, you'll see ALL invoices from your company members
- This appears in the "Recent Jobs" sidebar

### Company-Based Invoice Access

The system automatically handles invoice visibility:
- **Users WITH a company**: See all invoices from all users in their company
- **Users WITHOUT a company**: Only see their own invoices

## API Endpoints

### Admin Endpoints (require admin role)

- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create a new user
- `PATCH /api/admin/users/:id/company` - Assign user to company
- `PATCH /api/admin/users/:id/role` - Change user role
- `DELETE /api/admin/users/:id` - Delete a user
- `GET /api/admin/companies` - Get all companies
- `POST /api/admin/companies` - Create a company
- `DELETE /api/admin/companies/:id` - Delete a company

### Company Jobs Endpoint (all authenticated users)

- `GET /api/company/jobs` - Get jobs for user's company (or just user's jobs if no company)

## Security Notes

- All admin endpoints require the user to be authenticated AND have `role = 'admin'`
- Users cannot elevate their own permissions
- Admins cannot delete their own account (prevents lockout)
- Password hashing is maintained for all user creation

## Manual Admin Promotion

If you need to manually promote a user to admin:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

Or use the setup script again:
```bash
node setup-admin.js
```

## Database Schema Changes

### New Table: `companies`
```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Table: `users`
```sql
ALTER TABLE users 
  ADD COLUMN role user_role NOT NULL DEFAULT 'user',
  ADD COLUMN company_id INTEGER REFERENCES companies(id);
```

Where `user_role` is an enum: `('admin', 'user')`

## Troubleshooting

**"Admin Dashboard button not showing"**
- Ensure your user has `role = 'admin'` in the database
- Try logging out and back in
- Check browser console for errors

**"403 Forbidden when accessing admin routes"**
- Your user account needs admin role
- Run: `UPDATE users SET role = 'admin' WHERE username = 'your_username';`

**"Column already exists" errors**
- The migration has already been run
- This is safe to ignore

**"Can't see company invoices"**
- Ensure users are assigned to the same company
- Check that `companyId` is set correctly in the database
- Verify the company exists in the companies table

## Example Workflow

1. **Setup**: Run `node setup-admin.js` and make yourself admin
2. **Create Company**: Login, open Admin Dashboard, create "ABC Towing"
3. **Add Users**: Create user accounts for your team members
4. **Assign Company**: Assign all team members to "ABC Towing"
5. **Collaborate**: Now all team members can see each other's invoices!

## Support

For issues or questions, please check:
- Browser console for JavaScript errors
- Server logs for API errors
- Database logs for SQL errors
