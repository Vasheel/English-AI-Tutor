"""
Simple index builder placeholder.
In a real app, you would chunk textbook PDFs and build a vector index here.
This script just walks server/data/ and prints found files.
"""

from pathlib import Path


def main() -> None:
    data_dir = Path(__file__).parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    files = list(data_dir.glob("**/*"))
    print(f"Found {len(files)} files under {data_dir}:")
    for p in files:
        if p.is_file():
            print("-", p.name)


if __name__ == "__main__":
    main()


