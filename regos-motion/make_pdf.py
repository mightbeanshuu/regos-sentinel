#!/usr/bin/env python3
"""Assemble the 10 deck stills (S01-S10) into the Round-01 idea-deck PDF."""
import os

from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
STILLS = os.path.join(BASE, 'out', 'stills_v2')
OUT = os.path.join(BASE, 'out', 'RegOS_Sentinel_SEBI_TechSprint_2026_Idea_Deck.pdf')

pages = []
for i in range(1, 11):
    path = os.path.join(STILLS, f'S{i:02d}.png')
    img = Image.open(path).convert('RGB')
    pages.append(img)

pages[0].save(OUT, save_all=True, append_images=pages[1:], resolution=150.0)
print('PDF written:', OUT, f'({os.path.getsize(OUT) / 1e6:.1f} MB, {len(pages)} pages)')
