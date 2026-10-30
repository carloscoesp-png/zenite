"""Gera os ícones PNG do Zênite (mesmo desenho de icons/icon.svg), sem dependências.

Uso: python tools/make_icons.py icons
"""
import math
import os
import struct
import sys
import zlib

BG = (10, 10, 11)
GOLD_STOPS = [(0.0, (240, 215, 122)), (0.45, (212, 175, 55)), (1.0, (168, 132, 31))]
PEAK = [(12, 51), (32, 25), (52, 51)]
INNER = [(23, 51), (32, 39), (41, 51)]
STAR = [(32, 6), (34.2, 11.8), (40, 14), (34.2, 16.2), (32, 22), (29.8, 16.2), (24, 14), (29.8, 11.8)]


def near(px, py, line, width):
    return min(seg_dist(px, py, a, b) for a, b in zip(line, line[1:])) <= width / 2


def gold(x, y):
    """Degradê diagonal, como o linearGradient do SVG."""
    t = max(0.0, min(1.0, (x + y) / 128))
    for (t0, c0), (t1, c1) in zip(GOLD_STOPS, GOLD_STOPS[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(c0[i] + (c1[i] - c0[i]) * k for i in range(3))
    return GOLD_STOPS[-1][1]


def seg_dist(px, py, a, b):
    ax, ay = a
    bx, by = b
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def inside(px, py, poly):
    hit = False
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        if (y1 > py) != (y2 > py) and px < x1 + (py - y1) * (x2 - x1) / (y2 - y1):
            hit = not hit
    return hit


def sample(x, y, rounded):
    """Cor (r, g, b) do desenho em coordenadas 0..64, ou None fora do ícone arredondado."""
    if rounded:
        r = 14
        cx, cy = min(max(x, r), 64 - r), min(max(y, r), 64 - r)
        if (x - cx) ** 2 + (y - cy) ** 2 > r * r:
            return None
    if inside(x, y, STAR) or near(x, y, PEAK, 5):
        return gold(x, y)
    if near(x, y, INNER, 4):
        g = gold(x, y)
        return tuple(BG[i] + (g[i] - BG[i]) * 0.55 for i in range(3))
    return BG


def render(size, scale, rounded, ss=3):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0.0, 0.0, 0.0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    u = 32 + (((px + (sx + 0.5) / ss) / size) * 64 - 32) / scale
                    v = 32 + (((py + (sy + 0.5) / ss) / size) * 64 - 32) / scale
                    c = sample(u, v, rounded) if (0 <= u <= 64 and 0 <= v <= 64) else (None if rounded else BG)
                    if c is None:
                        continue
                    acc[0] += c[0]
                    acc[1] += c[1]
                    acc[2] += c[2]
                    acc[3] += 1
            n = acc[3]
            if n:
                row += bytes([round(acc[0] / n), round(acc[1] / n), round(acc[2] / n), round(255 * n / (ss * ss))])
            else:
                row += bytes(4)
        rows.append(bytes(row))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b''))


out = sys.argv[1]
for name, size, scale, rounded in (
    ('icon-192.png', 192, 1.0, True),
    ('icon-512.png', 512, 1.0, True),
    ('icon-maskable-512.png', 512, 0.8, False),  # área segura do Android: desenho a 80%
):
    with open(os.path.join(out, name), 'wb') as fh:
        fh.write(render(size, scale, rounded))
    print('ok', name)
