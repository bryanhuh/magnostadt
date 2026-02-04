# User Profile Implementation

**Date:** 2026-02-04
**Version:** v0.0.4

## Overview
This document details the implementation of the "User Profile" feature set for Shonen-Mart. This includes a dedicated dashboard for users to manage their orders, addresses, and wishlist.

## Features

### 1. User Dashboard (`/profile`)
- **Layout**: Sidebar navigation with links to Orders, Wishlist, and Addresses.
- **Routing**: Protected routes nested under `/profile`.
- **Authentication**: Integrated with Clerk. Avatar click redirects to this dashboard.

### 2. Wishlist System
- **Functionality**: Users can add/remove products from their wishlist.
- **UI Integration**:
    - **Product Card**: Heart button overlay on product images.
    - **Product Details**: Dedicated "Heart" action button.
    - **Optimistic UI**: Immediate feedback (red fill) before server confirmation.
- **Data Model**:
    - New `WishlistItem` table linking `User` and `Product`.

### 3. Address Book
- **Functionality**: Full CRUD (Create, Read, Update, Delete) for shipping addresses.
- **Features**:
    - Set default address.
    - Country selection.
    - Form validation.
- **Data Model**:
    - New `Address` table linked to `User`.

### 4. Order History
- **Functionality**: Users can view their past orders.
- **Details**:
    - Order status (Pending, Shipped, etc.).
    - Total price.
    - List of items with images and links.
- **Linking**: Orders are now linked to the authenticated `User` upon checkout.

## Technical Implementation

### Database Schema (`prisma.schema`)
```prisma
model User {
  ...
  addresses Address[]
  wishlist  WishlistItem[]
}

model Address {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(...)
  name      String   // e.g. "Home"
  street    String
  city      String
  state     String
  zipCode   String
  country   String   @default("US")
  isDefault Boolean  @default(false)
  ...
}

model WishlistItem {
  userId    String
  productId String
  ...
  @@unique([userId, productId])
}
```

### Backend (tRPC)
- **`wishlist` Router**:
    - `add`: Add item to wishlist.
    - `remove`: Remove item.
    - `getMine`: Fetch user's wishlist.
    - `checkStatus`: Boolean check if product is wishlisted.
- **`address` Router**:
    - `create`, `update`, `delete`, `getAll`.
    - Handles "Default" address logic (unsetting previous default).

### Frontend
- **State Management**: React Query (via tRPC) for data fetching and caching.
- **Components**:
    - `ProfileLayout.tsx`: Main wrapper.
    - `Wishlist.tsx`: Grid view of saved items.
    - `Addresses.tsx`: Form and list view.
    - `Orders.tsx`: History view.

## Future Improvements
- [ ] Email notifications for Wishlist items on sale.
- [ ] "Buy Again" button in Order History.
- [ ] Multiple shipping addresses in Checkout selection.
