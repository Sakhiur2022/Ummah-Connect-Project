# Ummah Connect - Block Diagram Representation

## System Architecture Overview

Ummah Connect is an Emotion-Based Islamic Social Media Platform for Women's Cyber Safety. The application follows a modern layered architecture with clear separation of concerns.

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE LAYER                          │
│                      (Web Browser / Client)                         │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTP/HTTPS Requests
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                               │
│              (Next.js Frontend - React/TypeScript)                  │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┐         │
│  │Dashboard │ Messenger│ Posts    │  Profile │  Settings  │         |
│  └──────────┴──────────┴──────────┴──────────┴────────────┘         │
│                                                                     │
│  • UI Components (Shadcn + Tailwind CSS)                            │
│  • Framer Motion Animations                                         │
│  • Theme Provider (Light/Dark Mode)                                 │
└────────────────────┬────────────────────────────────────────────────┘
                     │ API Calls
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                                │
│              (Next.js Server & Edge Middleware)                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Edge Middleware                                              │   │
│  │ • Session Management (JWT/Cookies)                           │   │
│  │ • Route Guards & Authentication                              │   │
│  │ • Security Headers                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ API Routes (/app/api/*)                                      │   │
│  │ • User Authentication                                        │   │
│  │ • Friend Management                                          │   │
│  │ • Post Operations (Create/Read/Update/Delete)                │   │
│  │ • Messenger & Chat Operations                                │   │
│  │ • Notification Management                                    │   │
│  │ • Safety Analysis (with Rate Limiting)                       │   │
│  │ • Mahram System Operations                                   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────────┘
                     │ SQL Queries / RPC Calls
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                              │
│                    (Supabase Client SDK)                            │
│  • PostgreSQL Query Builder                                         │
│  • Real-time Subscriptions                                          │
│  • Row-Level Security (RLS)                                         │
└────────────────────┬────────────────────────────────────────────────┘
                     │ Authenticated Requests
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                               │
│                  (Supabase Cloud Platform)                          │
│  ┌──────────────────────┬───────────────────────────────────────┐   │
│  │ Authentication       │ PostgreSQL Database                   │   │
│  │ • Email/Password     │ • Users Table                         │   │
│  │ • JWT Tokens         │ • Posts Table                         │   │
│  │ • Session Storage    │ • Profiles Table                      │   │
│  │ • MFA Support        │ • Friends Relationships               │   │
│  └──────────────────────┴───────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Data Business Logic (PL/pgSQL Functions)                     │   │
│  │ • Friend System RPC Functions                                │   │
│  │ • Notification Triggers                                      │   │
│  │ • Mahram Access Management                                   │   │
│  │ • Post Engagement Counters                                   │   │
│  │ • Ibadah Points Calculation                                  │   │
│  │ • User Role Management                                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTPS Requests
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Google Perspective API                                        │  │
│  │ (Content Safety & Toxicity Analysis)                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                             │
│                    (/app & /components)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PAGES (/app/*)                                                     │
│  ├── /auth                  (Authentication Pages)                  │
│  │   ├── sign-up                                                    │
│  │   ├── forgot-password                                            │
│  │   └── reset-password                                             │
│  ├── /dashboard             (Main Feed)                            │
│  ├── /profile/[username]    (User Profile)                         │
│  ├── /messenger             (Chat Interface)                       │
│  ├── /chatbot               (AI Chatbot)                           │
│  ├── /post/[id]             (Post Details)                         │
│  └── /settings              (User Settings)                        │
│                                                                     │
│  COMPONENTS (/components/*)                                        │
│  ├── /ui                    (Shadcn UI Components)                │
│  │   ├── button.tsx                                                │
│  │   ├── card.tsx                                                  │
│  │   ├── input.tsx                                                 │
│  │   ├── select.tsx                                                │
│  │   ├── alert.tsx                                                 │
│  │   └── ...                                                       │
│  ├── /profile               (Profile Features)                     │
│  │   ├── profile-header.tsx                                        │
│  │   ├── profile-content.tsx                                       │
│  │   ├── profile-feed.tsx                                          │
│  │   ├── MahramList.tsx                                            │
│  │   ├── mahram-access-modal.tsx                                   │
│  │   ├── FriendsList.tsx                                           │
│  │   ├── PhotoGallery.tsx                                          │
│  │   └── MahramAndFriendsCard.tsx                                  │
│  ├── /post                  (Post Features)                        │
│  │   ├── post-card.tsx                                             │
│  │   ├── reaction-bar.tsx                                          │
│  │   └── comment-section.tsx                                       │
│  ├── /messenger             (Chat Features)                        │
│  │   ├── ChatList.tsx                                              │
│  │   ├── ChatBox.tsx                                               │
│  │   └── ChatInput.tsx                                             │
│  ├── /chatbot               (Chatbot Features)                     │
│  │   ├── ChatContainer.tsx                                         │
│  │   ├── ChatInput.tsx                                             │
│  │   └── ChatMessage.tsx                                           │
│  ├── /notifications         (Notification System)                  │
│  │   └── NotificationCenter.tsx                                    │
│  ├── /settings              (Settings)                             │
│  │   ├── ChatbotToggle.tsx                                         │
│  │   └── NotificationToggle.tsx                                    │
│  ├── /header                (Header)                               │
│  │   └── theme-toggle-button.tsx                                   │
│  └── /background            (Visual Effects)                       │
│      ├── animated-background.tsx                                   │
│      ├── islamic-background.tsx                                    │
│      └── profile-animated-background.tsx                           │
│                                                                     │
│  UTILITIES                                                          │
│  ├── animated-background.tsx        (Background Effects)           │
│  ├── audio-visualizer.tsx            (Audio Visualization)         │
│  ├── crescent-icon.tsx               (Islamic Icon)                │
│  └── CropperModal.tsx                (Image Cropping)              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  USER ACTION (e.g., Create Post, Send Message, Add Friend)          │
│                                                                      │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND VALIDATION (React Component)                               │
│  • Input validation                                                  │
│  • Form state management                                            │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ POST/PUT/GET API Request
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  EDGE MIDDLEWARE (Vercel Edge)                                       │
│  • Session verification (JWT/Cookies)                               │
│  • Route protection                                                  │
│  • CORS handling                                                     │
└────────────────────┬─────────────────────────────────────────────────┘
                     │ Authorized Request
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  API ROUTE HANDLER (/app/api/*)                                      │
│  • Request validation                                                │
│  • Business logic                                                    │
│  • Rate limiting (for safety analysis)                              │
│  • Error handling                                                    │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     ├─────────────────┬─────────────────┬─────────────┐
                     │                 │                 │             │
                     ▼                 ▼                 ▼             ▼
          ┌─────────────────┐  ┌───────────────┐  ┌──────────────┐   │
          │ Call Supabase   │  │ Call External │  │ Data Access  │   │
          │ RPC Functions   │  │ Safety API    │  │ Layer        │   │
          └────────┬────────┘  └───────┬───────┘  └────────┬─────┘   │
                   │                   │                   │          │
                   └───────────────────┼───────────────────┘          │
                                       │                              │
                     ┌─────────────────▼──────────────────┐           │
                     │  DATABASE LAYER                    │           │
                     │  (Supabase PostgreSQL)             │           │
                     │                                    │           │
                     │  - Row-Level Security (RLS)        │           │
                     │  - PL/pgSQL Triggers & Functions   │           │
                     │  - Data Validation                 │           │
                     └─────────────────┬──────────────────┘           │
                                       │                              │
                     ┌─────────────────▼──────────────────┐           │
                     │  RESPONSE PROCESSING               │           │
                     │  - Serialize data                  │           │
                     │  - Error handling                  │           │
                     │  - Status codes                    │           │
                     └─────────────────┬──────────────────┘           │
                                       │                              │
                     ┌─────────────────▼──────────────────┐           │
                     │  RETURN JSON Response              │           │
                     └─────────────────┬──────────────────┘           │
                                       │                              │
                                       └──────────────────────────────┘
                                                │
                    ┌───────────────────────────┘
                    │
                    ▼
    ┌───────────────────────────────────────┐
    │ FRONTEND STATE UPDATE                 │
    │ • Update React State                  │
    │ • Re-render Components                │
    │ • Display Results / Notifications     │
    └───────────────────────────────────────┘
```

---

## 4. Feature Modules Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FEATURE MODULES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. AUTHENTICATION SYSTEM                                           │
│     ├── Sign Up (Email/Password)                                   │
│     ├── Login (JWT Token)                                          │
│     ├── Password Reset                                             │
│     ├── Session Management (Cookies)                               │
│     └── Protected Routes                                           │
│                                                                     │
│  2. USER PROFILE SYSTEM                                             │
│     ├── Profile Creation & Editing                                 │
│     ├── Avatar Upload (with Image Cropper)                         │
│     ├── Bio & Personal Info                                        │
│     ├── Privacy Settings                                           │
│     ├── User Statistics (Posts, Followers, etc.)                   │
│     └── Profile Visibility Control                                 │
│                                                                     │
│  3. FRIEND SYSTEM                                                   │
│     ├── Send Friend Request                                        │
│     ├── Accept/Reject Requests                                     │
│     ├── Friend List Management                                     │
│     ├── Friend Request Notifications                               │
│     └── Friend Graph Queries (PL/pgSQL)                            │
│                                                                     │
│  4. MAHRAM SYSTEM (Core Islamic Feature)                            │
│     ├── Mahram Registration                                        │
│     ├── Mahram Access Requests                                     │
│     ├── View Mahram-Only Content                                   │
│     ├── Mahram Notifications                                       │
│     ├── Mahram RLS Policies                                        │
│     └── Mahram Access Control                                      │
│                                                                     │
│  5. POST & ENGAGEMENT SYSTEM                                        │
│     ├── Create Posts (Text/Images)                                 │
│     ├── Edit/Delete Posts                                          │
│     ├── Like/React to Posts                                        │
│     ├── Comment System                                             │
│     ├── Reply to Comments                                          │
│     ├── Share Posts                                                │
│     ├── Post Engagement Counters (PL/pgSQL Triggers)               │
│     └── Feed Generation (Dashboard)                                │
│                                                                     │
│  6. MESSAGING & CHAT SYSTEM                                         │
│     ├── One-on-One Messaging                                       │
│     ├── Message History                                            │
│     ├── Read Receipts                                              │
│     ├── Chat List Management                                       │
│     ├── Real-time Chat (Supabase Subscriptions)                    │
│     └── Delete/Archive Conversations                               │
│                                                                     │
│  7. NOTIFICATION SYSTEM                                             │
│     ├── Friend Request Notifications                               │
│     ├── Post Engagement Notifications                              │
│     ├── Message Notifications                                      │
│     ├── Notification Center UI                                     │
│     ├── Notification Preferences                                   │
│     ├── Database Triggers (PL/pgSQL)                               │
│     └── Toast Notifications                                        │
│                                                                     │
│  8. SAFETY & MODERATION SYSTEM                                      │
│     ├── Content Analysis (Google Perspective API)                  │
│     ├── Toxicity Detection                                         │
│     ├── Safety Scoring                                             │
│     ├── Rate Limiting (Server-side)                                │
│     ├── Guidance Messages to Users                                 │
│     └── Safety Report System                                       │
│                                                                     │
│  9. CHATBOT SYSTEM                                                  │
│     ├── AI-powered Chat Interface                                  │
│     ├── Message History                                            │
│     ├── Chatbot Enable/Disable Setting                             │
│     ├── Conversational UI                                          │
│     └── Message Display with Timestamps                            │
│                                                                     │
│  10. SETTINGS & PREFERENCES                                         │
│      ├── Theme Toggle (Light/Dark Mode)                            │
│      ├── Chatbot Enable/Disable                                    │
│      ├── Notification Preferences                                  │
│      ├── Privacy Settings                                          │
│      ├── Account Management                                        │
│      └── Logout Functionality                                      │
│                                                                     │
│  11. IBADAH POINTS SYSTEM                                           │
│      ├── Points Calculation                                        │
│      ├── Activity-based Rewards                                    │
│      ├── Leaderboard Tracking                                      │
│      └── PL/pgSQL Points Management                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Database Schema Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE LAYER                         │
│                    (PostgreSQL with RLS & Triggers)                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CORE TABLES                                                         │
│  ├── users                                                           │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── email (Unique)                                             │
│  │   ├── username (Unique)                                          │
│  │   ├── full_name                                                  │
│  │   ├── avatar_url                                                 │
│  │   ├── bio                                                        │
│  │   ├── role (enum: user, admin, mahram)                           │
│  │   ├── created_at                                                 │
│  │   └── updated_at                                                 │
│  │                                                                   │
│  ├── profiles                                                        │
│  │   ├── id (PK, FK: users.id)                                      │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── bio                                                        │
│  │   ├── phone                                                      │
│  │   ├── location                                                   │
│  │   ├── website                                                    │
│  │   ├── is_private                                                 │
│  │   ├── mahram_access_control (JSON)                               │
│  │   └── updated_at                                                 │
│  │                                                                   │
│  │  RELATIONSHIP TABLES                                              │
│  ├── friendships                                                     │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── friend_id (FK: users.id)                                   │
│  │   ├── status (pending, accepted, blocked)                        │
│  │   ├── created_at                                                 │
│  │   └── updated_at                                                 │
│  │                                                                   │
│  ├── mahrams                                                         │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id (FK: users.id) [User granting access]              │
│  │   ├── mahram_id (FK: users.id) [Mahram person]                   │
│  │   ├── relationship_type (brother, father, etc.)                  │
│  │   ├── access_level (view_profile, view_posts, etc.)              │
│  │   ├── created_at                                                 │
│  │   └── verified_at                                                │
│  │                                                                   │
│  │  CONTENT TABLES                                                   │
│  ├── posts                                                           │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── content (Text)                                             │
│  │   ├── images (JSONB - array of image URLs)                       │
│  │   ├── is_mahram_only (Boolean)                                   │
│  │   ├── likes_count                                                │
│  │   ├── comments_count                                             │
│  │   ├── shares_count                                               │
│  │   ├── created_at                                                 │
│  │   └── updated_at                                                 │
│  │                                                                   │
│  ├── comments                                                        │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── post_id (FK: posts.id)                                     │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── parent_comment_id (FK: comments.id, nullable)              │
│  │   ├── content (Text)                                             │
│  │   ├── likes_count                                                │
│  │   ├── created_at                                                 │
│  │   └── updated_at                                                 │
│  │                                                                   │
│  ├── reactions                                                       │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── post_id (FK: posts.id, nullable)                           │
│  │   ├── comment_id (FK: comments.id, nullable)                     │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── reaction_type (like, love, happy, sad, angry, etc.)        │
│  │   └── created_at                                                 │
│  │                                                                   │
│  │  MESSAGING TABLES                                                 │
│  ├── conversations                                                   │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id_1 (FK: users.id)                                   │
│  │   ├── user_id_2 (FK: users.id)                                   │
│  │   ├── last_message_at                                            │
│  │   └── created_at                                                 │
│  │                                                                   │
│  ├── messages                                                        │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── conversation_id (FK: conversations.id)                     │
│  │   ├── sender_id (FK: users.id)                                   │
│  │   ├── content (Text)                                             │
│  │   ├── is_read (Boolean)                                          │
│  │   ├── read_at (Nullable)                                         │
│  │   └── created_at                                                 │
│  │                                                                   │
│  │  NOTIFICATION TABLES                                              │
│  ├── notifications                                                   │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── actor_id (FK: users.id) [Who triggered it]                 │
│  │   ├── type (enum: friend_request, like, comment, etc.)           │
│  │   ├── related_post_id (FK: posts.id, nullable)                   │
│  │   ├── is_read (Boolean)                                          │
│  │   ├── created_at                                                 │
│  │   └── read_at                                                    │
│  │                                                                   │
│  │  GAMIFICATION TABLES                                              │
│  ├── ibadah_points                                                   │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── user_id (FK: users.id)                                     │
│  │   ├── activity_type (post, comment, refer, etc.)                 │
│  │   ├── points (Integer)                                           │
│  │   ├── description                                                │
│  │   ├── created_at                                                 │
│  │   └── verified_at                                                │
│  │                                                                   │
│  │  SECURITY & MODERATION                                            │
│  ├── safety_reports                                                  │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── content_type (post, comment, message)                      │
│  │   ├── content_id (UUID, polymorphic)                             │
│  │   ├── reporter_id (FK: users.id)                                 │
│  │   ├── reason                                                     │
│  │   ├── status (pending, reviewed, actioned)                       │
│  │   ├── created_at                                                 │
│  │   └── reviewed_at                                                │
│  │                                                                   │
│  ├── content_safety_cache                                            │
│  │   ├── id (PK, UUID)                                              │
│  │   ├── content_hash                                               │
│  │   ├── toxicity_score (0-1)                                       │
│  │   ├── analysis_result (JSONB)                                    │
│  │   ├── created_at                                                 │
│  │   └── expires_at                                                 │
│  │                                                                   │
│  │  RLS POLICIES (Row-Level Security)                                │
│  ├── Users can only see their own full profile                       │
│  ├── Mahram-only posts visible only to assigned mahrams              │
│  ├── Private profiles visible only to approved friends               │
│  ├── Users can only read their own notifications                     │
│  ├── Message access restricted to conversation participants          │
│  └── Ibadah points only visible to authorized roles                  │
│                                                                     │
│  │  TRIGGERS & PL/pgSQL FUNCTIONS                                   │
│  ├── Update post engagement counters                                 │
│  ├── Notify on friend request                                       │
│  ├── Notify on post like/comment                                    │
│  ├── Calculate and award ibadah points                               │
│  ├── Update last_message_at on conversation                         │
│  ├── Validate mahram relationships                                  │
│  ├── Archive old conversations                                      │
│  └── Manage user role transitions                                   │
│                                                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

```
┌──────────────────────────────────────────────────────────────────────┐
│                       TECHNOLOGY STACK                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  FRONTEND                                                            │
│  ├── React 18+             (UI Library)                              │
│  ├── Next.js 14+           (Framework)                               │
│  ├── TypeScript             (Type Safety)                            │
│  ├── Tailwind CSS           (Styling)                                │
│  ├── Shadcn UI              (Component Library)                      │
│  ├── Framer Motion          (Animations)                             │
│  ├── React Hook Form        (Form Management)                        │
│  ├── Chart.js               (Data Visualization)                     │
│  ├── EasyImageCropper       (Image Editing)                          │
│  └── Radix UI               (Headless Components)                    │
│                                                                      │
│  BACKEND                                                             │
│  ├── Next.js API Routes     (Serverless API)                         │
│  ├── Vercel Edge Runtime    (Edge Middleware)                        │
│  ├── Node.js                (Runtime)                                │
│  ├── TypeScript              (Type Safety)                           │
│  └── Axios/Fetch            (HTTP Client)                            │
│                                                                      │
│  DATABASE & AUTHENTICATION                                           │
│  ├── Supabase              (Backend-as-a-Service)                    │
│  │   ├── PostgreSQL         (Database)                               │
│  │   ├── JWT Auth           (Authentication)                         │
│  │   ├── Row-Level Security (Authorization)                          │
│  │   └── Real-time          (Subscriptions)                          │
│  └── @supabase/ssr          (Server-Side Rendering Support)          │
│                                                                      │
│  EXTERNAL SERVICES                                                   │
│  ├── Google Perspective API (Content Safety Analysis)                │
│  └── Vercel                 (Hosting & Deployment)                   │
│                                                                      │
│  BUILD & DEVELOPMENT TOOLS                                           │
│  ├── pnpm                   (Package Manager)                        │
│  ├── ESLint                 (Code Linting)                           │
│  ├── PostCSS                (CSS Processing)                         │
│  ├── Autoprefixer           (CSS Vendor Prefixes)                    │
│  └── next/font              (Font Optimization)                      │
│                                                                      │
│  DEPLOYMENT                                                          │
│  ├── Vercel                 (Frontend Hosting)                       │
│  └── Supabase Cloud         (Backend Hosting)                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Security Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. TRANSPORT LAYER SECURITY                                         │
│     ├── HTTPS/TLS for all communications                             │
│     ├── Secure cookies (HttpOnly, Secure, SameSite)                  │
│     └── CORS configuration                                           │
│                                                                      │
│  2. AUTHENTICATION & SESSION LAYER                                   │
│     ├── Email/Password authentication                                │
│     ├── JWT tokens (signed & verified)                               │
│     ├── Secure session storage                                       │
│     ├── Token expiration & refresh                                   │
│     └── MFA support (Supabase built-in)                              │
│                                                                      │
│  3. AUTHORIZATION LAYER                                              │
│     ├── Edge Middleware route guards                                 │
│     ├── Protected API routes                                         │
│     ├── User role-based access (user/admin/mahram)                   │
│     └── Rate limiting for sensitive operations                       │
│                                                                      │
│  4. DATA LAYER SECURITY (Row-Level Security)                         │
│     ├── Users table: Users see only own record                       │
│     ├── Posts table: Mahram-only posts have RLS filters              │
│     ├── Profiles table: Privacy-based visibility control             │
│     ├── Friendships table: Auto-filter to current user               │
│     ├── Mahrams table: Owner-only access                             │
│     ├── Messages table: Conversation participant restriction         │
│     ├── Notifications table: User-specific access                    │
│     └── Triggered automatically at database level                    │
│                                                                      │
│  5. CONTENT SAFETY LAYER                                             │
│     ├── Google Perspective API (Toxicity Analysis)                   │
│     ├── Rate limiting (server-side)                                  │
│     ├── Timeout protection                                           │
│     ├── Safety score caching                                         │
│     └── Guidance to users based on safety analysis                   │
│                                                                      │
│  6. INPUT VALIDATION                                                 │
│     ├── Frontend form validation (React Hook Form)                   │
│     ├── Server-side request validation                               │
│     ├── Type checking (TypeScript)                                   │
│     └── Sanitization of user inputs                                  │
│                                                                      │
│  7. ERROR HANDLING & LOGGING                                         │
│     ├── Secure error messages (no sensitive data)                    │
│     ├── Server-side logging                                          │
│     ├── User-friendly error UI                                       │
│     └── Failed attempt tracking                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│              DEPLOYMENT & INFRASTRUCTURE ARCHITECTURE                 │
│                                                                      │
└────────────────┬───────────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Developer Push │
        │  (Git Commit)   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │   GitHub Repo   │
        └────────┬────────┘
                 │
        ┌────────▼────────────────────────┐
        │  Vercel CI/CD Pipeline          │
        │  (Automated Deployment)         │
        │  • Build                        │
        │  • Test                         │
        │  • Deploy                       │
        └────────┬────────────────────────┘
                 │
    ┌────────────┴──────────────┐
    │                           │
    ▼                           ▼
┌─────────────────────┐   ┌──────────────────┐
│  Vercel Edge Network │   │ Vercel Serverless │
│  (Middleware/Routing)│   │ (API Routes)     │
└─────────────────────┘   └────────┬─────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Supabase Cloud      │
                        │ ├── PostgreSQL DB   │
                        │ ├── Auth Service    │
                        │ ├── Real-time API   │
                        │ └── Backups/Logs    │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ External APIs       │
                        │ ├── Google          │
                        │ │   Perspective     │
                        │ └── Analytics       │
                        └─────────────────────┘

DEPLOYMENT FLOW:
  User Browser → Vercel Edge Network → Serverless Functions → Database
```

---

## 9. User Journey Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TYPICAL USER JOURNEY                              │
└──────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────┐
  │  1. LANDING                                             │
  │     • Unauthenticated user visits website               │
  │     • Middleware redirects to /auth/sign-up or login    │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  2. AUTHENTICATION                                      │
  │     • Sign Up → Create Account (Email + Password)       │
  │     • Supabase Auth creates user & JWT                  │
  │     • Session stored in secure cookies                  │
  │     • Redirected to profile setup                       │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  3. PROFILE SETUP                                       │
  │     • Upload avatar with image cropper                  │
  │     • Set bio and personal details                      │
  │     • Configure privacy settings                        │
  │     • Add mahram (if applicable)                        │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  4. DASHBOARD (Main Feed)                               │
  │     • View posts from friends                           │
  │     • Like/React to posts                               │
  │     • Comment on posts                                  │
  │     • Share posts                                       │
  │     • Engage with content                               │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ├─────────────────────┬────────────────────────────────┐
  │                     │                                │
  ▼                     ▼                                ▼
┌──────────────┐   ┌──────────────┐        ┌──────────────────┐
│ VIEW PROFILE │   │ MESSENGER    │        │ CREATE POST      │
├──────────────┤   ├──────────────┤        ├──────────────────┤
│ • Browse     │   │ • Chat with  │        │ • Write content  │
│   profiles   │   │   friends    │        │ • Add images     │
│ • Add/Remove │   │ • Read       │        │ • Set privacy    │
│   friends    │   │   messages   │        │ • Content safety │
│ • View       │   │ • Send       │        │   analysis       │
│   mahrams    │   │   messages   │        │ • Publish        │
└──────────────┘   └──────────────┘        └──────────────────┘
  │                     │                                │
  └─────────────────────┴────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  5. NOTIFICATIONS                                       │
  │     • Friend requests                                   │
  │     • Post likes & comments                             │
  │     • New messages                                      │
  │     • Mahram requests                                   │
  │     • System notifications                              │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  6. SETTINGS & PREFERENCES                              │
  │     • Toggle theme (Light/Dark)                         │
  │     • Chatbot on/off                                    │
  │     • Notification preferences                          │
  │     • Privacy settings                                  │
  │     • Account management                                │
  └──────────────────────┬──────────────────────────────────┘
                         │
  ┌──────────────────────▼──────────────────────────────────┐
  │  7. LOGOUT                                              │
  │     • Clear session & JWT                               │
  │     • Redirect to login                                 │
  └──────────────────────────────────────────────────────────┘
```

---

## 10. API Endpoints Summary

```
┌──────────────────────────────────────────────────────────────────────┐
│                     API ENDPOINTS STRUCTURE                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  AUTHENTICATION ENDPOINTS                                            │
│  POST   /api/auth/sign-up           → Register new user              │
│  POST   /api/auth/sign-in           → Login user                     │
│  POST   /api/auth/logout            → Logout user                    │
│  POST   /api/auth/reset-password    → Reset password                 │
│  GET    /api/auth/me                → Get current user               │
│                                                                      │
│  USER & PROFILE ENDPOINTS                                            │
│  GET    /api/users/:id              → Get user profile               │
│  PUT    /api/users/:id              → Update profile                 │
│  POST   /api/users/:id/avatar       → Upload avatar                  │
│  GET    /api/users/:id/posts        → Get user's posts               │
│  GET    /api/users/:id/followers    → Get followers                  │
│                                                                      │
│  FRIEND SYSTEM ENDPOINTS                                             │
│  POST   /api/friends/request        → Send friend request            │
│  GET    /api/friends/requests       → Get pending requests           │
│  POST   /api/friends/accept/:id     → Accept request                 │
│  POST   /api/friends/reject/:id     → Reject request                 │
│  GET    /api/friends/list           → Get friends list               │
│  DELETE /api/friends/:id            → Remove friend                  │
│                                                                      │
│  MAHRAM SYSTEM ENDPOINTS                                             │
│  POST   /api/mahram/register        → Register mahram                │
│  GET    /api/mahram/list            → Get mahrams                    │
│  POST   /api/mahram/request-access  → Request mahram access          │
│  GET    /api/mahram/access          → Get mahram access info         │
│  PUT    /api/mahram/:id/access      → Update access level            │
│                                                                      │
│  POST ENDPOINTS                                                      │
│  POST   /api/posts                  → Create post                    │
│  GET    /api/posts                  → Get feed                       │
│  GET    /api/posts/:id              → Get specific post              │
│  PUT    /api/posts/:id              → Edit post                      │
│  DELETE /api/posts/:id              → Delete post                    │
│  GET    /api/posts/:id/comments     → Get comments                   │
│  POST   /api/posts/:id/react        → React to post                  │
│                                                                      │
│  COMMENT ENDPOINTS                                                   │
│  POST   /api/comments               → Create comment                 │
│  PUT    /api/comments/:id           → Edit comment                   │
│  DELETE /api/comments/:id           → Delete comment                 │
│  POST   /api/comments/:id/react     → React to comment               │
│                                                                      │
│  MESSENGER ENDPOINTS                                                 │
│  GET    /api/messages/conversations → Get chat list                  │
│  GET    /api/messages/:convId       → Get messages                   │
│  POST   /api/messages               → Send message                   │
│  DELETE /api/messages/:id           → Delete message                 │
│  PUT    /api/messages/:id/read      → Mark as read                   │
│                                                                      │
│  NOTIFICATION ENDPOINTS                                              │
│  GET    /api/notifications          → Get notifications              │
│  PUT    /api/notifications/:id/read → Mark as read                   │
│  DELETE /api/notifications/:id      → Delete notification            │
│  GET    /api/notifications/settings → Get preferences                │
│  PUT    /api/notifications/settings → Update preferences             │
│                                                                      │
│  SAFETY & MODERATION ENDPOINTS                                       │
│  POST   /api/safety/analyze         → Analyze content                │
│  POST   /api/safety/report          → Report unsafe content          │
│  GET    /api/safety/status/:id      → Get safety status              │
│                                                                      │
│  GAMIFICATION ENDPOINTS                                              │
│  GET    /api/ibadah/points          → Get user points                │
│  GET    /api/ibadah/leaderboard     → Get leaderboard                │
│  POST   /api/ibadah/redeem          → Redeem points                  │
│                                                                      │
│  CHATBOT ENDPOINTS                                                   │
│  POST   /api/chatbot/message        → Send message to bot            │
│  GET    /api/chatbot/history        → Get chat history               │
│  GET    /api/chatbot/settings       → Get bot settings               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This block diagram representation covers:

1. **High-Level Architecture** - The complete system from user interface to database
2. **Component Architecture** - All pages, components, and utilities
3. **Data Flow** - How requests are processed and responses returned
4. **Feature Modules** - 11 major feature areas with sub-components
5. **Database Schema** - Complete PostgreSQL table structure with RLS
6. **Technology Stack** - All technologies and tools used
7. **Security Layers** - Multi-layered security approach
8. **Deployment** - Vercel + Supabase infrastructure
9. **User Journey** - Typical user workflow through the application
10. **API Endpoints** - Comprehensive API route structure

This architecture ensures **scalability**, **security** (especially through Mahram-based privacy controls), **maintainability**, and **user safety** through content moderation and analysis.
