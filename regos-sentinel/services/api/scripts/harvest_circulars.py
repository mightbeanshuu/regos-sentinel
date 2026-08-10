"""Harvest published SEBI circulars: listing -> detail page -> attached PDF.

The listing is a Struts app: it paginates over a session and every POST carries
`org.apache.struts.taglib.html.TOKEN`, which is why a bare POST answers 530. So
we hold a cookie jar, re-read the token from each response, and walk pages.
"""
from __future__ import annotations

import os
import re
import sys
import time
from urllib.parse import urljoin

import httpx

LIST_URL = "https://www.sebi.gov.in/sebiweb/home/HomeAction.do"
BASE = "https://www.sebi.gov.in"
OUT = "/Users/mac/Desktop/02-Hackathons/sebi hackathon/real-pdfs"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36"

TOKEN_RE = re.compile(r'name="org\.apache\.struts\.taglib\.html\.TOKEN"\s+value="([^"]+)"')
LINK_RE = re.compile(r'href="(https://www\.sebi\.gov\.in/legal/circulars/[^"]+\.html)"')
PDF_RE = re.compile(r'(/sebi_data/attachdocs/[^"\'\s>]+\.pdf)')

WANT = int(sys.argv[1]) if len(sys.argv) > 1 else 110


def slug(url: str) -> str:
    name = url.rstrip("/").split("/")[-1].replace(".html", "")
    return re.sub(r"[^a-z0-9._-]+", "-", name.lower())[:110]


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    have = {f for f in os.listdir(OUT) if f.endswith(".pdf")}
    print(f"{len(have)} PDFs already on disk")

    seen: list[str] = []
    with httpx.Client(
        headers={"User-Agent": UA, "Referer": LIST_URL},
        timeout=45.0,
        follow_redirects=True,
    ) as client:
        params = {"doListing": "yes", "sid": "1", "ssid": "7", "smid": "0"}
        page = client.get(LIST_URL, params=params)
        html = page.text
        seen.extend(LINK_RE.findall(html))
        print(f"  current page: {len(seen)} links")

        # `nextValue` paging is session-bound and just re-serves page 1, so the
        # corpus is sliced by DATE instead — the one filter the form honours.
        # Format matters: dd-mm-yyyy returns results, dd/mm/yyyy silently
        # re-serves the default page and yyyy-mm-dd returns nothing at all.
        months = []
        year, month = 2026, 8
        for _ in range(30):
            months.append((year, month))
            month -= 1
            if month == 0:
                year, month = year - 1, 12

        last_day = {1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31}
        for year, month in months:
            if len(seen) >= WANT:
                break
            token = TOKEN_RE.search(html)
            if not token:
                print("  no CSRF token — stopping the walk")
                break
            data = {
                "org.apache.struts.taglib.html.TOKEN": token.group(1),
                "sid": "1", "ssid": "7", "smid": "0",
                "ssidhidden": "7", "smidhidden": "0",
                "sectName": "Legal", "search": "",
                "fromDate": f"01-{month:02d}-{year}",
                "toDate": f"{last_day[month]}-{month:02d}-{year}",
                "deptId": "", "intmid": "", "doDirect": "1", "nextValue": "1",
            }
            resp = client.post(LIST_URL, params=params, data=data)
            if resp.status_code != 200:
                print(f"  {month:02d}-{year} -> HTTP {resp.status_code}")
                continue
            html = resp.text
            found = LINK_RE.findall(html)
            fresh = [u for u in found if u not in seen]
            seen.extend(fresh)
            print(f"  {month:02d}-{year}: {len(found)} listed, {len(fresh)} new ({len(seen)} total)")
            time.sleep(0.7)

        print(f"\n{len(seen)} circular pages found. Fetching PDFs…")
        got = 0
        for index, url in enumerate(seen, 1):
            name = slug(url)
            target = os.path.join(OUT, f"{name}.pdf")
            if any(name[:60] in existing for existing in have):
                continue
            if os.path.exists(target):
                continue
            try:
                detail = client.get(url)
                match = PDF_RE.search(detail.text)
                if not match:
                    continue
                pdf = client.get(urljoin(BASE, match.group(1)))
                if pdf.status_code != 200 or not pdf.content.startswith(b"%PDF"):
                    continue
                with open(target, "wb") as handle:
                    handle.write(pdf.content)
                got += 1
                print(f"  [{index}/{len(seen)}] {name[:70]}  {len(pdf.content)//1024} KB")
            except Exception as error:  # noqa: BLE001 — a miss is not fatal
                print(f"  [{index}] {name[:50]} failed: {type(error).__name__}")
            time.sleep(0.4)

    total = len([f for f in os.listdir(OUT) if f.endswith(".pdf")])
    print(f"\ndownloaded {got} new · {total} PDFs on disk")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
