# Waste Management System

A full-stack waste management platform designed to streamline waste collection operations through role-based workflows for residents, waste collectors, and administrators.

The application enables residents to schedule waste pickups, allows collectors to manage assigned pickup tasks, and provides administrators with operational insights through a centralized dashboard.

---

## Live Demo

[View Live Application](https://portfolio-mine-five-rho.vercel.app/)

---

# Features

## Authentication & Authorization
- Secure role-based authentication system
- Role-specific access control for:
  - Residents
  - Waste Collectors
  - Administrators
- Protected routes and restricted dashboard access

## Resident Features
- Schedule waste pickup requests
- View assigned waste collectors
- Track waste collection details

## Collector Features
- View assigned waste pickup locations
- Receive reminders for scheduled pickups
- Manage collection workflow

## Admin Features
- Administrative dashboard
- View platform statistics
- Manage users and collectors
- Monitor operational activities

## User Experience
- Fully responsive design
- Modern UI built with reusable components
- Optimized for desktop and mobile devices

---

# Tech Stack

## Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Table

## Backend / API
- Next.js Route Handlers
- Node.js
- Prisma ORM

## Database
- Neon PostgreSQL

## Deployment
- Vercel

---

# Architecture Overview

The application follows a modern full-stack architecture using Next.js for both frontend rendering and backend API handling.

### Frontend
The frontend was built using:
- React components
- TypeScript for type safety
- Tailwind CSS for responsive styling
- shadcn/ui for reusable UI components

### Backend
Backend functionality is handled using:
- Next.js API route handlers
- Prisma ORM for database interaction
- Custom authentication utilities
- Role-based authorization middleware

### Database
Neon PostgreSQL is used as the primary database for storing:
- Users
- Pickup requests
- Collector assignments
- Platform statistics

---

# Engineering Highlights

- Implemented custom role-based access control (RBAC)
- Built scalable API endpoints using Next.js backend capabilities
- Designed reusable UI component architecture
- Integrated Prisma ORM with Neon PostgreSQL
- Created dynamic admin dashboards with advanced data table management
- Structured protected routes for secure access handling

---

# Challenges & Solutions

## Challenge
Implementing secure and scalable role-based authorization across multiple user types while maintaining clean application structure.

## Solution
Created reusable authentication and authorization utilities such as:
- `verifyAuth`
- Role validation middleware
- Protected route handling

This ensured secure access management while keeping the codebase modular and maintainable.

---

# Lessons Learned

Through building this project, I gained practical experience with:
- Full-stack application architecture
- Authentication and authorization workflows
- Database schema management with Prisma
- Responsive UI system design
- Backend API development with Next.js
- Deploying production-ready applications on Vercel

---

# Future Improvements

Planned improvements include:
- Real-time notifications
- Email/SMS reminders
- Waste collection analytics
- Interactive maps for pickup tracking
- Improved reporting system

---

# Getting Started

## Clone the Repository

```bash
git clone https://github.com/olaoluwasubomi/Waste-management.git
