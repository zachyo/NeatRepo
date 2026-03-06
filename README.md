# NeatRepo (RepoFolders)

NeatRepo is a powerful web application designed to help developers and organizations organize their GitHub repositories using a familiar folder-based structure. It solves the problem of repository clutter by allowing you to categorize, find, and manage hundreds of repositories with ease.

## 🚀 Features

### Core Functionality

- **GitHub Authentication**: Secure OAuth login to fetch and sync your personal repositories.
- **Folder Management**: Create, rename, delete, and nest folders to organize your repos just like a local file system.
- **Repository Organization**: Pin important folders, star favorite repositories, and visually manage your GitHub workspace.
- **Search & Filtering**: Quickly find repositories by name, language, stars, or within specific folders.
- **Public Profiles**: Share your curated folder structures and favorite repositories via clean, read-only public pages.

## 🛠 Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Fetching/Caching**: [TanStack React Query](https://tanstack.com/query/latest)
- **Database**: PostgreSQL (via Supabase)

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A GitHub OAuth app (for authentication)
- A Supabase project (for database and auth)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/NeatRepo.git
   cd NeatRepo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add your environment variables (Supabase URLs/Keys, GitHub OAuth Client ID/Secret).

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `app/`: Next.js App Router pages and API routes.
  - `api/`: Backend endpoints for folder, profile, and auth logic.
  - `dashboard/`: Authenticated user views for managing folders and repos.
  - `p/`: Public profile pages and dedicated folder views.
  - `auth/`: Login and GitHub callback pages.
- `components/`: Reusable React components (including shadcn/ui).
- `hooks/`: Custom React hooks (e.g., TanStack Query fetchers).
- `public/`: Static assets like images and icons.

## 📝 License

This project is licensed under the MIT License.
