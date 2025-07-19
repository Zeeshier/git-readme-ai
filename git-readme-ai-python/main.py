from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import json
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StringOutputParser

load_dotenv()

app = FastAPI(title="GitReadme AI", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

class RepoRequest(BaseModel):
    repoUrl: str

class RepositoryData:
    def __init__(self):
        self.name = ""
        self.description = ""
        self.language = ""
        self.topics = []
        self.stargazers_count = 0
        self.forks_count = 0
        self.license = None
        self.readme = ""
        self.packageJson = None
        self.files = []
        self.structure = ""
        self.hasChangelog = False
        self.hasContributing = False
        self.hasTests = False
        self.hasDocker = False
        self.hasCI = False
        self.hasAPI = False
        self.hasDocs = False
        self.hasBenchmarks = False
        self.hasExamples = False
        self.hasPackageJson = False
        self.hasRequirements = False
        self.hasMainFile = False
        self.hasHTML = False
        self.hasCSS = False
        self.hasReact = False
        self.hasNodeModules = False
        self.hasGit = False
        self.hasConfig = False
        self.hasSrc = False
        self.hasDist = False
        self.hasPublic = False
        self.hasAssets = False
        self.hasData = False
        self.hasImages = False
        self.hasScripts = False
        self.hasUtils = False
        self.hasComponents = False
        self.hasPages = False
        self.hasServices = False
        self.hasModels = False
        self.isPythonProject = False
        self.isNodeProject = False
        self.isWebProject = False
        self.isCLIProject = False
        self.isLibrary = False

async def fetch_github_data(owner: str, repo: str) -> RepositoryData:
    headers = {
        'Accept': 'application/vnd.github.v3+json',
    }
    
    if os.getenv('GITHUB_TOKEN'):
        headers['Authorization'] = f"token {os.getenv('GITHUB_TOKEN')}"
    else:
        print('No GITHUB_TOKEN provided. Using unauthenticated requests with lower rate limits.')
    
    # Fetch repository metadata
    repo_response = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}",
        headers=headers
    )
    
    if not repo_response.ok:
        if repo_response.status_code == 404:
            raise Exception(f"Repository not found: {owner}/{repo}")
        elif repo_response.status_code == 403:
            raise Exception("Rate limit exceeded. Please add GITHUB_TOKEN to .env for higher limits.")
        else:
            raise Exception(f"Failed to fetch repository: {repo_response.status_code}")
    
    repo_data = repo_response.json()
    
    # Fetch repository contents
    contents_response = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/contents",
        headers=headers
    )
    
    if not contents_response.ok:
        if contents_response.status_code == 403:
            raise Exception("Rate limit exceeded. Please add GITHUB_TOKEN to .env for higher limits.")
        else:
            raise Exception(f"Failed to fetch repository contents: {contents_response.status_code}")
    
    contents = contents_response.json()
    
    # Fetch README if it exists
    readme = ""
    try:
        readme_response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/readme",
            headers=headers
        )
        if readme_response.ok:
            readme_data = readme_response.json()
            readme = readme_data['content']
            import base64
            readme = base64.b64decode(readme).decode('utf-8')
    except Exception as e:
        print('No README found or error fetching README')
    
    # Fetch package.json if it exists
    package_json = None
    try:
        package_response = requests.get(
            f"https://api.github.com/repos/{owner}/{repo}/contents/package.json",
            headers=headers
        )
        if package_response.ok:
            package_data = package_response.json()
            package_content = base64.b64decode(package_data['content']).decode('utf-8')
            package_json = json.loads(package_content)
    except Exception as e:
        print('No package.json found or error fetching package.json')
    
    # Analyze repository structure
    structure = await analyze_repository_structure(owner, repo, headers)
    
    # Create RepositoryData object
    repo_info = RepositoryData()
    repo_info.name = repo_data.get('name', 'Unknown')
    repo_info.description = repo_data.get('description', '')
    repo_info.language = repo_data.get('language', 'Unknown')
    repo_info.topics = repo_data.get('topics', [])
    repo_info.stargazers_count = repo_data.get('stargazers_count', 0)
    repo_info.forks_count = repo_data.get('forks_count', 0)
    repo_info.license = repo_data.get('license')
    repo_info.readme = readme
    repo_info.packageJson = package_json
    repo_info.structure = structure
    
    # Analyze what documentation and config files exist
    repo_info.hasChangelog = 'CHANGELOG.md' in structure or 'CHANGELOG' in structure
    repo_info.hasContributing = 'CONTRIBUTING.md' in structure or 'CONTRIBUTING' in structure
    repo_info.hasTests = 'test' in structure or 'tests' in structure or '__tests__' in structure
    repo_info.hasDocker = 'Dockerfile' in structure or 'docker-compose' in structure
    repo_info.hasCI = '.github/workflows' in structure or '.gitlab-ci.yml' in structure
    repo_info.hasAPI = 'api' in structure or 'routes' in structure or 'controllers' in structure
    repo_info.hasDocs = 'docs' in structure or 'documentation' in structure
    repo_info.hasBenchmarks = 'benchmark' in structure or 'performance' in structure
    repo_info.hasExamples = 'examples' in structure or 'demo' in structure
    
    # Analyze project type and main files
    repo_info.hasPackageJson = 'package.json' in structure
    repo_info.hasRequirements = 'requirements.txt' in structure or 'Pipfile' in structure
    repo_info.hasMainFile = any(x in structure for x in ['index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'app.py', 'main.py'])
    repo_info.hasHTML = 'index.html' in structure or '.html' in structure
    repo_info.hasCSS = '.css' in structure or '.scss' in structure
    repo_info.hasReact = 'react' in structure or 'jsx' in structure or 'tsx' in structure
    repo_info.hasNodeModules = 'node_modules' in structure
    repo_info.hasGit = '.gitignore' in structure
    repo_info.hasConfig = 'config' in structure or '.env' in structure
    repo_info.hasSrc = 'src/' in structure
    repo_info.hasDist = 'dist/' in structure or 'build/' in structure
    repo_info.hasPublic = 'public/' in structure
    repo_info.hasAssets = 'assets/' in structure or 'static/' in structure
    repo_info.hasData = 'data/' in structure or 'json' in structure or 'csv' in structure
    repo_info.hasImages = 'images/' in structure or 'img/' in structure or '.png' in structure or '.jpg' in structure
    repo_info.hasScripts = 'scripts/' in structure or '.sh' in structure or '.bat' in structure
    repo_info.hasUtils = 'utils/' in structure or 'helpers/' in structure or 'lib/' in structure
    repo_info.hasComponents = 'components/' in structure
    repo_info.hasPages = 'pages/' in structure or 'views/' in structure
    repo_info.hasServices = 'services/' in structure or 'api/' in structure
    repo_info.hasModels = 'models/' in structure or 'types/' in structure or 'interfaces/' in structure
    
    # Determine project type
    repo_info.isPythonProject = repo_info.hasRequirements or '.py' in structure
    repo_info.isNodeProject = repo_info.hasPackageJson or 'node_modules' in structure
    repo_info.isWebProject = repo_info.hasHTML or repo_info.hasCSS or repo_info.hasReact
    repo_info.isCLIProject = repo_info.hasMainFile and not repo_info.isWebProject
    repo_info.isLibrary = repo_info.hasSrc and not repo_info.hasHTML
    
    return repo_info

async def analyze_repository_structure(owner: str, repo: str, headers: dict) -> str:
    try:
        structure = await fetch_repository_structure(owner, repo, "", headers)
        return structure
    except Exception as e:
        print(f'Error analyzing repository structure: {e}')
        return 'Unable to analyze repository structure'

async def fetch_repository_structure(owner: str, repo: str, path: str, headers: dict) -> str:
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}" if path else f"https://api.github.com/repos/{owner}/{repo}/contents"
    
    response = requests.get(url, headers=headers)
    if not response.ok:
        return ""
    
    contents = response.json()
    structure = []
    
    for item in contents:
        if item['type'] == 'file':
            structure.append(item['name'])
        elif item['type'] == 'dir':
            structure.append(f"{item['name']}/")
            # Recursively fetch subdirectory contents (limited depth)
            if path.count('/') < 2:  # Limit depth to avoid too many requests
                sub_structure = await fetch_repository_structure(owner, repo, f"{path}/{item['name']}" if path else item['name'], headers)
                if sub_structure:
                    structure.extend([f"  {line}" for line in sub_structure.split('\n') if line.strip()])
    
    return '\n'.join(structure)

def generate_response(prompt: str, input_data: dict) -> str:
    try:
        groq_model = ChatGroq(
            api_key=os.getenv('GROQ_API_KEY'),
            model="qwen/qwen3-32b"
        )
        
        prompt_template = ChatPromptTemplate.from_template(prompt)
        output_parser = StringOutputParser()
        
        chain = prompt_template.pipe(groq_model).pipe(output_parser)
        response = chain.invoke(input_data)
        return response
    except Exception as e:
        print(f"Error generating response: {e}")
        raise e

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.post("/api/generate-readme")
async def generate_readme(request: RepoRequest):
    try:
        repo_url = request.repoUrl
        print(f"Received request for repo: {repo_url}")
        
        if not repo_url:
            raise HTTPException(status_code=400, detail="Repository URL is required")
        
        # Extract repository info from URL
        import re
        url_match = re.match(r'github\.com/([^\/]+)/([^\/]+)', repo_url)
        if not url_match:
            raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")
        
        owner, repo = url_match.groups()
        print(f"Extracted owner: {owner}, repo: {repo}")
        
        # Fetch repository data from GitHub
        print("Fetching repository data from GitHub...")
        repo_data = await fetch_github_data(owner, repo)
        print("Repository data fetched successfully")
        
        if not os.getenv('GROQ_API_KEY'):
            print("GROQ_API_KEY is not configured, returning demo response")
            # Return a demo response for testing
            demo_readme = f"""# 🚀 {repo_data.name}

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/{owner}/{repo})
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/{owner}/{repo}/releases)
[![License](https://img.shields.io/badge/license-{repo_data.license.name if repo_data.license else 'MIT'}-green)](https://github.com/{owner}/{repo}/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/{owner}/{repo})](https://github.com/{owner}/{repo}/stargazers)

> {repo_data.description or 'A modern, high-performance project built with cutting-edge technologies.'}

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🎯 Usage](#-usage)
- [🏗️ Architecture](#️-architecture)
{'- [🧪 Testing](#-testing)' if repo_data.hasTests else ''}{'- [📚 API Reference](#-api-reference)' if repo_data.hasAPI else ''}{'- [🚀 Deployment](#-deployment)' if repo_data.hasDocker or repo_data.hasCI else ''}- [📄 License](#-license)

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🚀 **High Performance** | Optimized for speed and efficiency | ✅ |
| 🎯 **Modern Stack** | Built with {repo_data.language} | ✅ |
| 🔧 **Developer Friendly** | Easy to use and contribute to | ✅ |
| 📚 **Well Documented** | Comprehensive documentation and examples | ✅ |
| 🛡️ **Type Safe** | Full TypeScript support | ✅ |
| 🌐 **Cross Platform** | Works on all major platforms | ✅ |

### Repository Stats

- **⭐ Stars**: {repo_data.stargazers_count}
- **🍴 Forks**: {repo_data.forks_count}
- **🔤 Language**: {repo_data.language}
- **📦 Topics**: {', '.join(repo_data.topics)}

## 🚀 Quick Start

Get started in under 5 minutes:

```bash
# Clone the repository
git clone https://github.com/{owner}/{repo}.git

# Navigate to the project directory
cd {repo}

# Install dependencies
npm install

# Start development server
npm run dev
```

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Install via npm

```bash
npm install {repo}
```

### Install via yarn

```bash
yarn add {repo}
```

## 🎯 Usage

### Basic Example

```javascript
import {{ {repo} }} from '{repo}';

// Initialize the library
const instance = new {repo}({{
  apiKey: 'your-api-key',
  environment: 'production'
}});

// Use the library
const result = await instance.process({{
  data: 'your-data',
  options: {{
    optimize: true,
    cache: true
  }}
}});

console.log('Result:', result);
```

## 🏗️ Architecture

```
{repo}/
{repo_data.structure}
```

{('## 🧪 Testing\n\n### Run Tests\n\n```bash\n# Run all tests\nnpm test\n\n# Run tests in watch mode\nnpm run test:watch\n\n# Run tests with coverage\nnpm run test:coverage\n```\n\n### Test Structure\n\n```\ntests/\n├── unit/              # Unit tests\n├── integration/       # Integration tests\n├── e2e/              # End-to-end tests\n└── fixtures/         # Test data\n```') if repo_data.hasTests else ''}

{('## 📚 API Reference\n\n### Core Methods\n\n#### `new {repo}(config)`\n\nCreates a new instance.\n\n**Parameters:**\n- `config` (Object): Configuration options\n\n**Returns:** {repo} instance\n\n#### `instance.process(data, options)`\n\nProcesses data with the library.\n\n**Parameters:**\n- `data` (Any): Input data\n- `options` (Object): Processing options\n\n**Returns:** Promise<Result>') if repo_data.hasAPI else ''}

{('## 🚀 Deployment\n\n### Production Deployment\n\n```bash\n# Build for production\nnpm run build\n\n# Start production server\nnpm start\n```\n\n' + ('### Docker Deployment\n\n```dockerfile\nFROM node:18-alpine\n\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\n\nCOPY . .\nEXPOSE 3000\n\nCMD ["npm", "start"]\n```') if repo_data.hasDocker else '') if repo_data.hasDocker or repo_data.hasCI else ''}

## 📄 License

This project is licensed under the {repo_data.license.name if repo_data.license else 'MIT'} License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/{owner}/{repo})](https://github.com/{owner}/{repo}/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/{owner}/{repo})](https://github.com/{owner}/{repo}/network)
[![GitHub issues](https://img.shields.io/github/issues/{owner}/{repo})](https://github.com/{owner}/{repo}/issues)

</div>

---

**Note**: This is a demo README generated by GitReadme AI. To get a real AI-generated README, please configure your GROQ_API_KEY in .env"""
            
            return {"readme": demo_readme}
        
        # Create a comprehensive prompt for generating README based on actual repository data
        repo_info = f"""Repository Information:
- Name: {repo_data.name or 'Unknown'}
- Description: {repo_data.description or 'No description available'}
- Primary Language: {repo_data.language or 'Unknown'}
- Topics: {', '.join(repo_data.topics) if repo_data.topics else 'No topics'}
- Stars: {repo_data.stargazers_count or 0}
- Forks: {repo_data.forks_count or 0}
- License: {repo_data.license.name if repo_data.license else 'Not specified'}"""

        repo_structure = f"Repository Structure:\n{repo_data.structure or 'No structure available'}"

        package_info = f"Package.json (if available):\n{json.dumps(repo_data.packageJson, indent=2) if repo_data.packageJson else 'Not available'}"

        existing_readme = f"Existing README (if any):\n{repo_data.readme[:1000] + '...' if repo_data.readme else 'No existing README found'}"

        repo_analysis = f"""Repository Analysis:
- Project Type: {'Python' if repo_data.isPythonProject else 'Node.js' if repo_data.isNodeProject else 'Web' if repo_data.isWebProject else 'CLI' if repo_data.isCLIProject else 'Library' if repo_data.isLibrary else 'Unknown'}
- Has Main File: {'Yes' if repo_data.hasMainFile else 'No'}
- Has Package Manager: {'npm/yarn' if repo_data.hasPackageJson else 'pip' if repo_data.hasRequirements else 'None'}
- Has Source Code: {'Yes' if repo_data.hasSrc else 'No'}
- Has Utils/Helpers: {'Yes' if repo_data.hasUtils else 'No'}
- Has Data Files: {'Yes' if repo_data.hasData else 'No'}
- Has Images: {'Yes' if repo_data.hasImages else 'No'}
- Has Configuration: {'Yes' if repo_data.hasConfig else 'No'}
- Has Tests: {'Yes' if repo_data.hasTests else 'No'}
- Has Documentation: {'Yes' if repo_data.hasDocs else 'No'}
- Has Examples: {'Yes' if repo_data.hasExamples else 'No'}
- Has Docker: {'Yes' if repo_data.hasDocker else 'No'}
- Has CI/CD: {'Yes' if repo_data.hasCI else 'No'}"""

        prompt = f"""You are an expert developer, technical writer, and open-source advocate. 

CRITICAL: Generate ONLY the final README.md content. Do NOT include any thinking process, analysis, explanations, or thinking tags. Start directly with the README title and content.

IMPORTANT: Do NOT include <think> tags, thinking process, analysis, or any meta-commentary in your output. Generate ONLY the README content.

Analyze the provided repository data and generate a world-class, professional README.md file that accurately reflects the actual codebase and features.

{repo_info}

{repo_structure}

{package_info}

{existing_readme}

{repo_analysis}

CRITICAL REQUIREMENTS:

1. ANALYZE THE ACTUAL FILE STRUCTURE - Look at the files listed and understand what this project does
2. GENERATE CONTENT BASED ON REAL FILES - Only mention features that exist in the file structure
3. USE THE ACTUAL PROJECT NAME - Use "{repo_data.name or 'Unknown'}" throughout, not generic placeholders
4. CREATE MEANINGFUL CONTENT - Describe what the actual files do based on their names
5. AVOID GENERIC TEMPLATES - Make it specific to this exact repository
6. INCLUDE REAL EXAMPLES - Show how to run the actual files present
7. DESCRIBE ACTUAL FEATURES - Based on the file structure, explain what the project does
8. USE PROPER INSTALLATION INSTRUCTIONS - Based on the actual package manager files
9. INCLUDE REAL USAGE EXAMPLES - Show how to run the main files that exist
10. MAKE IT ENGAGING - Use the actual project name and make it interesting

BASED ON THE FILE STRUCTURE, CREATE A README THAT:

HERO SECTION:
- Use the actual project name: {repo_data.name or 'Unknown'}
- Write a compelling description based on the file structure and project type
- Include relevant badges for the actual project
- Make it exciting and professional

FEATURES SECTION:
- Analyze the file structure and describe what this project actually does
- List real features based on the code files present
- If it is a Python project, mention Python-specific features
- If it is a Node.js project, mention JavaScript/TypeScript features
- If it is a web project, mention web technologies used
- If it is a CLI tool, mention command-line features
- Do not make up features that do not exist

INSTALLATION:
- For Python projects: Use pip install -r requirements.txt
- For Node.js projects: Use npm install or yarn install
- For simple projects: Use git clone instructions
- Make it specific to this project setup

USAGE:
- For Python projects: Show python app.py or python main.py
- For Node.js projects: Show npm start or node index.js
- For web projects: Show how to start the development server
- For CLI tools: Show command-line usage examples
- Use the actual project name and file paths

CRITICAL OUTPUT REQUIREMENTS:
- Generate ONLY the final README.md content
- Do NOT include any thinking process, analysis, or explanations
- Do NOT include any thinking tags or similar markers
- Do NOT include any meta-commentary about what you are doing
- Start directly with the README title and content
- End with the README content only
- The output should be a clean, professional README.md file

CONTENT REQUIREMENTS:
- Do NOT generate generic content
- Analyze the file structure and create content that is specific to what this project actually does
- If the repository is empty or has minimal content, acknowledge that and provide appropriate guidance for contributors
- Base all content on the actual files present in the repository
- Use the project type (Python, Node.js, Web, CLI, Library) to guide the content generation"""

        print("Generating response with LangChain based on actual repository data...")
        print(f"Repository data: name={repo_data.name}, description={repo_data.description}, language={repo_data.language}")
        
        try:
            response = generate_response(prompt, {
                "repoData": repo_data.__dict__,
                "owner": owner,
                "repo": repo,
                "repoUrl": repo_url,
            })
            
            print("Generated README successfully based on repository analysis")
            # Remove any <think>...</think> tags from the output
            cleaned_readme = response.replace(r'<think>.*?</think>', '', flags=re.DOTALL).strip() if isinstance(response, str) else response

            return {"readme": cleaned_readme}
        except Exception as e:
            print(f"Error generating README: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate README: {str(e)}")
    
    except Exception as e:
        print(f"API Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate README: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)