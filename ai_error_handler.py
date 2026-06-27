import os
import sys
import json
import urllib.request

def analyze_error_with_ai(error_message):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable is not set.")
        print("Please export or set it before running this script.")
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    
    prompt = f"""You are an expert software debugger. Analyze the following error trace and suggest a clear, developer-friendly code fix:

{error_message}

Provide:
1. Root cause analysis
2. Exact steps to fix
3. Code diff or replacement code snippet if applicable."""

    data = {
        "model": "openrouter/free",
        "messages": [
            {"role": "system", "content": "You are a senior debugging assistant. Solve developer code issues concisely."},
            {"role": "user", "content": prompt}
        ]
    }
    
    try:
        req = urllib.request.Request(
            url, 
            data=json.dumps(data).encode("utf-8"), 
            headers=headers, 
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            res_data = json.loads(res_body)
            answer = res_data["choices"][0]["message"]["content"]
            print("\n=== AI ERROR ANALYSIS ===")
            print(answer)
            print("==========================\n")
    except Exception as e:
        print(f"Failed to communicate with OpenRouter: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ai_error_handler.py \"<error message>\" OR python ai_error_handler.py <log_file_path>")
        sys.exit(1)
        
    arg = sys.argv[1]
    if os.path.exists(arg):
        with open(arg, "r", encoding="utf-8") as f:
            error_input = f.read()
    else:
        error_input = arg

    analyze_error_with_ai(error_input)
