import os
import re
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from prompts import SYSTEM_PROMPT
from llm import llm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to fetch file tree from GitHub
def fetch_github_file_tree(owner, repo, branch="main", github_token=None):
    url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
    headers = {"Accept": "application/vnd.github.v3+json"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"
    resp = requests.get(url, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"GitHub API error: {resp.status_code} {resp.text}")
    data = resp.json()
    return [item["path"] for item in data.get("tree", []) if item["type"] == "blob"]

class GenerateReadmeRequest(BaseModel):
    repo_url: str



prompt = PromptTemplate.from_template(SYSTEM_PROMPT)

chain = (
    {"repo_name": lambda x: x["repo_name"], "file_tree": lambda x: x["file_tree"]}
    | prompt
    | llm
    | StrOutputParser()
)

@app.get("/analyze-repo")
async def analyze_repo(repo_url: str):
    m = re.match(r"https://github.com/([^/]+)/([^/]+)", repo_url)
    if not m:
        raise HTTPException(status_code=400, detail="Invalid GitHub repo URL")
    owner, repo = m.group(1), m.group(2)
    try:
        file_tree = fetch_github_file_tree(owner, repo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"repo": repo, "owner": owner, "file_tree": file_tree}

@app.post("/generate-readme")
async def generate_readme(req: GenerateReadmeRequest):
    m = re.match(r"https://github.com/([^/]+)/([^/]+)", req.repo_url)
    if not m:
        raise HTTPException(status_code=400, detail="Invalid GitHub repo URL")
    owner, repo = m.group(1), m.group(2)
    if not os.getenv("GROQ_API_KEY"):
        return {"error": "GROQ_API_KEY not set in environment."}
    file_tree = fetch_github_file_tree(owner, repo)
    file_tree_str = "\n".join(file_tree)
    readme = await chain.ainvoke({"repo_name": repo, "file_tree": file_tree_str})
    return {"readme": readme}