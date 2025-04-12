# Liftit - Fitness Tracking Application

Liftit is a comprehensive fitness tracking application that allows users to log workouts, track progress, and monitor strength gains over time.

## Features

- **Authentication**: Support for credentials, GitHub, Google, and Apple sign-in
- **Workout Logging**: Create and track workouts with exercises, sets, reps, weight, and RPE
- **Progress Tracking**: Visual representation of strength gains over time
- **Personal Records**: Automatic detection of personal records (PRs)
- **Workout Templates**: Pre-made workout routines for quick start
- **Responsive UI**: Mobile-friendly design for on-the-go logging

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or use the included Prisma ORM with SQLite)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/liftit.git
   cd liftit
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Copy the `.env.example` file to `.env.local` and fill in the necessary information:
   ```bash
   cp .env.example .env.local
   ```

4. Initialize the database
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### Development Authentication

For development purposes, you can use these credentials to sign in:
- Username: `demo-user`
- Password: `password`

## OAuth Configuration (Optional)

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth application
3. Set the Authorization callback URL to `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local` file

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project and set up OAuth credentials
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
4. Copy the credentials to your `.env.local` file

### Apple OAuth
1. Follow the [Apple Developer documentation](https://developer.apple.com/sign-in-with-apple/get-started/) to set up Sign in with Apple
2. Copy the credentials to your `.env.local` file

## Production Deployment

1. Set up a production PostgreSQL database
2. Configure environment variables for production
3. Build the application
   ```bash
   npm run build
   ```
4. Start the application
   ```bash
   npm start
   ```

## Project Structure

- `/app`: Main application pages and API routes (Next.js App Router)
- `/components`: Reusable UI components
- `/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 