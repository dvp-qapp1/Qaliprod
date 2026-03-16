# Qalia App

Qalia is a modern, full-stack Next.js application designed to provide a rich user experience with robust AI capabilities and reliable data management. 

## 🚀 Tech Stack

This project is built with the following core technologies:

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) for modern, responsive layouts and animations.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL & Auth)
- **AI Integration**: [Google Gemini GenAI](https://ai.google.dev/) for intelligent conversational/generative features.
- **Rate Limiting & Caching**: [Upstash Redis](https://upstash.com/)
- **Error Tracking**: [Sentry](https://sentry.io/)
- **Testing**: [Vitest](https://vitest.dev/)

## 🛠️ Getting Started

### Prerequisites
Make sure you have Node.js and a package manager install (`npm`, `yarn`, `pnpm`, or `bun`).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/dvp-qapp1/Qaliprod.git
   cd Qaliprod
   ```

2. Install the dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Configure your Environment Variables:
   Copy the example environment file and fill in your Supabase, Gemini, and other service credentials.
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Testing

Run the test suite to ensure everything is working correctly:
```bash
npm run test
# Check coverage
npm run test:coverage
```

## 🗄️ Database Management
The project uses Supabase CLI for database migrations and schema pushes. Check `package.json` for specific `db:*` scripts.

## 📄 License
This project is subject to the GNU General Public License v3. See the `LICENSE` file for more details.
