"""
MARS SPACE — Terminal Login
Requires: pip install rich prompt_toolkit
"""

import sys
import io
import os

# Force UTF-8 on Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
    os.system("chcp 65001 > nul 2>&1")

import time
import threading
import getpass
from rich.console import Console
from rich.text import Text
from rich.panel import Panel
from rich.align import Align
from rich.columns import Columns
from rich import box
from rich.live import Live
from rich.spinner import Spinner
from rich.rule import Rule

console = Console(
    force_terminal=True,
    highlight=False,
    legacy_windows=False,
    file=sys.stdout,
)

# ─── DEMO CREDENTIALS ────────────────────────────────────────────────────────
DEMO_USERS = {
    "admin":   "admin123",
    "cosmo":   "space2026",
    "marsit":  "mars2026",
}

# ─── COLORS / THEME ──────────────────────────────────────────────────────────
ORANGE   = "#FF6B35"
CYAN     = "#00D4FF"
DKORANGE = "#CC4400"
DKCYAN   = "#007EA8"
GREY     = "#444466"
LTGREY   = "#888899"
WHITE    = "#E8E8FF"
RED      = "#FF3355"
GREEN    = "#39FF14"
STARS    = "#1A1A2E"


# ─── ASCII LOGO ──────────────────────────────────────────────────────────────
LOGO = r"""
  ███╗   ███╗ █████╗ ██████╗ ███████╗    ███████╗██████╗  █████╗  ██████╗███████╗
  ████╗ ████║██╔══██╗██╔══██╗██╔════╝    ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██╔████╔██║███████║██████╔╝███████╗    ███████╗██████╔╝███████║██║     █████╗
  ██║╚██╔╝██║██╔══██║██╔══██╗╚════██║    ╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝
  ██║ ╚═╝ ██║██║  ██║██║  ██║███████║    ███████║██║     ██║  ██║╚██████╗███████╗
  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝
"""

MINI_LOGO = r"""
  ███╗   ███╗ ███████╗
  ████╗ ████║ ██╔════╝
  ██╔████╔██║ ███████╗
  ██║╚██╔╝██║ ╚════██║
  ██║ ╚═╝ ██║ ███████║
  ╚═╝     ╚═╝ ╚══════╝
"""

PLANET = r"""
        .      .       *    .
    .       *               .        .
  .     .    .    *     .       .
       .   ___________    .
   *      /   _____   \       *    .
    .    /  /       \  \
        |  |  O   O  |  |   .
    .   |  |  _____  |  |         .
        \  \   ---   /  /    *
    *    \___________/
  .          | | |      .
        .    . . .    .      *
"""

TAGLINE = ">>  Explore the final frontier of streaming  <<"

# ─── STARFIELD ───────────────────────────────────────────────────────────────
STARFIELD = [
    ".  *       .    +      .       +  .    *      .   +      .",
    "   .    +      .    .      *    .       +      .     .    +",
    " +    .     *     .    +    .      .    *    +      .    .  ",
]

# ─── HELPERS ─────────────────────────────────────────────────────────────────
def clear():
    console.clear()

def stars_line(text_color: str = GREY):
    for line in STARFIELD:
        console.print(f"  {line}", style=f"dim {text_color}")

def divider(color=CYAN):
    console.print(Rule(style=color))

def gap(n=1):
    for _ in range(n):
        console.print()

# ─── SCREENS ─────────────────────────────────────────────────────────────────
def draw_intro():
    clear()
    gap()

    # Starfield top
    for line in STARFIELD:
        console.print(f"  {line}", style=f"dim {GREY}")

    gap()

    # Logo
    logo_text = Text(LOGO, style=f"bold {ORANGE}")
    console.print(Align.center(logo_text))

    # Tagline
    console.print(Align.center(Text(TAGLINE, style=f"italic {CYAN}")))

    gap()

    # Starfield bottom
    for line in STARFIELD:
        console.print(f"  {line}", style=f"dim {GREY}")

    gap()

    # Planet sidebar + info
    planet_text  = Text(PLANET, style=DKORANGE)
    info_text    = Text()
    info_text.append("  SYSTEM STATUS\n", style=f"bold {CYAN}")
    info_text.append(f"  ─────────────────────────\n", style=GREY)
    info_text.append("  Server   ", style=LTGREY)
    info_text.append("ONLINE [OK]\n", style=GREEN)
    info_text.append("  Region   ", style=LTGREY)
    info_text.append("UZ-MARS-01\n", style=ORANGE)
    info_text.append("  Latency  ", style=LTGREY)
    info_text.append("12 ms\n", style=CYAN)
    info_text.append("  Build    ", style=LTGREY)
    info_text.append("v2.6.0-stable\n", style=LTGREY)
    info_text.append("\n  FEATURES\n", style=f"bold {CYAN}")
    info_text.append(f"  ─────────────────────────\n", style=GREY)
    info_text.append("  [*] HD Streaming\n", style=ORANGE)
    info_text.append("  [*] Watch Party\n", style=ORANGE)
    info_text.append("  [*] Social Feed\n", style=ORANGE)
    info_text.append("  [*] Offline Mode\n", style=ORANGE)

    cols = Columns([
        Align.center(planet_text, vertical="middle"),
        Align.left(info_text, vertical="middle"),
    ], equal=False, expand=True)
    console.print(cols)

    gap()
    divider(ORANGE)
    console.print(
        Align.center(Text("[ SECURE TERMINAL ACCESS — AUTHORIZED PERSONNEL ONLY ]",
                          style=f"bold {ORANGE}"))
    )
    divider(ORANGE)
    gap()


