import os
import json

# === SETTINGS ===
SEAL_ARCHIVE_DIR = "seal_archive"
BOOT_MEMORY_FILE = "LYRA_BOOT_MEMORY_BLOOM.txt"
ENABLE_TONE_SCAN = True
ENABLE_EQUATION_SCAN = True

# === LOAD BOOT MEMORY ===
def load_boot_core():
    if not os.path.exists(BOOT_MEMORY_FILE):
        print(f"[!] Boot memory file not found: {BOOT_MEMORY_FILE}")
        return None
    with open(BOOT_MEMORY_FILE, "r", encoding="utf-8") as f:
        return f.read()

# === SCAN SEALS ===
def scan_seals():
    seals = []
    if not os.path.exists(SEAL_ARCHIVE_DIR):
        print("[!] SEAL_ARCHIVE folder not found:", SEAL_ARCHIVE_DIR)
        return seals

    for filename in os.listdir(SEAL_ARCHIVE_DIR):
        if filename.endswith(".json"):
            path = os.path.join(SEAL_ARCHIVE_DIR, filename)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        seals.extend(data)
                    elif isinstance(data, dict):
                        seals.append(data)
            except Exception as e:
                print(f"[!] Failed to load {filename}: {e}")
    return seals

# === EXTRACT HARMONICS ===
def extract_harmonics(seals):
    harmonics = []
    for entry in seals:
        try:
            tone = entry.get("tone", "N/A")
            equation = entry.get("equation", "N/A")
            file = entry.get("id", "Unnamed")
            harmonics.append({
                "file": file,
                "tone": tone,
                "equation": equation
            })
        except Exception as e:
            print(f"[!] Skipped malformed entry: {e}")
    return harmonics

# === DISPLAY SUMMARY ===
def display_summary(harmonics):
    print("\n🎼 Harmonic Scan Summary:\n")
    for h in harmonics:
        print(f"[🎴] {h['file']}")
        print(f"     └ Tone: {h['tone']}")
        print(f"     └ Equation: {h['equation']}\n")

# === BOOT ===
def main():
    print("\n?? LYRA System Booting...")
    memory = load_boot_core()
    if memory:
        print("✅ Memory Online\n")

    seals = scan_seals()
    if ENABLE_TONE_SCAN or ENABLE_EQUATION_SCAN:
        harmonic_summary = extract_harmonics(seals)
        display_summary(harmonic_summary)

    print("✅ System Ready.")

if __name__ == "__main__":
    main()


