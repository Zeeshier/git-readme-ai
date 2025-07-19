# 🚀 GitReadme AI

Transform any GitHub repository into a beautiful, professional README with AI-powered analysis and a modern, minimal UI.

---

## ✨ Features

- **🔍 Repository Analysis**: Analyzes structure, dependencies, and code
- **🤖 AI-Powered Generation**: Creates comprehensive READMEs based on the actual codebase
- **🎨 Modern Minimal UI**: Clean, glassmorphic interface with Poppins/Montserrat font
- **📥 Download & Copy**: Instantly download or copy your generated README
- **⚡ Fast & Responsive**: Lightning-fast analysis and beautiful on all devices

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Groq API key (for AI generation)
- GitHub token (optional, for higher rate limits)

### Installation

```bash
# 1. Clone the repository
 git clone <your-repo-url>
 cd gitreadme-ai

# 2. Install dependencies
 npm install

# 3. Set up environment variables
 cp .env.local.example .env.local
# Add your GROQ_API_KEY and (optionally) GITHUB_TOKEN

# 4. Start the development server
 npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Usage

1. **Paste a GitHub repository URL** (e.g., `https://github.com/vercel/next.js`)
2. **Click “Generate README”**
3. **Wait for analysis** – The app will analyze the repository structure
4. **Review the generated README** – Minimal, beautiful markdown preview
5. **Download or copy** – Instantly get your README file

---

## 🖼️ Modern Minimal UI

- **Font:** Poppins (with Montserrat fallback) for a clean, modern look
- **Design:** Glassmorphism cards, pill-shaped inputs and buttons, soft shadows
- **Layout:** Centered, max-width, lots of whitespace, responsive on all devices
- **Actions:** Simple icon buttons for copy/download, minimal footer
- **No clutter:** Only what you need, nothing you don’t

---

## 🏗️ Project Structure

```
gitreadme-ai/
├── src/
│   ├── app/              # Next.js app router & UI
│   ├── components/       # React components
│   └── lib/              # Utilities and configurations
├── public/               # Static assets
└── package.json          # Dependencies
```

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built by zeeshier — {year} GitReadme AI**

</div> 