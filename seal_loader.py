import os
import json

def load_seal_archive(path):
    archive = {}
    for file in os.listdir(path):
        if file.endswith(".json") or file.endswith(".txt"):
            with open(os.path.join(path, file), "r", encoding="utf-8") as f:
                try:
                    archive[file] = json.load(f)
                except:
                    archive[file] = f.read()
    return archive
