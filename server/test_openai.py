import os
from dotenv import load_dotenv
from openai import OpenAI

# Load .env from the server directory explicitly so it works when invoked from repo root
ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=ENV_PATH)

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise RuntimeError(
        "OPENAI_API_KEY is not set. Create server/.env with OPENAI_API_KEY=... or set it in your shell."
    )

client = OpenAI(api_key=api_key)
model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

resp = client.chat.completions.create(
    model=model,
    messages=[{"role":"user","content":"Reply with 'OK' if you can read me."}]
)
print(resp.choices[0].message.content)
