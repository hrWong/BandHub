# BandHub 🎸

A modern band rehearsal room booking system built with Next.js, MongoDB, and TypeScript. Designed for music studios to manage room reservations efficiently with a beautiful, responsive interface.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Schedule View**: Visual timeline showing room availability across all rooms
- **Smart Booking System**: Book rehearsal rooms with multi-hour support
- **Responsive Design**: Optimized for both desktop (grid view) and mobile (timeline view)
- **User Authentication**: Secure login and registration with NextAuth.js
- **Admin Dashboard**: Complete management interface for rooms, users, and reservations

### 👥 User Management
- **User Approval System**: Admin approval required for new registrations
- **Role-based Access**: Admin and regular user roles with different permissions
- **Individual User Deletion**: Admins can remove specific users and their reservations
- **Batch Operations**: Delete all non-admin users at once

### 📅 Booking Features
- **Multi-hour Reservations**: Book rooms for multiple consecutive hours
- **Recurring Bookings**: Admins can create weekly recurring reservations
- **Booking Restrictions**: Non-admin users limited to 7-day advance bookings
- **Past Reservation Handling**: Expired bookings are visually distinct and non-editable
- **Purpose Field**: Add notes/purpose for each reservation
- **Edit & Cancel**: Modify or cancel upcoming reservations

### 🏢 Room Management
- **Room CRUD Operations**: Create, edit, and delete rooms
- **Room Status**: Mark rooms as available or unavailable
- **Room Images**: Upload and display room photos
- **Capacity Information**: Track room capacity

### 🎨 UI/UX Highlights
- **Modern Timeline Design**: Professional schedule grid with hover effects
- **Visual Feedback**: Clear indicators for past bookings, locked slots, and maintenance
- **Dark Mode Support**: Fully themed with Tailwind CSS
- **Responsive Tables**: Mobile-friendly data displays
- **Toast Notifications**: Real-time feedback for all actions

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Date Handling**: date-fns
- **Notifications**: Sonner

## 📋 Prerequisites

- Node.js 18+ (for local development)
- MongoDB database (local or cloud)
- npm or yarn
- **OR** Docker and Docker Compose (for containerized deployment)

## 🚀 Getting Started

### Option 1: Docker Deployment (Recommended) 🐳

The fastest way to get BandHub running in production:

```bash
# Clone the repository
git clone https://github.com/hrWong/BandHub.git
cd BandHub

# Configure environment
cp env.template .env
# Edit .env and set NEXTAUTH_SECRET (generate with: openssl rand -base64 32)

# Start with Docker Compose
docker-compose up -d
```

Visit `http://localhost:3000` - that's it! 🎉

**See also:**
- [DOCKER.md](DOCKER.md) - Detailed Docker deployment guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment without Docker (PM2, nginx, etc.)

### Option 2: Local Development

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd BandHub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Admin Setup (optional)
ADMIN_NAME=BandHub Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 5. Create Admin User

Set `ADMIN_EMAIL`/`ADMIN_PASSWORD` (and optional `ADMIN_NAME`) before starting the app. The system automatically ensures that user exists with admin privileges whenever the server connects to MongoDB, so you can log in immediately with those credentials.

## 📱 Usage

### For Regular Users

1. **Register**: Create an account (requires admin approval)
2. **Browse Schedule**: View all rooms and their availability
3. **Book a Room**: Select a time slot and fill in booking details
4. **Manage Bookings**: View, edit, or cancel your upcoming reservations

### For Admins

1. **User Management**: Approve/reject new users, delete users
2. **Room Management**: Add, edit, or remove rooms
3. **Reservation Management**: View and manage all bookings
4. **Advanced Booking**: Create recurring weekly reservations
5. **Extended Booking Window**: Book beyond the 7-day limit

## 🗂️ Project Structure

```
BandHub/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── rooms/             # Room detail pages
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── BookingForm.tsx   # Booking form component
│   │   ├── ScheduleGrid.tsx  # Main schedule display
│   │   └── ...
│   ├── lib/                   # Utility functions
│   │   └── db.ts             # MongoDB connection
│   └── models/                # Mongoose models
│       ├── User.ts
│       ├── Room.ts
│       └── Reservation.ts
├── public/                    # Static assets
└── ...config files
```

## 🔑 Key Features Explained

### Schedule Grid
- **Desktop**: Professional grid layout with time slots and room columns
- **Mobile**: Vertical timeline with expandable reservation cards
- **Visual States**: Different colors for your bookings, others' bookings, past bookings, and locked slots

### Booking Restrictions
- **7-Day Limit**: Regular users can only book up to 7 days in advance
- **Admin Override**: Admins can book any future date
- **Past Slots**: Cannot book time slots that have already passed
- **Unavailable Rooms**: Disabled rooms cannot be booked

### Reservation Management
- **Edit Reservations**: Change time, date, or purpose of upcoming bookings
- **Cancel Reservations**: Remove bookings you no longer need
- **Past Bookings**: Automatically marked and cannot be modified
- **Recurring Bookings**: Admins can set up weekly recurring sessions

## 🎨 Customization

### Theming
The app uses Tailwind CSS with Shadcn/ui components. Customize colors in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      // Your custom colors
    }
  }
}
```

### Business Hours
Modify the hours array in `ScheduleGrid.tsx` to change operating hours:

```typescript
const hours = Array.from({ length: 14 }, (_, i) => i + 9); // 9 AM to 10 PM
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

Made with ❤️ for musicians and music studios
