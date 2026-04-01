# Drink Water Frontend

A modern React TypeScript frontend for managing devices and sending push notifications in the Drink Water microservices ecosystem.

## Features

- **Device Management**: Register new devices, view device details, deactivate devices
- **Push Notifications**: Send notifications with basic or advanced settings
  - Target: Single device, all store devices, or bulk multiple devices
  - Quick templates for common notifications
  - Advanced options: subtitle, sound, category, thread ID
- **Modern UI**: Glassmorphism design with smooth animations using Framer Motion
- **Responsive**: Collapsible sidebar with recent devices tracking

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management
- **Axios** for API calls
- **Lucide React** for icons
- **TanStack Query** (React Query) for server state management

## Getting Started

### Prerequisites

- Node.js 18+
- Backend services running (device-service: 8081, push-service: 8082, water-service: 8083)

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── devices/          # Device management components
│   │   ├── layout/           # Layout components (Sidebar, Header)
│   │   ├── notifications/    # Push notification components
│   │   ├── tabs/             # Main tab views
│   │   └── ui/               # Reusable UI components
│   ├── lib/                  # Utilities, API, store
│   ├── types/                # TypeScript types
│   ├── App.tsx               # Main app component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Integration

The frontend proxies API requests to the backend services:

- `/api/devices` → device-service (8081)
- `/api/push-notifications` → push-service (8082)
- `/api/water` → water-service (8083)

## Key Components

### UI Components
- `Button` - Animated buttons with variants
- `Card` - Glassmorphism cards with hover effects
- `Input` / `Textarea` / `Select` - Form controls
- `Tabs` - Animated tab switching
- `Toast` - Notification system

### Feature Components
- `DeviceRegistrationForm` - Register new devices with sample data generator
- `DeviceList` - Searchable, filterable device list
- `DeviceDetails` - Device info with actions (deactivate, send reminder)
- `PushNotificationPanel` - Full notification composer with basic/advanced modes

## Usage Guide

### Registering a Device
1. Go to the **Devices** tab
2. Fill in the registration form or click "Fill Sample Data"
3. Click "Register Device"

### Sending Notifications
1. Go to the **Notifications** tab
2. Select target type (Device, Store, or Bulk)
3. Choose **Basic** mode for quick templates or **Advanced** for full control
4. Preview your notification
5. Click "Send Notification"

### Managing Devices
- Click any device in the list to view details
- Use the search bar to filter devices
- Click the refresh button to reload the list
- Deactivate devices from the details panel

## Environment Variables

Create a `.env` file to customize:

```env
VITE_DEVICE_SERVICE_URL=http://localhost:8081
VITE_PUSH_SERVICE_URL=http://localhost:8082
VITE_WATER_SERVICE_URL=http://localhost:8083
```
