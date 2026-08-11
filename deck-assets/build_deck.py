#!/usr/bin/env python3
"""Build the RegOS Sentinel pitch deck.

Run with /usr/bin/python3 (it is the interpreter that has python-pptx; the
homebrew 3.14 pip is broken on this machine).

    /usr/bin/python3 deck-assets/build_deck.py

Design decisions worth keeping:

* **The palette is the product's palette.** Romer dark — near-black canvas, and
  the four semantic colours the app itself uses: aqua = verified, peach = a
  person is required, periwinkle = computed, coral = a check failed. Lime is
  brand and action ONLY. A judge who watches the film, opens the site and then
  reads the deck should feel one product, not three contractors.

* **Graphics are native PowerPoint shapes, not rasterised SVG.** cairosvg is not
  installed here, but the better reason is that native shapes stay vector, stay
  crisp on a projector, and stay editable by a human before the pitch.

* **The proof slides carry animated GIFs of the real product**, cut from the
  screen recordings at the exact moment the film uses. PowerPoint animates GIFs
  in slideshow mode. Nothing on those slides is a mockup.

* **Every number is real output**, and the ones that are estimates say so. The
  model figures come from app/model/weights.json, regenerated 2026-08-11.
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml import parse_xml
from pptx.oxml.ns import nsdecls
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parent
GIF = ROOT / "gif"
OUT = ROOT.parent / "RegOS_Sentinel_Pitch_2026.pptx"

# ---- Romer dark palette -------------------------------------------------- #
BG          = RGBColor(0x07, 0x07, 0x08)
PANEL       = RGBColor(0x0D, 0x0E, 0x0F)
PANEL_2     = RGBColor(0x14, 0x15, 0x16)
HAIRLINE    = RGBColor(0x24, 0x25, 0x28)
INK         = RGBColor(0xF4, 0xF5, 0xF6)
INK_2       = RGBColor(0xA8, 0xAB, 0xB0)
INK_3       = RGBColor(0x7C, 0x7F, 0x83)
LIME        = RGBColor(0xD0, 0xFE, 0x67)   # brand / action ONLY
AQUA        = RGBColor(0x76, 0xD2, 0xE3)   # verified
PEACH       = RGBColor(0xFF, 0xC2, 0x97)   # a person is required
PERI        = RGBColor(0xC8, 0xCB, 0xFF)   # computed
CORAL       = RGBColor(0xFF, 0x9D, 0x9D)   # a check failed

SANS = "Helvetica Neue"
MONO = "Menlo"

W, H = Inches(13.333), Inches(7.5)
M = Inches(0.82)                    # outer margin
CONTENT_W = W - 2 * M

# Product-screenshot slides share one geometry. 7.1in of 16:9 is 3.99in tall,
# so at y=2.62 the image rests 0.17in clear of the footer rule at 6.78.
GIF_Y = Inches(2.62)
GIF_W = Inches(7.1)
GIF_COL = W - Inches(0.82) - (Inches(0.82) + Inches(7.1) + Inches(0.45))


# ---- primitives ----------------------------------------------------------- #
def deck() -> Presentation:
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    return prs


def slide(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG
    bg.line.fill.background()
    bg.shadow.inherit = False
    return s


def text(s, x, y, w, h, runs, size=18, colour=INK, bold=False, align=PP_ALIGN.LEFT,
         font=SANS, spacing=1.18, anchor=MSO_ANCHOR.TOP, caps=False):
    """`runs` is a string, or a list of (text, {overrides}) for inline colour."""
    box = s.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = spacing
    if isinstance(runs, str):
        runs = [(runs, {})]
    for content, over in runs:
        r = p.add_run()
        r.text = content.upper() if caps else content
        f = r.font
        f.name = over.get("font", font)
        f.size = Pt(over.get("size", size))
        f.bold = over.get("bold", bold)
        f.color.rgb = over.get("colour", colour)
        if caps:
            f.size = Pt(over.get("size", size))
    return box


def rule(s, x, y, w, colour=HAIRLINE, thick=Pt(0.75)):
    ln = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, Emu(9525))
    ln.fill.solid()
    ln.fill.fore_color.rgb = colour
    ln.line.fill.background()
    ln.shadow.inherit = False
    return ln


def panel(s, x, y, w, h, fill=PANEL, border=HAIRLINE, radius=True):
    shape = s.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = border
    shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    if radius:
        try:
            shape.adjustments[0] = 0.035
        except Exception:
            pass
    return shape


def kicker(s, y, number, label):
    """The editorial section marker: 01 / THE DEFECT."""
    text(s, M, y, Inches(4), Inches(0.3),
         [(f"{number}", {"colour": LIME, "font": MONO, "size": 11, "bold": True}),
          ("   ", {}),
          (label.upper(), {"colour": INK_3, "size": 11, "bold": True})], size=11)


def shield(s, x, y, size=Inches(0.3), colour=LIME):
    """The brand mark, same geometry as the film's and the site's."""
    m = s.shapes.add_shape(MSO_SHAPE.PENTAGON, x, y, size, size)
    m.rotation = 90
    m.fill.background()
    m.line.color.rgb = colour
    m.line.width = Pt(1.5)
    m.shadow.inherit = False
    return m


def footer(s, page):
    rule(s, M, H - Inches(0.72), CONTENT_W)
    text(s, M, H - Inches(0.6), Inches(6), Inches(0.24),
         "RegOS Sentinel · SEBI Securities Market TechSprint @ GFF 2026 · PS2",
         size=9, colour=INK_3)
    text(s, W - M - Inches(1.2), H - Inches(0.6), Inches(1.2), Inches(0.24),
         f"{page:02d}", size=9, colour=INK_3, align=PP_ALIGN.RIGHT, font=MONO)


def headline(s, y, runs, size=44, w=None, lines=1):
    """Sized from the type, not guessed.

    A fixed 1.6in box silently overflowed every headline that wrapped, and the
    overflow landed on whatever was placed beneath it — on the cover, that was
    the sub-paragraph; on the proof slide, the product screenshot.
    """
    text(s, M, y, w or CONTENT_W, Inches(size / 58 * lines + 0.2), runs,
         size=size, bold=True, spacing=1.06)


def gif(s, name, x, y, w):
    """A frame of the real product, animated in slideshow."""
    path = GIF / f"{name}.gif"
    if not path.exists():
        raise SystemExit(f"missing GIF: {path}  (run the ffmpeg step first)")
    frame = panel(s, x - Inches(0.06), y - Inches(0.06),
                  w + Inches(0.12), Inches(0.12) + w * 1080 / 1920,
                  fill=PANEL_2, border=HAIRLINE)
    pic = s.shapes.add_picture(str(path), x, y, width=w)
    return frame, pic


def legend(s, x, y, items):
    """The colour vocabulary, stated once so the deck can rely on it."""
    cx = x
    for label, colour in items:
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, cx, y + Inches(0.045),
                                 Inches(0.09), Inches(0.09))
        dot.fill.solid()
        dot.fill.fore_color.rgb = colour
        dot.line.fill.background()
        dot.shadow.inherit = False
        text(s, cx + Inches(0.16), y, Inches(1.9), Inches(0.22),
             label.upper(), size=9, colour=INK_3)
        cx += Inches(0.16) + Inches(1.28)


def stat(s, x, y, w, figure, label, colour=INK, size=38):
    """A figure over its caption.

    The gap is derived from the type size rather than fixed: a 38pt figure needs
    more room beneath it than a 26pt one, and the first cut of this deck set the
    caption 0.6in down for every size, so every large figure sat on top of its
    own label.
    """
    text(s, x, y, w, Inches(size / 52), figure, size=size, bold=True, colour=colour)
    text(s, x, y + Inches(size / 52 + 0.1), w, Inches(0.62), label, size=10.5,
         colour=INK_3, spacing=1.3)


def bar(s, x, y, w, h, frac, colour):
    track = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    track.fill.solid()
    track.fill.fore_color.rgb = PANEL_2
    track.line.fill.background()
    track.shadow.inherit = False
    if frac > 0:
        fill = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, Emu(int(w * frac)), h)
        fill.fill.solid()
        fill.fill.fore_color.rgb = colour
        fill.line.fill.background()
        fill.shadow.inherit = False


# ---- slides ---------------------------------------------------------------- #
# COPY BUDGET: 40-50 words a slide, counted. A judge skims; a paragraph on a
# slide is a paragraph nobody reads, and it competes with the screenshot that is
# doing the actual persuading. Everything cut from here is said out loud instead.


def s01_cover(prs):
    s = slide(prs)
    shield(s, M, Inches(0.78), Inches(0.34))
    text(s, M + Inches(0.5), Inches(0.8), Inches(6), Inches(0.3),
         "REGOS SENTINEL", size=12, bold=True, colour=INK)
    text(s, M + Inches(2.5), Inches(0.8), Inches(6), Inches(0.3),
         "SEBI TECHSPRINT · PS2 · AGENTIC COMPLIANCE", size=10, colour=INK_3)

    headline(s, Inches(2.05),
             [("One week.\n", {}), ("From when?", {"colour": LIME})],
             size=76, w=Inches(7.0), lines=2)
    text(s, M, Inches(4.85), Inches(6.4), Inches(0.9),
         "SEBI says close it in a week. It never says a week from when.",
         size=19, colour=INK_2, spacing=1.4)

    legend(s, M, Inches(6.15), [("computed", PERI), ("verified", AQUA),
                                ("a person decides", PEACH)])

    for i, (fig, lab, col) in enumerate([
        ("205", "pages read", INK),
        ("2,258", "passages", INK),
        ("0", "dates invented", LIME),
    ]):
        stat(s, Inches(8.35) + Inches(1.42) * i, Inches(2.3), Inches(1.3),
             fig, lab, col, size=32)
    footer(s, 1)


def s02_defect(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "01", "The defect")
    headline(s, Inches(1.3), "A period is not a deadline")

    q = panel(s, M, Inches(2.5), Inches(5.9), Inches(2.2))
    text(s, M + Inches(0.34), Inches(2.82), Inches(5.2), Inches(1.2),
         "“…virtual patching shall be implemented for legacy systems for a "
         "maximum period of 6 months.”",
         size=16, colour=INK, spacing=1.45)
    text(s, M + Inches(0.34), Inches(4.18), Inches(5.2), Inches(0.35),
         "SEBI CSCRF · page 116 · six months from WHAT?",
         size=11, colour=PEACH, spacing=1.3)

    text(s, M, Inches(5.1), Inches(5.9), Inches(0.7),
         "Found unprompted, in a document the model had never seen.",
         size=13, colour=INK_3, spacing=1.4)

    x2 = M + Inches(6.5)
    for i, (term, detail, col) in enumerate([
        ("Finds the period", "“6 months” — read.", PERI),
        ("Hunts the trigger", "Nothing starts the clock.", PERI),
        ("Stops", "No date computed. None guessed.", PEACH),
        ("Escalates", "A named person decides.", PEACH),
    ]):
        y = Inches(2.5) + Inches(0.98) * i
        chip = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x2, y + Inches(0.07),
                                  Inches(0.04), Inches(0.52))
        chip.fill.solid(); chip.fill.fore_color.rgb = col
        chip.line.fill.background(); chip.shadow.inherit = False
        text(s, x2 + Inches(0.26), y, Inches(4.4), Inches(0.32), term, size=18, bold=True)
        text(s, x2 + Inches(0.26), y + Inches(0.36), Inches(4.4), Inches(0.4),
             detail, size=13, colour=INK_2, spacing=1.3)
    footer(s, 2)


def s03_how(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "02", "How it works")
    headline(s, Inches(1.3), "Agents read. Rules decide. A person judges.", size=42)

    steps = [
        ("01  READ", "The model", PERI, "Can a date come out of this sentence?"),
        ("02  CHECK", "The fixed rule", AQUA, "Reads it again, separately."),
        ("03  DECIDE", "The person", PEACH, "The only one who may set a date."),
    ]
    w = Inches(3.6)
    for i, (tag, title, col, body) in enumerate(steps):
        x = M + (w + Inches(0.42)) * i
        panel(s, x, Inches(2.9), w, Inches(2.5))
        text(s, x + Inches(0.32), Inches(3.2), Inches(2.2), Inches(0.24),
             tag, size=10.5, bold=True, colour=col, font=MONO)
        text(s, x + Inches(0.32), Inches(3.6), w - Inches(0.64), Inches(0.4),
             title, size=25, bold=True)
        text(s, x + Inches(0.32), Inches(4.25), w - Inches(0.64), Inches(0.9),
             body, size=14, colour=INK_2, spacing=1.4)
        if i < 2:
            text(s, x + w + Inches(0.11), Inches(4.05), Inches(0.3), Inches(0.3),
                 "→", size=17, colour=INK_3)

    text(s, M, Inches(5.75), CONTENT_W, Inches(0.4),
         "It stops wherever the source stops.", size=15, colour=INK_3)
    footer(s, 3)


def s04_proof(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "03", "The proof")
    headline(s, Inches(1.26),
             [("The same defect, ", {}),
              ("three weeks ago", {"colour": LIME})], size=40)
    gif(s, "upload_case", M, GIF_Y, GIF_W)
    x = M + GIF_W + Inches(0.45)
    text(s, x, GIF_Y, GIF_COL, Inches(1.6),
         "A live SEBI circular, uploaded during the demo.",
         size=15, colour=INK_2, spacing=1.4)
    text(s, x, GIF_Y + Inches(0.9), GIF_COL, Inches(1.3),
         "“…monthly reports … for a period of 6 months.”",
         size=15, colour=INK, spacing=1.45)
    text(s, x, Inches(5.05), GIF_COL, Inches(0.3),
         "MODEL   PERIOD_ONLY  0.98", size=12, bold=True, colour=PERI, font=MONO)
    text(s, x, Inches(5.42), GIF_COL, Inches(0.3),
         "RULE    AGREES", size=12, bold=True, colour=AQUA, font=MONO)
    text(s, x, Inches(5.95), GIF_COL, Inches(0.6),
         "23 July 2026 · page 3", size=11, colour=INK_3, spacing=1.35)
    footer(s, 4)


def s05_refuses(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "04", "What most tools hide")
    headline(s, Inches(1.28), "It would rather say nothing", size=40)
    gif(s, "blocked", M, GIF_Y, GIF_W)
    x = M + GIF_W + Inches(0.45)
    text(s, x, GIF_Y, GIF_COL, Inches(1.5),
         "The period is there.\nThe starting point is not.",
         size=17, colour=INK, spacing=1.45)
    p = panel(s, x, Inches(4.3), GIF_COL, Inches(2.1), fill=PANEL_2)
    text(s, x + Inches(0.28), Inches(4.6), GIF_COL - Inches(0.56), Inches(1.6),
         "An invented deadline is worse than an admitted gap.",
         size=15, colour=PEACH, spacing=1.5)
    footer(s, 5)


def s06_decision(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "05", "Human in the loop")
    headline(s, Inches(1.28), "A judgement, not a rubber stamp", size=40)
    gif(s, "decide", M, GIF_Y, GIF_W)
    x = M + GIF_W + Inches(0.45)
    for i, (t, d) in enumerate([
        ("Order enforced", "Cite the sources first."),
        ("Reading before reveal", "You commit, then it shows its answer."),
        ("A named officer", "Person, role, written reason."),
    ]):
        y = GIF_Y + Inches(1.2) * i
        text(s, x, y, GIF_COL, Inches(0.3), t, size=16, bold=True, colour=PEACH)
        text(s, x, y + Inches(0.38), GIF_COL, Inches(0.7), d,
             size=13, colour=INK_2, spacing=1.4)
    footer(s, 6)


def s07_model(prs):
    """The slide the deck was missing: RegOS trained its own classifier."""
    s = slide(prs)
    kicker(s, Inches(0.8), "06", "Our own model")
    headline(s, Inches(1.28),
             [("We did not call an API. ", {}), ("We trained it.", {"colour": LIME})],
             size=38)
    text(s, M, Inches(2.3), Inches(5.5), Inches(0.8),
         "A timing classifier. Pure Python, no numpy, no network. Runs offline.",
         size=14.5, colour=INK_2, spacing=1.45)

    for i, (fig, lab, col) in enumerate([
        ("0.842", "on documents it\nhas never seen", INK),
        ("0.946", "recall on the\ndefect that matters", LIME),
        ("388", "sentences, labelled\nby reading", INK),
    ]):
        stat(s, M + Inches(1.85) * i, Inches(3.5), Inches(1.7), fig, lab, col, size=32)

    text(s, M, Inches(5.3), Inches(5.5), Inches(0.6),
         "A whole document held out at a time — the honest number.",
         size=11, colour=INK_3, spacing=1.4)

    x = M + Inches(6.35)
    p = panel(s, x, Inches(2.15), Inches(4.85), Inches(4.25))
    text(s, x + Inches(0.32), Inches(2.42), Inches(4.2), Inches(0.3),
         "WHAT IT LEARNED, UNPROMPTED", size=10, bold=True, colour=INK_3)
    weights = [
        ("has_absolute_date", 3.82, "a date is written down", PERI),
        ("periodicity_word", 2.45, "“quarterly”, “annual”", PERI),
        ("duration_without_clock_start", 2.07, "the defect", LIME),
        ("urgency_strong", 2.05, "“immediately”", PEACH),
        ("reported_past", 1.49, "talks about a duty", AQUA),
        ("interrogative", -1.14, "a question, not a duty", AQUA),
    ]
    top = Inches(2.88)
    for i, (name, val, gloss, col) in enumerate(weights):
        y = top + Inches(0.5) * i
        text(s, x + Inches(0.32), y, Inches(2.9), Inches(0.22),
             name, size=9.5, colour=INK, font=MONO)
        text(s, x + Inches(0.32), y + Inches(0.2), Inches(2.9), Inches(0.22),
             gloss, size=8.5, colour=INK_3)
        bar(s, x + Inches(3.35), y + Inches(0.05), Inches(1.0), Inches(0.11),
            min(abs(val) / 3.9, 1.0), col)
        text(s, x + Inches(3.35), y + Inches(0.2), Inches(1.0), Inches(0.22),
             f"{val:+.2f}", size=9, colour=col, font=MONO)
    rule(s, x + Inches(0.32), Inches(5.82), Inches(4.2))
    text(s, x + Inches(0.32), Inches(5.98), Inches(4.2), Inches(0.3),
         "Weights you can read. Not a black box.", size=9.5, colour=INK_3)
    footer(s, 7)


def s08_model_vs_rule(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "07", "Why two readers")
    headline(s, Inches(1.28), "The model never gets the last word", size=40)
    text(s, M, Inches(2.35), Inches(9.4), Inches(0.5),
         "Two independent reads. The disagreement is the output.",
         size=16, colour=INK_2)

    cards = [
        ("THE MODEL", PERI, "Generalises to\nwording it has\nnever seen.",
         "trained"),
        ("THE FIXED RULE", AQUA, "Auditable. Cannot\nbe surprised, cannot\ngeneralise.",
         "written down"),
        ("THE PERSON", PEACH, "Sees both, and the\npassage. Decides.",
         "the only one who may"),
    ]
    w = Inches(3.6)
    for i, (title, col, body, foot) in enumerate(cards):
        x = M + (w + Inches(0.42)) * i
        panel(s, x, Inches(3.25), w, Inches(2.5))
        text(s, x + Inches(0.32), Inches(3.55), Inches(2.6), Inches(0.24),
             title, size=10.5, bold=True, colour=col)
        text(s, x + Inches(0.32), Inches(4.0), w - Inches(0.64), Inches(1.3),
             body, size=15, colour=INK, spacing=1.45)
        text(s, x + Inches(0.32), Inches(5.32), w - Inches(0.64), Inches(0.3),
             foot, size=10, colour=INK_3)
    text(s, M, Inches(6.05), CONTENT_W, Inches(0.4),
         "We never train the model on the rule. Agreement would be a tautology.",
         size=12, colour=INK_3)
    footer(s, 8)


def s09_assistants(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "08", "AI assistants")
    headline(s, Inches(1.28), "Four readers, one job each", size=42)
    text(s, M, Inches(2.3), Inches(9.4), Inches(0.4),
         "None of them holds a tool that writes.", size=15, colour=INK_2)

    items = [
        ("Reference resolver", "Does “Table 19” really\npoint at Table 19?", "5", AQUA),
        ("Source scout", "Catches SEBI's wording\nmoving.", "11", PERI),
        ("Adversary", "Attacks our own answer\nfirst.", "2", PEACH),
        ("Extractor", "Can this sentence make\na date?", "8", PERI),
    ]
    w = Inches(2.68)
    for i, (name, job, steps, col) in enumerate(items):
        x = M + (w + Inches(0.28)) * i
        panel(s, x, Inches(3.0), w, Inches(2.05))
        dot = s.shapes.add_shape(MSO_SHAPE.OVAL, x + Inches(0.28), Inches(3.28),
                                 Inches(0.15), Inches(0.15))
        dot.fill.solid(); dot.fill.fore_color.rgb = col
        dot.line.fill.background(); dot.shadow.inherit = False
        text(s, x + Inches(0.28), Inches(3.56), w - Inches(0.5), Inches(0.3),
             name, size=15.5, bold=True)
        text(s, x + Inches(0.28), Inches(3.98), w - Inches(0.5), Inches(0.8),
             job, size=12.5, colour=INK_2, spacing=1.4)
        text(s, x + Inches(0.28), Inches(4.72), w - Inches(0.5), Inches(0.24),
             f"{steps} steps, all recorded", size=9.5, colour=INK_3, font=MONO)

    p = panel(s, M, Inches(5.4), CONTENT_W, Inches(1.0), fill=PANEL_2)
    text(s, M + Inches(0.34), Inches(5.68), Inches(11.2), Inches(0.5),
         "The adversary broke our own answer on its first run. Sixty tests had "
         "missed it.", size=15, colour=INK, spacing=1.4)
    footer(s, 9)


def s10_record(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "09", "The record")
    headline(s, Inches(1.28), "A trace you can recompute", size=42)
    gif(s, "record", M, GIF_Y, GIF_W)
    x = M + GIF_W + Inches(0.45)
    text(s, x, GIF_Y, GIF_COL, Inches(1.6),
         "Every step carries the digest of the step before it.\n\n"
         "Edit one and verification fails.",
         size=15, colour=INK_2, spacing=1.45)
    for i, (fig, lab) in enumerate([("26", "steps, hashed"),
                                    ("153", "tests passing"),
                                    ("28", "real PDFs, 0 problems")]):
        y = Inches(4.7) + Inches(0.66) * i
        text(s, x, y, Inches(0.95), Inches(0.35), fig, size=22, bold=True,
             colour=LIME, font=MONO)
        text(s, x + Inches(1.0), y + Inches(0.1), Inches(2.7), Inches(0.3),
             lab, size=12.5, colour=INK_2)
    footer(s, 10)


def s11_fit(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "10", "Why it fits SEBI")
    headline(s, Inches(1.28), "The regulator asked for this. Twice.", size=40)

    cols = [
        ("CSCRF FAQ · Q30", AQUA,
         "“…shall build an automated tool and suitable dashboard.”",
         "We are the mandated deliverable. And it scores on the CCI."),
        ("AI ADVISORY · MAY 2026", PERI,
         "“…autonomous/agentic mitigation.”",
         "SEBI asking for agentic AI with a human gate. This architecture."),
    ]
    w = Inches(5.65)
    for i, (src, col, quote, gloss) in enumerate(cols):
        x = M + (w + Inches(0.4)) * i
        panel(s, x, Inches(2.4), w, Inches(3.4))
        text(s, x + Inches(0.36), Inches(2.7), w - Inches(0.72), Inches(0.26),
             src, size=10.5, bold=True, colour=col)
        text(s, x + Inches(0.36), Inches(3.15), w - Inches(0.72), Inches(1.3),
             quote, size=19, colour=INK, spacing=1.4)
        rule(s, x + Inches(0.36), Inches(4.65), w - Inches(0.72))
        text(s, x + Inches(0.36), Inches(4.9), w - Inches(0.72), Inches(0.8),
             gloss, size=13, colour=INK_2, spacing=1.45)
    text(s, M, Inches(6.1), CONTENT_W, Inches(0.4),
         "Both checked against the published PDFs.", size=11, colour=INK_3)
    footer(s, 11)


def s12_honest(prs):
    s = slide(prs)
    kicker(s, Inches(0.8), "11", "What is real")
    headline(s, Inches(1.28), "The limits are on the slide too", size=40)

    real = ["205 of 205 pages read", "28 real SEBI PDFs, 0 problems",
            "The find was unprompted", "153 tests, hash-chained"]
    limits = ["CCI scores 8 of 23, abstains on the rest",
              "Our weights, labelled as ours",
              "105s to read 205 pages on a free tier",
              "Hindi passages: marked unread, not guessed"]
    for i, (title, col, rows) in enumerate([("WHAT WORKS", LIME, real),
                                            ("WHAT IT WILL NOT DO", PEACH, limits)]):
        x = M + Inches(6.1) * i
        text(s, x, Inches(2.6), Inches(5.5), Inches(0.26), title, size=10.5,
             bold=True, colour=col)
        for j, row in enumerate(rows):
            y = Inches(3.1) + Inches(0.78) * j
            d = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y + Inches(0.1),
                                   Inches(0.04), Inches(0.04))
            d.fill.solid(); d.fill.fore_color.rgb = col
            d.line.fill.background(); d.shadow.inherit = False
            text(s, x + Inches(0.24), y, Inches(5.25), Inches(0.6), row,
                 size=14, colour=INK_2, spacing=1.38)
    footer(s, 12)


def s13_close(prs):
    s = slide(prs)
    shield(s, M, Inches(1.95), Inches(0.5))
    # lines=2 on purpose: at 54pt this wraps, and with the default 1-line box the
    # overflow landed on top of the sub-line beneath it.
    headline(s, Inches(2.75),
             [("Decision support that ", {}), ("shows its work", {"colour": LIME})],
             size=54, w=Inches(10.4), lines=2)
    text(s, M, Inches(4.75), Inches(7.5), Inches(0.5),
         "— and stops where the source stops.", size=21, colour=INK_2)
    rule(s, M, Inches(5.5), Inches(5.2))
    text(s, M, Inches(5.75), Inches(6.5), Inches(0.9),
         "regos-sentinel.vercel.app", size=15, colour=INK, font=MONO, spacing=1.5)
    text(s, W - M - Inches(4.6), Inches(5.75), Inches(4.6), Inches(1.0),
         "A prototype for the SEBI TechSprint at GFF 2026. Not legal advice, "
         "not a SEBI determination.",
         size=10, colour=INK_3, align=PP_ALIGN.RIGHT, spacing=1.4)
    footer(s, 13)

def animate(prs) -> None:
    """Give every slide a slow cross-fade, and the product slides a push.

    python-pptx has no transition API, so this writes the element directly.
    Order inside <p:sld> is fixed by the schema — cSld, clrMapOvr, transition,
    timing — so the node is inserted immediately after clrMapOvr rather than
    appended, which PowerPoint would reject as malformed.

    A fade is deliberate. Wipes, cubes and page-curls are the deck equivalent of
    a bounce easing: they announce the transition instead of getting out of the
    way of the slide. The screenshot slides get a `push` because something
    genuinely moves the eye forward there.
    """
    ns = "http://schemas.openxmlformats.org/presentationml/2006/main"
    push_slides = {3, 4, 5, 9}          # zero-based: the four GIF slides
    for index, sld in enumerate(prs.slides):
        element = sld._element
        for existing in element.findall(f"{{{ns}}}transition"):
            element.remove(existing)
        inner = '<p:push dir="u"/>' if index in push_slides else "<p:fade/>"
        transition = parse_xml(
            f'<p:transition {nsdecls("p")} spd="slow" advClick="1">{inner}</p:transition>')

        anchor = element.find(f"{{{ns}}}clrMapOvr")
        if anchor is not None:
            anchor.addnext(transition)
        else:
            element.insert(1, transition)


def main() -> None:
    prs = deck()
    for build in (s01_cover, s02_defect, s03_how, s04_proof, s05_refuses,
                  s06_decision, s07_model, s08_model_vs_rule, s09_assistants,
                  s10_record, s11_fit, s12_honest, s13_close):
        build(prs)
    animate(prs)
    prs.save(OUT)
    size = OUT.stat().st_size / 1_000_000
    print(f"wrote {OUT}  ({len(prs.slides.__iter__.__self__._sldIdLst)} slides, {size:.1f} MB)")


if __name__ == "__main__":
    main()
