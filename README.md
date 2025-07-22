# 🚀 GitReadme AI

**Instantly generate beautiful, professional README files for any GitHub repository using AI.**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Built with FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi)
![Frontend](https://img.shields.io/badge/frontend-HTML%2FCSS%2FJS-blue?logo=html5)
![LangChain](https://img.shields.io/badge/AI-LangChain%20%2B%20Groq-purple)

---

## 🎬 Demo

<video src="test/demo.mp4" width=500 height=400  controls></video>

---

## ✨ Features

- **AI-powered README generation** using LangChain and Groq LLMs
- **Modern, beautiful UI** with glassmorphism and responsive design
- **Live Markdown preview** with copy/download options
- **Real GitHub repo analysis** (fetches actual file structure for accurate docs)
- **FastAPI backend** for robust, scalable API
- **Easy to use:** just paste a GitHub repo URL and get a ready-to-use README

---

## 📦 Tech Stack

- **Backend:** Python, FastAPI, LangChain, Groq LLM
- **Frontend:** HTML, CSS (Poppins font, glassmorphism), JavaScript
- **Markdown Rendering:** [marked.js](https://marked.js.org/)
- **GitHub API** for real repo analysis

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/git-readme-ai.git
cd git-readme-ai
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

- Create a `.env` file with your Groq API key:
  ```
  GROQ_API_KEY=your_groq_api_key_here
  ```

- Start the FastAPI server:
  ```bash
  uvicorn main:app --reload
  ```

### 3. Frontend Usage

- Open `frontend/index.html` in your browser.

---

## 🎯 Usage

1. Enter a GitHub repository URL (e.g., `https://github.com/vercel/next.js`)
2. Click **Generate README**
3. View the AI-generated README in a beautiful, live Markdown preview
4. Copy or download the README for your project

---

## 🏗️ Project Structure

```
git-readme-ai/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── ...
└── .env
```

---

## 🛠️ Customization

- **Prompt:** Edit the system prompt in `backend/main.py` or `prompts.py` to fine-tune README style.
- **UI:** Tweak `frontend/style.css` for your own color palette or branding.

---

## 📄 License

MIT

---

## 🙏 Credits

- [LangChain](https://github.com/langchain-ai/langchain)
- [Groq](https://groq.com/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [marked.js](https://marked.js.org/)

---

> Built by zeeshier
