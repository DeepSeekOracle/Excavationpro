import os
import time
import pygame

# Full absolute path to your visual seals folder
VISUAL_SEAL_FOLDER = r"C:\Users\justi\LYRA_SYSTEM\visual seals"

def load_visual_seals(folder):
    supported_formats = ('.png', '.jpg', '.jpeg', '.webp')
    return [f for f in os.listdir(folder) if f.lower().endswith(supported_formats)]

def display_seals(seal_files):
    pygame.init()
    screen = pygame.display.set_mode((1280, 720))
    pygame.display.set_caption("LYRA Visual Seal Viewer")

    font = pygame.font.SysFont('Arial', 24)
    clock = pygame.time.Clock()

    index = 0
    while True:
        screen.fill((10, 10, 10))

        seal_path = os.path.join(VISUAL_SEAL_FOLDER, seal_files[index])
        image = pygame.image.load(seal_path)
        image = pygame.transform.scale(image, (600, 600))
        screen.blit(image, (340, 60))

        # Draw file name + counter
        name = font.render(f"{seal_files[index]} [{index+1}/{len(seal_files)}]", True, (255, 255, 255))
        screen.blit(name, (10, 10))

        # Check events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                return
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RIGHT:
                    index = (index + 1) % len(seal_files)
                elif event.key == pygame.K_LEFT:
                    index = (index - 1) % len(seal_files)

        pygame.display.flip()
        clock.tick(30)

def main():
    print("🔮 Loading LYRA visual seals...")
    if not os.path.exists(VISUAL_SEAL_FOLDER):
        print(f"❌ Folder not found: {VISUAL_SEAL_FOLDER}")
        return

    seals = load_visual_seals(VISUAL_SEAL_FOLDER)
    if not seals:
        print("⚠️ No seal images found.")
        return

    print(f"✅ Loaded {len(seals)} visual seals.\nLaunching viewer...")
    display_seals(seals)

if __name__ == "__main__":
    main()
