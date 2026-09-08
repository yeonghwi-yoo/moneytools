#!/usr/bin/env python3
"""guide-*.html 을 읽어 루트 rss.xml 을 생성한다.

새 가이드를 추가한 뒤 `python3 scripts/build_rss.py` 를 실행하면 된다.
- 제목: 각 글의 <h1>
- 설명: 각 글의 meta description
- 날짜/분류: 각 글의 <p class="article-meta"> ("금융 가이드 · 세금 · 2026-09-07 기준")
- 정렬: 날짜 내림차순, 같은 날짜는 guides.html 목록 순서를 따름
"""
import glob
import html
import os
import re
import sys

SITE = "https://money-tools.org"
SITE_NAME = "얼마받지"
FEED_DESC = "연봉 실수령액·4대보험·실업급여·적금·대출 등 금융 계산기와 함께 보는 금융 가이드. 2026년 요율·제도 기준."
MAX_ITEMS = 30
PUB_TIME = "07:30:00 +0900"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rfc822(date_str):
    """2026-09-07 -> Mon, 07 Sep 2026 07:30:00 +0900"""
    y, m, d = (int(x) for x in date_str.split("-"))
    # Sakamoto 요일 계산
    t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
    yy = y - (1 if m < 3 else 0)
    wd = (yy + yy // 4 - yy // 100 + yy // 400 + t[m - 1] + d) % 7  # 0=일요일
    return "%s, %02d %s %d %s" % (WEEKDAYS[(wd + 6) % 7], d, MONTHS[m - 1], y, PUB_TIME)


def field(pattern, text, name, path):
    m = re.search(pattern, text, re.S)
    if not m:
        sys.exit("[build_rss] %s 에서 %s 를 찾지 못했습니다." % (path, name))
    return m.group(1).strip()


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def main():
    os.chdir(ROOT)

    order = {}
    with open("guides.html", encoding="utf-8") as f:
        for i, slug in enumerate(re.findall(r'href="(guide-[^"]+\.html)"', f.read())):
            order.setdefault(slug, i)

    items = []
    for path in sorted(glob.glob("guide-*.html")):
        with open(path, encoding="utf-8") as f:
            doc = f.read()
        meta = strip_tags(field(r'<p class="article-meta">(.*?)</p>', doc, "article-meta", path))
        date = field(r"(\d{4}-\d{2}-\d{2})", meta, "날짜", path)
        parts = [p.strip() for p in meta.split("·")]
        category = parts[1] if len(parts) > 2 else "금융 가이드"
        items.append({
            "path": path,
            "title": strip_tags(field(r"<h1>(.*?)</h1>", doc, "h1", path)),
            "desc": html.unescape(field(r'<meta name="description" content="([^"]*)">', doc, "description", path)),
            "date": date,
            "category": category,
        })

    items.sort(key=lambda it: (it["date"], -order.get(it["path"], 10**6)), reverse=True)
    items = items[:MAX_ITEMS]

    e = html.escape
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        "    <title>%s — 금융 가이드</title>" % e(SITE_NAME),
        "    <link>%s/guides.html</link>" % SITE,
        "    <description>%s</description>" % e(FEED_DESC),
        "    <language>ko</language>",
        '    <atom:link href="%s/rss.xml" rel="self" type="application/rss+xml"/>' % SITE,
    ]
    if items:
        lines.append("    <lastBuildDate>%s</lastBuildDate>" % rfc822(items[0]["date"]))
    for it in items:
        url = "%s/%s" % (SITE, it["path"])
        lines += [
            "    <item>",
            "      <title>%s</title>" % e(it["title"]),
            "      <link>%s</link>" % url,
            '      <guid isPermaLink="true">%s</guid>' % url,
            "      <category>%s</category>" % e(it["category"]),
            "      <pubDate>%s</pubDate>" % rfc822(it["date"]),
            "      <description>%s</description>" % e(it["desc"]),
            "    </item>",
        ]
    lines += ["  </channel>", "</rss>", ""]

    with open("rss.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("[build_rss] rss.xml 생성 완료 — %d편" % len(items))


if __name__ == "__main__":
    main()
