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

## 🌟 Project Scope and Adaptability
Qalia is currently heavily focused on **nutrition and physical wellness**. Its core database schema (meals, daily_calories), API routes, and AI interactions are tailored for tracking meals, weight generation, and acting as a nutritional coach.

However, the underlying architecture (**Next.js + Supabase + Generative AI via Gemini**) is highly adaptable. By slightly modifying the database tables and AI prompts, this framework could easily be repurposed for:

1. **Personal Finance Manager (Fintech AI)**: Replace meals with "daily expenses". The AI analyzes receipts, categorizes transactions, and provides financial coaching.
2. **EdTech & Tutoring Platform**: Replace the pantry inventory with "study topics". The AI suggests daily study plans and quizzes based on mastery levels.
3. **Fitness Tracker**: Track calories burned and workout routines rather than food intake, where the AI generates workout plans based on available home equipment.
4. **Small Business Inventory**: Use the pantry architecture for stock management. The AI predicts restocks, analyzes sales trends, and automates purchasing recommendations.
