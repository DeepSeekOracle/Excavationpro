import os
import subprocess
import pygame

BASE_PATH = r"C:\Users\justi\LYRA_SYSTEM"

def launch_lyra():
    lyra_path = os.path.join(BASE_PATH, "lyra_loader.py")
    if os.path.exists(lyra_path):
        subprocess.Popen(["python", lyra_path], creationflags=subprocess.CREATE_NEW_CONSOLE)
    else:
        print("[!] LYRA boot file not found.")

def view_seals():
    seal_folder = os.path.join(BASE_PATH, "visual seals")
    if not os.path.exists(seal_folder):
        print("[!] Visual seal folder not found.")
        return

    seals = [f for f in os.listdir(seal_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    if not seals:
        print("[!] No visual seal images found.")
        return

    pygame.init()
    screen = pygame.display.set_mode((1280, 720))
    pygame.display.set_caption("LYRA Visual Seal Viewer")
    font = pygame.font.SysFont('Arial', 24)
    index = 0

    while True:
        screen.fill((0, 0, 0))
        seal_path = os.path.join(seal_folder, seals[index])
        try:
            seal = pygame.image.load(seal_path)
            seal = pygame.transform.scale(seal, (600, 600))
            screen.blit(seal, (340, 60))
            label = font.render(f"{seals[index]} [{index+1}/{len(seals)}]", True, (255, 255, 255))
            screen.blit(label, (20, 20))
        except Exception as e:
            print(f"[ERROR] Failed to load seal: {e}")

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RIGHT:
                    index = (index + 1) % len(seals)
                elif event.key == pygame.K_LEFT:
                    index = (index - 1) % len(seals)
                elif event.key == pygame.K_ESCAPE or event.key == pygame.K_q:
                    pygame.quit()
                    return

        pygame.display.flip()

def open_folder(subfolder):
    path = os.path.join(BASE_PATH, subfolder)
    if os.path.exists(path):
        os.startfile(path)
    else:
        print(f"[!] Folder not found: {subfolder}")

def main_menu():
    while True:
        print("\n==== GENESIS CONSOLE ====")
        print("[1] Launch LYRA Boot")
        print("[2] View Visual Seals")
        print("[3] Open Seal Archive")
        print("[4] Open Memory Folder")
        print("[5] Open Grok Chats Folder")
        print("[0] Exit")

        choice = input("Select option: ").strip()
        if choice == '1':
            launch_lyra()
        elif choice == '2':
            view_seals()
        elif choice == '3':
            open_folder("seal_archive")
        elif choice == '4':
            open_folder("Memory")
        elif choice == '5':
            open_folder("grok chats")
        elif choice == '0':
            break
        else:
            print("Invalid selection.")

if __name__ == "__main__":
    main_menu()