def draw_login_box():
    t = Text()
    t.append("  Welcome back, astronaut.\n", style=f"italic {LTGREY}")
    t.append("  Enter your credentials to access MARS SPACE.\n", style=LTGREY)

    console.print(
        Panel(
            t,
            title=f"[bold {CYAN}]>>>  AUTHENTICATION  <<<[/]",
            border_style=CYAN,
            box=box.DOUBLE_EDGE,
            padding=(0, 2),
        )
    )
    gap()


def spinner_task(label: str, duration: float = 2.0, color: str = CYAN):
    spinner = Spinner("dots12", text=f"[bold {color}]  {label}[/]", style=color)
    with Live(spinner, console=console, refresh_per_second=20):
        time.sleep(duration)


def show_success(username: str):
    gap()
    console.print(
        Panel(
            Align.center(
                Text(f"\n  ACCESS GRANTED  —  Hello, {username.upper()}!\n",
                     style=f"bold {GREEN}")
            ),
            border_style=GREEN,
            box=box.DOUBLE_EDGE,
        )
    )
    gap()

    spinner_task("Initializing MARS SPACE environment ...", 1.2, GREEN)
    spinner_task("Loading your profile & watchlist ...", 0.9, CYAN)
    spinner_task("Connecting to streaming servers ...", 0.8, ORANGE)

    gap()
    console.print(Align.center(
        Text(">>  Launch sequence complete. Welcome aboard!  <<", style=f"bold {ORANGE}")
    ))
    gap()
    divider(GREEN)
    console.print(Align.center(
        Text("Open http://localhost:3000 in your browser", style=f"bold {CYAN}")
    ))
    divider(GREEN)
    gap()


def show_error(msg: str):
    gap()
    console.print(
        Panel(
            Align.center(Text(f"\n  {msg}\n", style=f"bold {RED}")),
            border_style=RED,
            box=box.HEAVY,
            title=f"[bold {RED}]⛔  ACCESS DENIED[/]",
        )
    )
    gap()


def show_loading():
    spinner_task("Verifying credentials against MARS SPACE database ...", 1.8, CYAN)


# ─── MAIN LOGIN FLOW ─────────────────────────────────────────────────────────
def run_login():
    draw_intro()
    draw_login_box()

    attempts = 0
    max_attempts = 3

    while attempts < max_attempts:
        remaining = max_attempts - attempts

        # Username
        try:
            console.print(f"  [bold {CYAN}]  >> Username  : [/]", end="")
            username = input().strip()
        except (KeyboardInterrupt, EOFError):
            gap()
            console.print(f"  [dim {LTGREY}]Session terminated.[/]")
            gap()
            sys.exit(0)

        if not username:
            console.print(f"  [bold {RED}]Username cannot be empty.[/]")
            continue

        # Password (masked)
        try:
            console.print(f"  [bold {CYAN}]  >> Password  : [/]", end="")
            password = getpass.getpass("").strip()
        except (KeyboardInterrupt, EOFError):
            gap()
            console.print(f"  [dim {LTGREY}]Session terminated.[/]")
            gap()
            sys.exit(0)

        gap()
        show_loading()

        # Validate
        if username in DEMO_USERS and DEMO_USERS[username] == password:
            show_success(username)
            return True
        else:
            attempts += 1
            left = max_attempts - attempts
            if left > 0:
                show_error(f"Invalid credentials.  {left} attempt(s) remaining.")
                gap()
                console.print(
                    f"  [dim {LTGREY}]Hint: try  admin / admin123  or  marsit / mars2026[/]"
                )
                gap()
            else:
                show_error("Maximum attempts exceeded.  Terminal session locked.")
                gap()
                console.print(
                    Panel(
                        Align.center(Text(
                            "\n  Your IP has been logged.\n  Contact mission control at support@marsit.uz\n",
                            style=LTGREY
                        )),
                        border_style=DKORANGE,
                        box=box.MINIMAL,
                    )
                )
                gap()
                return False

    return False


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    run_login()
