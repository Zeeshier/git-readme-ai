import { NextRequest, NextResponse } from "next/server";
import { generateResponse } from "@/lib/langchain";

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  content?: string;
  download_url?: string;
}

interface RepositoryData {
  name: string;
  description: string;
  language: string;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  license?: {
    name: string;
  };
  readme?: string;
  packageJson?: any;
  files: GitHubFile[];
  structure: string;
  hasChangelog: boolean;
  hasContributing: boolean;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  hasAPI: boolean;
  hasDocs: boolean;
  hasBenchmarks: boolean;
  hasExamples: boolean;
  hasPackageJson: boolean;
  hasRequirements: boolean;
  hasMainFile: boolean;
  hasHTML: boolean;
  hasCSS: boolean;
  hasReact: boolean;
  hasNodeModules: boolean;
  hasGit: boolean;
  hasConfig: boolean;
  hasSrc: boolean;
  hasDist: boolean;
  hasPublic: boolean;
  hasAssets: boolean;
  hasData: boolean;
  hasImages: boolean;
  hasScripts: boolean;
  hasUtils: boolean;
  hasComponents: boolean;
  hasPages: boolean;
  hasServices: boolean;
  hasModels: boolean;
  isPythonProject: boolean;
  isNodeProject: boolean;
  isWebProject: boolean;
  isCLIProject: boolean;
  isLibrary: boolean;
}

