#!/usr/bin/env python3
import os
import shutil
import struct
import subprocess
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "build")
PUBLIC_DIR = os.path.join(ROOT, "public")
ICONSET_DIR = os.path.join(BUILD_DIR, "icon.iconset")


def chunk(kind, data):
    return (
        struct.pack(">I", len(data)) +
        kind +
        data +
        struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )


def write_png(path, width, height, pixels):
    rows = []
    stride = width * 4
    for y in range(height):
        rows.append(b"\x00" + bytes(pixels[y * stride:(y + 1) * stride]))

    raw = b"".join(rows)
    data = (
        b"\x89PNG\r\n\x1a\n" +
        chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) +
        chunk(b"IDAT", zlib.compress(raw, 9)) +
        chunk(b"IEND", b"")
    )

    with open(path, "wb") as handle:
        handle.write(data)


def point_in_poly(x, y, points):
    inside = False
    j = len(points) - 1
    for i, point in enumerate(points):
        xi, yi = point
        xj, yj = points[j]
        if (yi > y) != (yj > y):
            intersection = (xj - xi) * (y - yi) / (yj - yi) + xi
            if x < intersection:
                inside = not inside
        j = i
    return inside


def fill_polygon(pixels, width, height, points, color):
    min_x = max(0, int(min(x for x, _ in points)))
    max_x = min(width - 1, int(max(x for x, _ in points)) + 1)
    min_y = max(0, int(min(y for _, y in points)))
    max_y = min(height - 1, int(max(y for _, y in points)) + 1)

    r, g, b, a = color
    for y in range(min_y, max_y + 1):
        sample_y = y + 0.5
        for x in range(min_x, max_x + 1):
            if not point_in_poly(x + 0.5, sample_y, points):
                continue
            index = (y * width + x) * 4
            pixels[index:index + 4] = bytes((r, g, b, a))


def fill_rounded_rect(pixels, width, height, x0, y0, x1, y1, radius, color):
    r, g, b, a = color
    for y in range(max(0, y0), min(height, y1)):
        for x in range(max(0, x0), min(width, x1)):
            cx = min(max(x + 0.5, x0 + radius), x1 - radius)
            cy = min(max(y + 0.5, y0 + radius), y1 - radius)
            if (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > radius ** 2:
                continue
            index = (y * width + x) * 4
            pixels[index:index + 4] = bytes((r, g, b, a))


def scale_points(points, factor):
    return [(x * factor, y * factor) for x, y in points]


def downsample(pixels, width, height, factor):
    out_width = width // factor
    out_height = height // factor
    out = bytearray(out_width * out_height * 4)

    for y in range(out_height):
        for x in range(out_width):
            total = [0, 0, 0, 0]
            for sy in range(factor):
                for sx in range(factor):
                    src = (((y * factor + sy) * width) + (x * factor + sx)) * 4
                    for channel in range(4):
                        total[channel] += pixels[src + channel]
            dst = (y * out_width + x) * 4
            count = factor * factor
            out[dst:dst + 4] = bytes(round(value / count) for value in total)

    return out


def render_icon(size):
    factor = 4
    canvas = size * factor
    scale = canvas / 1024
    pixels = bytearray(canvas * canvas * 4)

    fill_rounded_rect(
        pixels,
        canvas,
        canvas,
        round(64 * scale),
        round(64 * scale),
        round(960 * scale),
        round(960 * scale),
        round(176 * scale),
        (255, 255, 255, 255),
    )

    shapes = [
        [(214, 242), (286, 242), (286, 790), (214, 790)],
        [(274, 242), (396, 242), (564, 576), (716, 242), (794, 242), (584, 730)],
        [(678, 262), (736, 262), (628, 612), (570, 612)],
        [(804, 244), (874, 244), (696, 790), (626, 790)],
        [(790, 790), (874, 790), (874, 660)],
    ]

    for shape in shapes:
        fill_polygon(pixels, canvas, canvas, scale_points(shape, scale), (0, 0, 0, 255))

    return downsample(pixels, canvas, canvas, factor)


def write_ico(path, images):
    offset = 6 + len(images) * 16
    entries = []
    payloads = []

    for size, png_data in images:
        entries.append(struct.pack(
            "<BBBBHHII",
            0 if size >= 256 else size,
            0 if size >= 256 else size,
            0,
            0,
            1,
            32,
            len(png_data),
            offset,
        ))
        payloads.append(png_data)
        offset += len(png_data)

    with open(path, "wb") as handle:
        handle.write(struct.pack("<HHH", 0, 1, len(images)))
        for entry in entries:
            handle.write(entry)
        for payload in payloads:
            handle.write(payload)


def read_file(path):
    with open(path, "rb") as handle:
        return handle.read()


def copy_svg_assets():
    source = os.path.join(BUILD_DIR, "icon-source.svg")
    with open(source, "r", encoding="utf-8") as handle:
        content = handle.read()

    for target in ("app-icon.svg", "favicon.svg"):
        with open(os.path.join(PUBLIC_DIR, target), "w", encoding="utf-8") as handle:
            handle.write(content)


def write_icns():
    iconutil = shutil.which("iconutil")
    if not iconutil:
        return

    subprocess.run(
        [iconutil, "-c", "icns", ICONSET_DIR, "-o", os.path.join(BUILD_DIR, "icon.icns")],
        check=True,
    )


def main():
    os.makedirs(BUILD_DIR, exist_ok=True)
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    os.makedirs(ICONSET_DIR, exist_ok=True)

    icon_png_path = os.path.join(BUILD_DIR, "icon.png")
    write_png(icon_png_path, 1024, 1024, render_icon(1024))

    iconset_sizes = {
        "icon_16x16.png": 16,
        "icon_16x16@2x.png": 32,
        "icon_32x32.png": 32,
        "icon_32x32@2x.png": 64,
        "icon_128x128.png": 128,
        "icon_128x128@2x.png": 256,
        "icon_256x256.png": 256,
        "icon_256x256@2x.png": 512,
        "icon_512x512.png": 512,
        "icon_512x512@2x.png": 1024,
    }
    for name, size in iconset_sizes.items():
        write_png(os.path.join(ICONSET_DIR, name), size, size, render_icon(size))

    ico_images = []
    for size in (16, 24, 32, 48, 64, 128, 256):
        png_path = os.path.join(BUILD_DIR, f"icon-{size}.png")
        write_png(png_path, size, size, render_icon(size))
        ico_images.append((size, read_file(png_path)))
    write_ico(os.path.join(BUILD_DIR, "icon.ico"), ico_images)

    copy_svg_assets()
    write_icns()


if __name__ == "__main__":
    main()
