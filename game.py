import pygame
import sys

# Initialize Pygame
pygame.init()

# Set up some constants
WIDTH = 800
HEIGHT = 600
BLOCK_SIZE = 50
SPEED = 5

# Create the game window
screen = pygame.display.set_mode((WIDTH, HEIGHT))

# Define some colors
WHITE = (255, 255, 255)
RED = (255, 0, 0)

# Set up the block
block_x = WIDTH / 2
block_y = HEIGHT / 2

# Game loop
while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

    # Fill the screen with white
    screen.fill(WHITE)

    # Draw the block
    pygame.draw.rect(screen, RED, (block_x, block_y, BLOCK_SIZE, BLOCK_SIZE))

    # Get the current key presses
    keys = pygame.key.get_pressed()

    # Move the block
    if keys[pygame.K_LEFT]:
        block_x -= SPEED
    if keys[pygame.K_RIGHT]:
        block_x += SPEED
    if keys[pygame.K_UP]:
        block_y -= SPEED
    if keys[pygame.K_DOWN]:
        block_y += SPEED

    # Ensure the block doesn't move off the screen
    if block_x < 0:
        block_x = 0
    if block_x > WIDTH - BLOCK_SIZE:
        block_x = WIDTH - BLOCK_SIZE
    if block_y < 0:
        block_y = 0
    if block_y > HEIGHT - BLOCK_SIZE:
        block_y = HEIGHT - BLOCK_SIZE

    # Update the display
    pygame.display.flip()

    # Cap the frame rate
    pygame.time.Clock().tick(60)