async function fetchGitHubData(owner: string, repo: string): Promise<RepositoryData> {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };

  // Add GitHub token if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  } else {
    console.log('No GITHUB_TOKEN provided. Using unauthenticated requests with lower rate limits.');
  }

  // Fetch repository metadata
  const repoResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers }
  );
  
  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      throw new Error(`Repository not found: ${owner}/${repo}`);
    } else if (repoResponse.status === 403) {
      throw new Error(`Rate limit exceeded. Please add GITHUB_TOKEN to .env.local for higher limits.`);
    } else {
      throw new Error(`Failed to fetch repository: ${repoResponse.statusText}`);
    }
  }
  
  const repoData = await repoResponse.json();

  // Fetch repository contents
  const contentsResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents`,
    { headers }
  );
  
  if (!contentsResponse.ok) {
    if (contentsResponse.status === 403) {
      throw new Error(`Rate limit exceeded. Please add GITHUB_TOKEN to .env.local for higher limits.`);
    } else {
      throw new Error(`Failed to fetch repository contents: ${contentsResponse.statusText}`);
    }
  }
  
  const contents = await contentsResponse.json();

  // Fetch README if it exists
  let readme = '';
  try {
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    );
    if (readmeResponse.ok) {
      const readmeData = await readmeResponse.json();
      readme = Buffer.from(readmeData.content, 'base64').toString();
    }
  } catch (error) {
    console.log('No README found or error fetching README');
  }

  // Fetch package.json if it exists
  let packageJson = null;
  try {
    const packageResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/package.json`,
      { headers }
    );
    if (packageResponse.ok) {
      const packageData = await packageResponse.json();
      const packageContent = Buffer.from(packageData.content, 'base64').toString();
      packageJson = JSON.parse(packageContent);
    }
  } catch (error) {
    console.log('No package.json found or error fetching package.json');
  }

  // Analyze repository structure
  const files: GitHubFile[] = [];
  const structure = await analyzeRepositoryStructure(owner, repo, headers);
  
  // Analyze what documentation and config files exist
  const hasChangelog = structure.includes('CHANGELOG.md') || structure.includes('CHANGELOG');
  const hasContributing = structure.includes('CONTRIBUTING.md') || structure.includes('CONTRIBUTING');
  const hasTests = structure.includes('test') || structure.includes('tests') || structure.includes('__tests__') || structure.includes('.test.') || structure.includes('.spec.');
  const hasDocker = structure.includes('Dockerfile') || structure.includes('docker-compose');
  const hasCI = structure.includes('.github/workflows') || structure.includes('.gitlab-ci.yml') || structure.includes('travis.yml') || structure.includes('circle.yml');
  const hasAPI = structure.includes('api') || structure.includes('routes') || structure.includes('controllers');
  const hasDocs = structure.includes('docs') || structure.includes('documentation');
  const hasBenchmarks = structure.includes('benchmark') || structure.includes('performance');
  const hasExamples = structure.includes('examples') || structure.includes('demo');
  
  // Analyze project type and main files
  const hasPackageJson = structure.includes('package.json');
  const hasRequirements = structure.includes('requirements.txt') || structure.includes('Pipfile') || structure.includes('pyproject.toml');
  const hasMainFile = structure.includes('index.js') || structure.includes('index.ts') || structure.includes('main.js') || structure.includes('main.ts') || structure.includes('app.js') || structure.includes('app.ts') || structure.includes('app.py') || structure.includes('main.py');
  const hasHTML = structure.includes('index.html') || structure.includes('.html');
  const hasCSS = structure.includes('.css') || structure.includes('.scss') || structure.includes('.sass');
  const hasReact = structure.includes('react') || structure.includes('jsx') || structure.includes('tsx');
  const hasNodeModules = structure.includes('node_modules');
  const hasGit = structure.includes('.gitignore');
  const hasConfig = structure.includes('config') || structure.includes('.env') || structure.includes('.config');
  const hasSrc = structure.includes('src/');
  const hasDist = structure.includes('dist/') || structure.includes('build/');
  const hasPublic = structure.includes('public/');
  const hasAssets = structure.includes('assets/') || structure.includes('static/');
  const hasData = structure.includes('data/') || structure.includes('json') || structure.includes('csv');
  const hasImages = structure.includes('images/') || structure.includes('img/') || structure.includes('.png') || structure.includes('.jpg') || structure.includes('.svg');
  const hasScripts = structure.includes('scripts/') || structure.includes('.sh') || structure.includes('.bat');
  const hasUtils = structure.includes('utils/') || structure.includes('helpers/') || structure.includes('lib/') || structure.includes('utils.py') || structure.includes('utils.js');
  const hasComponents = structure.includes('components/') || structure.includes('components.js') || structure.includes('components.ts');
  const hasPages = structure.includes('pages/') || structure.includes('views/');
  const hasServices = structure.includes('services/') || structure.includes('api/');
  const hasModels = structure.includes('models/') || structure.includes('types/') || structure.includes('interfaces/');
  
  // Determine project type
  const isPythonProject = hasRequirements || structure.includes('.py');
  const isNodeProject = hasPackageJson || structure.includes('node_modules');
  const isWebProject = hasHTML || hasCSS || hasReact;
  const isCLIProject = hasMainFile && !isWebProject;
  const isLibrary = hasSrc && !hasHTML;

  return {
    name: repoData.name,
    description: repoData.description || '',
    language: repoData.language || 'Unknown',
    topics: repoData.topics || [],
    stargazers_count: repoData.stargazers_count,
    forks_count: repoData.forks_count,
    license: repoData.license,
    readme,
    packageJson,
    files,
    structure,
    hasChangelog,
    hasContributing,
    hasTests,
    hasDocker,
    hasCI,
    hasAPI,
    hasDocs,
    hasBenchmarks,
    hasExamples,
    hasPackageJson,
    hasRequirements,
    hasMainFile,
    hasHTML,
    hasCSS,
    hasReact,
    hasNodeModules,
    hasGit,
    hasConfig,
    hasSrc,
    hasDist,
    hasPublic,
    hasAssets,
    hasData,
    hasImages,
    hasScripts,
    hasUtils,
    hasComponents,
    hasPages,
    hasServices,
    hasModels,
    isPythonProject,
    isNodeProject,
    isWebProject,
    isCLIProject,
    isLibrary
  };
}

async function analyzeRepositoryStructure(owner: string, repo: string, headers: HeadersInit): Promise<string> {
  try {
    // Fetch repository structure recursively
    const structure = await fetchRepositoryStructure(owner, repo, '', headers);
    return structure;
  } catch (error) {
    console.error('Error analyzing repository structure:', error);
    return 'Unable to analyze repository structure';
  }
}

async function fetchRepositoryStructure(owner: string, repo: string, path: string, headers: HeadersInit): Promise<string> {
  const url = path 
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    return '';
  }
  
  const contents = await response.json();
  let structure = '';
  
  // Sort contents: directories first, then files
  const sortedContents = contents.sort((a: any, b: any) => {
    if (a.type === 'dir' && b.type !== 'dir') return -1;
    if (a.type !== 'dir' && b.type === 'dir') return 1;
    return a.name.localeCompare(b.name);
  });
  
  for (const item of sortedContents) {
    if (item.type === 'dir') {
      structure += `📁 ${item.name}/\n`;
      const subStructure = await fetchRepositoryStructure(owner, repo, item.path, headers);
      if (subStructure) {
        structure += subStructure.split('\n').map(line => `  ${line}`).join('\n') + '\n';
      }
    } else {
      const ext = item.name.split('.').pop() || '';
      const icon = getFileIcon(ext);
      structure += `${icon} ${item.name}\n`;
    }
  }
  
  return structure;
}

