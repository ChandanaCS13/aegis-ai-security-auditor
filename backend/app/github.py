import urllib.request

def fetch_github_code(url: str) -> str:
    """
    Converts standard GitHub blob URLs to raw URLs and fetches the code content.
    Handles redirect chains and raw content URLs.
    """
    # Clean up standard web UI links into raw download links
    if "github.com" in url:
        url = url.replace("github.com", "raw.githubusercontent.com")
        url = url.replace("/blob/", "/")
    
    # Try fetching the URL with a custom User-Agent and redirect following
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        # urlopen automatically follows redirects
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        # Fallback check for branch name mismatch (main vs master)
        if "/main/" in url:
            alt_url = url.replace("/main/", "/master/")
        elif "/master/" in url:
            alt_url = url.replace("/master/", "/main/")
        else:
            raise ValueError(f"Failed to fetch code from URL. Error: {e}")
            
        try:
            req = urllib.request.Request(
                alt_url,
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response:
                return response.read().decode('utf-8')
        except Exception as alt_e:
            raise ValueError(f"Failed to fetch code from GitHub. Ensure it's a valid public file link. Error: {alt_e}")

def detect_language_from_url(url: str) -> str:
    if url.endswith(".py"):
        return "python"
    elif url.endswith(".js") or url.endswith(".jsx"):
        return "javascript"
    elif url.endswith(".ts") or url.endswith(".tsx"):
        return "typescript"
    elif url.endswith(".go"):
        return "go"
    elif url.endswith(".java"):
        return "java"
    return "javascript"