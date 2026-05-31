from pathlib import Path
from collections import deque

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts" / "assets" / "corgi-walk-sheet-v2-raw.png"
OUT_DIR = ROOT / "public" / "images" / "corgi-walk"
FRAME_COUNT = 6


def remove_chroma_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    visited = set()
    queue = deque()

    def is_background(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        is_green = green > 150 and green > red * 1.2 and green > blue * 1.2
        is_separator = red > 170 and blue > 120 and green < 150
        return is_green or is_separator

    for x in range(rgba.width):
        queue.append((x, 0))
        queue.append((x, rgba.height - 1))
    for y in range(rgba.height):
        queue.append((0, y))
        queue.append((rgba.width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not is_background(x, y):
            continue
        visited.add((x, y))
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)
        if x > 0:
            queue.append((x - 1, y))
        if x + 1 < rgba.width:
            queue.append((x + 1, y))
        if y > 0:
            queue.append((x, y - 1))
        if y + 1 < rgba.height:
            queue.append((x, y + 1))
    return rgba


def keep_largest_component(image: Image.Image) -> Image.Image:
    pixels = image.load()
    visited = set()
    components = []
    for y in range(image.height):
        for x in range(image.width):
            if (x, y) in visited or pixels[x, y][3] == 0:
                continue
            queue = deque([(x, y)])
            visited.add((x, y))
            component = []
            while queue:
                current_x, current_y = queue.popleft()
                component.append((current_x, current_y))
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    if (
                        0 <= next_x < image.width
                        and 0 <= next_y < image.height
                        and (next_x, next_y) not in visited
                        and pixels[next_x, next_y][3] > 0
                    ):
                        visited.add((next_x, next_y))
                        queue.append((next_x, next_y))
            components.append(component)

    largest = max(components, key=len)
    keep = set(largest)
    for y in range(image.height):
        for x in range(image.width):
            if (x, y) not in keep:
                red, green, blue, _ = pixels[x, y]
                pixels[x, y] = (red, green, blue, 0)
    return image


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SOURCE).convert("RGBA")
    frames = []
    boxes = []

    for index in range(FRAME_COUNT):
        left = round(sheet.width * index / FRAME_COUNT)
        right = round(sheet.width * (index + 1) / FRAME_COUNT)
        frame = keep_largest_component(remove_chroma_key(sheet.crop((left, 0, right, sheet.height))))
        box = frame.getbbox()
        if box is None:
            raise RuntimeError(f"frame {index + 1} is empty")
        frames.append(frame.crop(box))
        boxes.append(box)

    # Keep every generated pose at its original pixel size. The shared canvas
    # and baseline prevent layout shifts while allowing natural stride width.
    canvas_size = (
        max(frame.width for frame in frames) + 48,
        max(frame.height for frame in frames) + 48,
    )

    for index, frame in enumerate(frames, start=1):
        canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
        canvas.alpha_composite(frame, ((canvas.width - frame.width) // 2, canvas.height - frame.height - 24))
        canvas.save(OUT_DIR / f"corgi-walk-v2-{index}.png")


if __name__ == "__main__":
    main()