function getFileIcon(extension: string): string {
  const icons: { [key: string]: string } = {
    'js': '📄',
    'ts': '📄',
    'jsx': '⚛️',
    'tsx': '⚛️',
    'json': '📋',
    'md': '📝',
    'yml': '⚙️',
    'yaml': '⚙️',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'sass': '🎨',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚡',
    'c': '⚡',
    'go': '🐹',
    'rs': '🦀',
    'php': '🐘',
    'rb': '💎',
    'sh': '🐚',
    'dockerfile': '🐳',
    'gitignore': '🚫',
    'env': '🔐',
    'lock': '🔒'
  };
  
  return icons[extension.toLowerCase()] || '📄';
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();
    console.log("Received request for repo:", repoUrl);

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Extract repository info from URL
    const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    const [, owner, repo] = urlMatch;
    console.log("Extracted owner:", owner, "repo:", repo);

    // Fetch repository data from GitHub
    console.log("Fetching repository data from GitHub...");
    const repoData = await fetchGitHubData(owner, repo);
    console.log("Repository data fetched successfully");

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured, returning demo response");
      // Return a demo response for testing
      const demoReadme = `# 🚀 ${repoData.name}

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/${owner}/${repo})
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/${owner}/${repo}/releases)
[![License](https://img.shields.io/badge/license-${repoData.license?.name || 'MIT'}-green)](https://github.com/${owner}/${repo}/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/${owner}/${repo})](https://github.com/${owner}/${repo}/stargazers)

> ${repoData.description || 'A modern, high-performance project built with cutting-edge technologies.'}

## 📋 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [🎯 Usage](#-usage)
- [🏗️ Architecture](#️-architecture)
${repoData.hasTests ? '- [🧪 Testing](#-testing)\n' : ''}${repoData.hasAPI ? '- [📚 API Reference](#-api-reference)\n' : ''}${repoData.hasDocker || repoData.hasCI ? '- [🚀 Deployment](#-deployment)\n' : ''}- [📄 License](#-license)

## ✨ Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🚀 **High Performance** | Optimized for speed and efficiency | ✅ |
| 🎯 **Modern Stack** | Built with ${repoData.language} | ✅ |
| 🔧 **Developer Friendly** | Easy to use and contribute to | ✅ |
| 📚 **Well Documented** | Comprehensive documentation and examples | ✅ |
| 🛡️ **Type Safe** | Full TypeScript support | ✅ |
| 🌐 **Cross Platform** | Works on all major platforms | ✅ |

### Repository Stats

- **⭐ Stars**: ${repoData.stargazers_count}
- **🍴 Forks**: ${repoData.forks_count}
- **🔤 Language**: ${repoData.language}
- **📦 Topics**: ${repoData.topics.join(', ')}

## 🚀 Quick Start

Get started in under 5 minutes:

\`\`\`bash
# Clone the repository
git clone https://github.com/${owner}/${repo}.git

# Navigate to the project directory
cd ${repo}

# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Install via npm

\`\`\`bash
npm install ${repo}
\`\`\`

### Install via yarn

\`\`\`bash
yarn add ${repo}
\`\`\`

## 🎯 Usage

### Basic Example

\`\`\`javascript
import { ${repo} } from '${repo}';

// Initialize the library
const instance = new ${repo}({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Use the library
const result = await instance.process({
  data: 'your-data',
  options: {
    optimize: true,
    cache: true
  }
});

console.log('Result:', result);
\`\`\`

## 🏗️ Architecture

\`\`\`
${repo}/
${repoData.structure}
\`\`\`

${repoData.hasTests ? `## 🧪 Testing

### Run Tests

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
\`\`\`

### Test Structure

\`\`\`
tests/
├── unit/              # Unit tests
├── integration/       # Integration tests
├── e2e/              # End-to-end tests
└── fixtures/         # Test data
\`\`\`
` : ''}

${repoData.hasAPI ? `## 📚 API Reference

### Core Methods

#### \`new ${repo}(config)\`

Creates a new instance.

**Parameters:**
- \`config\` (Object): Configuration options

**Returns:** ${repo} instance

#### \`instance.process(data, options)\`

Processes data with the library.

**Parameters:**
- \`data\` (Any): Input data
- \`options\` (Object): Processing options

**Returns:** Promise<Result>
` : ''}

