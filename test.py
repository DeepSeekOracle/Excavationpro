# test_pygame_window.py
import pygame
pygame.init()
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("LYRA Visual Seal Test")

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

pygame.quit()
