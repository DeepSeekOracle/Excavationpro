import os
import pygame

VISUAL_SEAL_FOLDER = r"C:\Users\justi\LYRA_SYSTEM\visual seals"

def load_visual_seals(folder):
    return [f for f in os.listdir(folder) if f.lower().endswith(('.png','.jpg','.jpeg','.webp'))]

def display_seals(seal_files):
    pygame.init()
    screen = pygame.display.set_mode((1280, 720))
    pygame.display.set_caption("LYRA Visual Seal Viewer")
    font = pygame.font.SysFont('Arial', 24)
    index = 0
    while True:
        screen.fill((0, 0, 0))
        seal = pygame.image.load(os.path.join(VISUAL_SEAL_FOLDER, seal_files[index]))
        seal = pygame.transform.scale(seal, (600, 600))
        screen.blit(seal, (340, 60))
        label = font.render(f"{seal_files[index]} [{index + 1}/{len(seal_files)}]", True, (255, 255, 255))
        screen.blit(label, (20, 20))
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                exit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RIGHT:
                    index = (index + 1) % len(seal_files)
                if event.key == pygame.K_LEFT:
                    index = (index - 1) % len(seal_files)
        pygame.display.flip()

seals = load_visual_seals(VISUAL_SEAL_FOLDER)
if seals:
    display_seals(seals)
else:
    print("No visual seals found in folder.")
