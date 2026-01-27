# Phase 6: Admin & Authentication

## Overview
This phase focuses on adding the detailed plumbing required for a real application: identifying who the user is (Authentication) and giving the store owner control over the data (Admin Dashboard).

## 1. Authentication Strategy
We will use **Clerk** (clerk.com) for authentication. 
- **Why?** It generates professional, secure UI components (Login, Signup, User Profile, 2FA) automatically. Building these by hand properly takes weeks.
- **Integration**:
    - Frontend: React SDK for UI components and session management.
    - Backend: Middleware to protect tRPC procedures.

### Key Features to Enable
- Email/Password Sign up
- Social Login (Google)
- User Profiles (Avatar, Name)

## 2. Admin Dashboard
The Admin Dashboard will be a separate section of the site, accessible only to authorized users.

### Architecture
- **URL**: `/admin`
- **Layout**: Sidebar Navigation (Left), Content Area (Right).
- **Security**: Client-side check for `user.publicMetadata.role === 'admin'` + Server-side check on mutations.

### Core Modules

#### A. Dashboard (Overview)
- **KPI Cards**: Total Revenue, Total Orders, Low Stock Alerts.
- **Recent Activity**: List of latest 5 orders.

#### B. Product Management
- **List View**: Data table with search/filter.
- **Add/Edit View**: Detailed form including:
    - Basic Info (Name, Description, Price)
    - Inventory (Stock)
    - Categorization (Category, Anime Series)
    - Merchandising (Featured, Is Sale, Pre-order)
    - Media (Image URL)

#### C. Order Management
- **List View**: All orders with status badges (Pending, Shipped, Delivered).
- **Detail View**: Customer info, shipping address, list of items purchased.
- **Actions**: "Mark as Shipped", "Refund".

## 3. Database Updates
- **Orders**: Add `userId` field to link orders to signed-in users.
- **Products**: No major changes needed, just exposing them to the Admin UI.

## Next Steps
1. Set up Clerk Account & Environment Variables.
2. Install SDKs.
3. Build the Auth flow.
4. Build the Admin Layout.
5. Implement Product CRUD.