${repoData.hasDocker || repoData.hasCI ? `## 🚀 Deployment

### Production Deployment

\`\`\`bash
# Build for production
npm run build

# Start production server
npm start
\`\`\`

${repoData.hasDocker ? `### Docker Deployment

\`\`\`dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
\`\`\`
` : ''}
` : ''}

## 📄 License

This project is licensed under the ${repoData.license?.name || 'MIT'} License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[![GitHub stars](https://img.shields.io/github/stars/${owner}/${repo})](https://github.com/${owner}/${repo}/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/${owner}/${repo})](https://github.com/${owner}/${repo}/network)
[![GitHub issues](https://img.shields.io/github/issues/${owner}/${repo})](https://github.com/${owner}/${repo}/issues)

</div>

---

**Note**: This is a demo README generated by GitReadme AI. To get a real AI-generated README, please configure your GROQ_API_KEY in .env.local`;

      return NextResponse.json({ readme: demoReadme });
    }

    // Create a comprehensive prompt for generating README based on actual repository data
    const repoInfo = 'Repository Information:\n' +
      '- Name: ' + (repoData.name || 'Unknown') + '\n' +
      '- Description: ' + (repoData.description || 'No description available') + '\n' +
      '- Primary Language: ' + (repoData.language || 'Unknown') + '\n' +
      '- Topics: ' + (repoData.topics ? repoData.topics.join(', ') : 'No topics') + '\n' +
      '- Stars: ' + (repoData.stargazers_count || 0) + '\n' +
      '- Forks: ' + (repoData.forks_count || 0) + '\n' +
      '- License: ' + (repoData.license?.name || 'Not specified');

    const repoStructure = 'Repository Structure:\n' + (repoData.structure || 'No structure available');

    const packageInfo = 'Package.json (if available):\n' + 
      (repoData.packageJson ? JSON.stringify(repoData.packageJson, null, 2) : 'Not available');

    const existingReadme = 'Existing README (if any):\n' + 
      (repoData.readme ? repoData.readme.substring(0, 1000) + '...' : 'No existing README found');

    const repoAnalysis = 'Repository Analysis:\n' +
      '- Project Type: ' + (repoData.isPythonProject ? 'Python' : repoData.isNodeProject ? 'Node.js' : repoData.isWebProject ? 'Web' : repoData.isCLIProject ? 'CLI' : repoData.isLibrary ? 'Library' : 'Unknown') + '\n' +
      '- Has Main File: ' + (repoData.hasMainFile ? 'Yes' : 'No') + '\n' +
      '- Has Package Manager: ' + (repoData.hasPackageJson ? 'npm/yarn' : repoData.hasRequirements ? 'pip' : 'None') + '\n' +
      '- Has Source Code: ' + (repoData.hasSrc ? 'Yes' : 'No') + '\n' +
      '- Has Utils/Helpers: ' + (repoData.hasUtils ? 'Yes' : 'No') + '\n' +
      '- Has Data Files: ' + (repoData.hasData ? 'Yes' : 'No') + '\n' +
      '- Has Images: ' + (repoData.hasImages ? 'Yes' : 'No') + '\n' +
      '- Has Configuration: ' + (repoData.hasConfig ? 'Yes' : 'No') + '\n' +
      '- Has Tests: ' + (repoData.hasTests ? 'Yes' : 'No') + '\n' +
      '- Has Documentation: ' + (repoData.hasDocs ? 'Yes' : 'No') + '\n' +
      '- Has Examples: ' + (repoData.hasExamples ? 'Yes' : 'No') + '\n' +
      '- Has Docker: ' + (repoData.hasDocker ? 'Yes' : 'No') + '\n' +
      '- Has CI/CD: ' + (repoData.hasCI ? 'Yes' : 'No');

    const prompt = 'You are an expert developer, technical writer, and open-source advocate. \n\n' +
      'CRITICAL: Generate ONLY the final README.md content. Do NOT include any thinking process, analysis, explanations, or thinking tags. Start directly with the README title and content.\n\n' +
      'IMPORTANT: Do NOT include <think> tags, thinking process, analysis, or any meta-commentary in your output. Generate ONLY the README content.\n\n' +
      'Analyze the provided repository data and generate a world-class, professional README.md file that accurately reflects the actual codebase and features.\n\n' +
      repoInfo + '\n\n' +
      repoStructure + '\n\n' +
      packageInfo + '\n\n' +
      existingReadme + '\n\n' +
      repoAnalysis + '\n\n' +
      'CRITICAL REQUIREMENTS:\n\n' +
      '1. ANALYZE THE ACTUAL FILE STRUCTURE - Look at the files listed and understand what this project does\n' +
      '2. GENERATE CONTENT BASED ON REAL FILES - Only mention features that exist in the file structure\n' +
      '3. USE THE ACTUAL PROJECT NAME - Use "' + (repoData.name || 'Unknown') + '" throughout, not generic placeholders\n' +
      '4. CREATE MEANINGFUL CONTENT - Describe what the actual files do based on their names\n' +
      '5. AVOID GENERIC TEMPLATES - Make it specific to this exact repository\n' +
      '6. INCLUDE REAL EXAMPLES - Show how to run the actual files present\n' +
      '7. DESCRIBE ACTUAL FEATURES - Based on the file structure, explain what the project does\n' +
      '8. USE PROPER INSTALLATION INSTRUCTIONS - Based on the actual package manager files\n' +
      '9. INCLUDE REAL USAGE EXAMPLES - Show how to run the main files that exist\n' +
      '10. MAKE IT ENGAGING - Use the actual project name and make it interesting\n\n' +
      'BASED ON THE FILE STRUCTURE, CREATE A README THAT:\n\n' +
      'HERO SECTION:\n' +
      '- Use the actual project name: ' + (repoData.name || 'Unknown') + '\n' +
      '- Write a compelling description based on the file structure and project type\n' +
      '- Include relevant badges for the actual project\n' +
      '- Make it exciting and professional\n\n' +
      'FEATURES SECTION:\n' +
      '- Analyze the file structure and describe what this project actually does\n' +
      '- List real features based on the code files present\n' +
      '- If it is a Python project, mention Python-specific features\n' +
      '- If it is a Node.js project, mention JavaScript/TypeScript features\n' +
      '- If it is a web project, mention web technologies used\n' +
      '- If it is a CLI tool, mention command-line features\n' +
      '- Do not make up features that do not exist\n\n' +
      'INSTALLATION:\n' +
      '- For Python projects: Use pip install -r requirements.txt\n' +
      '- For Node.js projects: Use npm install or yarn install\n' +
      '- For simple projects: Use git clone instructions\n' +
      '- Make it specific to this project setup\n\n' +
      'USAGE:\n' +
      '- For Python projects: Show python app.py or python main.py\n' +
      '- For Node.js projects: Show npm start or node index.js\n' +
      '- For web projects: Show how to start the development server\n' +
      '- For CLI tools: Show command-line usage examples\n' +
      '- Use the actual project name and file paths\n\n' +
      'CRITICAL OUTPUT REQUIREMENTS:\n' +
      '- Generate ONLY the final README.md content\n' +
      '- Do NOT include any thinking process, analysis, or explanations\n' +
      '- Do NOT include any thinking tags or similar markers\n' +
      '- Do NOT include any meta-commentary about what you are doing\n' +
      '- Start directly with the README title and content\n' +
      '- End with the README content only\n' +
      '- The output should be a clean, professional README.md file\n\n' +
      'CONTENT REQUIREMENTS:\n' +
      '- Do NOT generate generic content\n' +
      '- Analyze the file structure and create content that is specific to what this project actually does\n' +
      '- If the repository is empty or has minimal content, acknowledge that and provide appropriate guidance for contributors\n' +
      '- Base all content on the actual files present in the repository\n' +
      '- Use the project type (Python, Node.js, Web, CLI, Library) to guide the content generation';

    console.log("Generating response with LangChain based on actual repository data...");
    console.log("Repository data:", {
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      structure: repoData.structure?.substring(0, 200) + '...'
    });
    
    try {
      const response = await generateResponse(prompt, {
        repoData,
        owner,
        repo,
        repoUrl,
      });
      
      console.log("Generated README successfully based on repository analysis");
      // Remove any <think>...</think> tags from the output
      const cleanedReadme = typeof response === 'string'
        ? response.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
        : response;

      return NextResponse.json({ readme: cleanedReadme });
    } catch (error) {
      console.error("Error generating README:", error);
      return NextResponse.json(
        { error: `Failed to generate README: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: `Failed to generate README: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 