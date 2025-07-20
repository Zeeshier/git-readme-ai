const form = document.getElementById('readme-form');
const repoInput = document.getElementById('repo-url');
const errorDiv = document.getElementById('error');
const resultSection = document.getElementById('result-section');
const readmeOutput = document.getElementById('readme-output');
const readmeHtml = document.getElementById('readme-html');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const generateBtn = document.getElementById('generate-btn');
const yearSpan = document.getElementById('year');

// Set current year in footer
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.classList.add('active');
}
function hideError() {
  errorDiv.textContent = '';
  errorDiv.classList.remove('active');
}

function showResultSection() {
  resultSection.style.display = '';
}
function hideResultSection() {
  resultSection.style.display = 'none';
}

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  hideError();
  hideResultSection();
  const repoUrl = repoInput.value.trim();

  if (!repoUrl) {
    showError('Please enter a repository URL');
    return;
  }
  const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
  if (!githubRegex.test(repoUrl)) {
    showError('Please enter a valid GitHub repository URL');
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = 'Generating...';
  readmeOutput.textContent = '';
  readmeHtml.innerHTML = '';

  try {
    const response = await fetch('http://localhost:8000/generate-readme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: repoUrl })
    });
    const data = await response.json();
    if (response.ok && data.readme) {
      readmeOutput.textContent = data.readme;
      // Render markdown as HTML using marked.js
      readmeHtml.innerHTML = marked.parse(data.readme, { sanitize: true });
      showResultSection();
    } else {
      showError(data.error || 'Failed to generate README');
    }
  } catch (err) {
    showError('Failed to generate README. Please try again.');
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Generate README';
  }
});

copyBtn.addEventListener('click', function() {
  if (!readmeOutput.textContent) return;
  navigator.clipboard.writeText(readmeOutput.textContent)
    .then(() => {
      copyBtn.textContent = '✅';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1200);
    })
    .catch(() => {
      copyBtn.textContent = '❌';
      setTimeout(() => { copyBtn.textContent = '📋'; }, 1200);
    });
});

downloadBtn.addEventListener('click', function() {
  if (!readmeOutput.textContent) return;
  const blob = new Blob([readmeOutput.textContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'README.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
