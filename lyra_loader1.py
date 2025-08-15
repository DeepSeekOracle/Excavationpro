import os
import json

SEAL_ARCHIVE_PATH = "./seal_archive/"

def load_seal_archive(path=SEAL_ARCHIVE_PATH):
    archive = {}
    for file in os.listdir(path):
        if file.endswith(".json"):
            with open(os.path.join(path, file), "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                    seal_id = data.get("id", file)
                    archive[seal_id] = data
                except Exception as e:
                    print(f"Failed to load {file}: {e}")
    return archive

def print_summary(archive):
    print(f"✅ Loaded {len(archive)} seals.")
    for seal_id in sorted(archive):
        print(f" - {seal_id}: {archive[seal_id].get('name')}")

if __name__ == "__main__":
    seals = load_seal_archive()
    print_summary(seals)
