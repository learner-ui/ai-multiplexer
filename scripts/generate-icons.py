#!/usr/bin/env python3
import os
import shutil
import struct
import subprocess
import zlib
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD_DIR = os.path.join(ROOT, "build")
PUBLIC_DIR = os.path.join(ROOT, "public")
ICONSET_DIR = os.path.join(BUILD_DIR, "icon.iconset")
SOURCE_PNG = os.path.join(BUILD_DIR, "icon-source.png")


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


def paeth_predictor(left, above, upper_left):
    p = left + above - upper_left
    pa = abs(p - left)
    pb = abs(p - above)
    pc = abs(p - upper_left)
    if pa <= pb and pa <= pc:
        return left
    if pb <= pc:
        return above
    return upper_left


def read_png(path):
    with open(path, "rb") as handle:
        data = handle.read()

    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG file")

    pos = 8
    width = height = color_type = None
    idat = []

    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        kind = data[pos + 4:pos + 8]
        payload = data[pos + 8:pos + 8 + length]
        pos += length + 12

        if kind == b"IHDR":
            width, height, bit_depth, color_type, compression, png_filter, interlace = struct.unpack(
                ">IIBBBBB",
                payload,
            )
            if bit_depth != 8 or compression != 0 or png_filter != 0 or interlace != 0:
                raise ValueError("Only 8-bit non-interlaced PNG files are supported")
            if color_type not in (2, 6):
                raise ValueError("Only RGB and RGBA PNG files are supported")
        elif kind == b"IDAT":
            idat.append(payload)
        elif kind == b"IEND":
            break

    channels = 4 if color_type == 6 else 3
    source_stride = width * channels
    decoded = zlib.decompress(b"".join(idat))
    rgba = bytearray(width * height * 4)
    previous = bytearray(source_stride)
    offset = 0

    for y in range(height):
        filter_type = decoded[offset]
        offset += 1
        raw = decoded[offset:offset + source_stride]
        offset += source_stride
        row = bytearray(source_stride)

        for i, value in enumerate(raw):
            left = row[i - channels] if i >= channels else 0
            above = previous[i]
            upper_left = previous[i - channels] if i >= channels else 0

            if filter_type == 0:
                reconstructed = value
            elif filter_type == 1:
                reconstructed = value + left
            elif filter_type == 2:
                reconstructed = value + above
            elif filter_type == 3:
                reconstructed = value + ((left + above) // 2)
            elif filter_type == 4:
                reconstructed = value + paeth_predictor(left, above, upper_left)
            else:
                raise ValueError(f"Unsupported PNG filter type: {filter_type}")

            row[i] = reconstructed & 0xFF

        for x in range(width):
            source = x * channels
            target = (y * width + x) * 4
            rgba[target] = row[source]
            rgba[target + 1] = row[source + 1]
            rgba[target + 2] = row[source + 2]
            rgba[target + 3] = row[source + 3] if channels == 4 else 255

        previous = row

    return width, height, rgba


def remove_edge_background(width, height, pixels, threshold=250):
    visited = bytearray(width * height)
    queue = deque()

    def is_background(index):
        offset = index * 4
        return pixels[offset + 3] > 0 and max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) <= threshold

    def enqueue(index):
        if visited[index] or not is_background(index):
            return
        visited[index] = 1
        queue.append(index)

    for x in range(width):
        enqueue(x)
        enqueue((height - 1) * width + x)
    for y in range(height):
        enqueue(y * width)
        enqueue(y * width + width - 1)

    while queue:
        index = queue.popleft()
        x = index % width
        y = index // width
        if x > 0:
            enqueue(index - 1)
        if x + 1 < width:
            enqueue(index + 1)
        if y > 0:
            enqueue(index - width)
        if y + 1 < height:
            enqueue(index + width)

    for index, is_visited in enumerate(visited):
        if not is_visited:
            continue
        offset = index * 4
        pixels[offset:offset + 4] = bytes((255, 255, 255, 0))


def resize_rgba(source_width, source_height, source_pixels, target_size):
    target = bytearray(target_size * target_size * 4)
    x_ratio = source_width / target_size
    y_ratio = source_height / target_size

    for y in range(target_size):
        source_y = (y + 0.5) * y_ratio - 0.5
        y0 = max(0, min(source_height - 1, int(source_y)))
        y1 = min(source_height - 1, y0 + 1)
        wy = source_y - y0

        for x in range(target_size):
            source_x = (x + 0.5) * x_ratio - 0.5
            x0 = max(0, min(source_width - 1, int(source_x)))
            x1 = min(source_width - 1, x0 + 1)
            wx = source_x - x0

            samples = (
                (x0, y0, (1 - wx) * (1 - wy)),
                (x1, y0, wx * (1 - wy)),
                (x0, y1, (1 - wx) * wy),
                (x1, y1, wx * wy),
            )
            premultiplied = [0.0, 0.0, 0.0]
            alpha = 0.0

            for sx, sy, weight in samples:
                source = (sy * source_width + sx) * 4
                sample_alpha = source_pixels[source + 3] * weight
                alpha += sample_alpha
                premultiplied[0] += source_pixels[source] * sample_alpha
                premultiplied[1] += source_pixels[source + 1] * sample_alpha
                premultiplied[2] += source_pixels[source + 2] * sample_alpha

            target_offset = (y * target_size + x) * 4
            target_alpha = round(alpha)
            if target_alpha:
                target[target_offset] = round(premultiplied[0] / alpha)
                target[target_offset + 1] = round(premultiplied[1] / alpha)
                target[target_offset + 2] = round(premultiplied[2] / alpha)
            target[target_offset + 3] = target_alpha

    return target


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


def write_public_assets(icon_pixels):
    write_png(os.path.join(PUBLIC_DIR, "app-icon.png"), 1024, 1024, icon_pixels)
    write_png(os.path.join(PUBLIC_DIR, "favicon.png"), 64, 64, resize_rgba(1024, 1024, icon_pixels, 64))


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

    width, height, pixels = read_png(SOURCE_PNG)
    remove_edge_background(width, height, pixels)

    icon_pixels = resize_rgba(width, height, pixels, 1024)
    icon_png_path = os.path.join(BUILD_DIR, "icon.png")
    write_png(icon_png_path, 1024, 1024, icon_pixels)
    write_public_assets(icon_pixels)

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
        write_png(os.path.join(ICONSET_DIR, name), size, size, resize_rgba(1024, 1024, icon_pixels, size))

    ico_images = []
    for size in (16, 24, 32, 48, 64, 128, 256):
        png_path = os.path.join(BUILD_DIR, f"icon-{size}.png")
        write_png(png_path, size, size, resize_rgba(1024, 1024, icon_pixels, size))
        ico_images.append((size, read_file(png_path)))
    write_ico(os.path.join(BUILD_DIR, "icon.ico"), ico_images)

    write_icns()


if __name__ == "__main__":
    main()
