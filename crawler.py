import json
import re
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.hunan.gov.cn"
LEADERS_PAGE = "https://www.hunan.gov.cn/hnszf/szf/szf.html"
OUTPUT_PATH = Path("data/leaders.json")

HEADERS = {"User-Agent": "Mozilla/5.0"}

VALID_NAMES = {"毛伟明", "王道席", "王一鸥", "蒋涤非", "王俊寿", "陈竞", "余红胜", "王卫安"}

def fetch(url):
    r = requests.get(url, headers=HEADERS, timeout=8)
    r.encoding = r.apparent_encoding
    r.raise_for_status()
    return r.text

def clean(text):
    return re.sub(r"\s+", " ", text or "").strip()

def get_soup(url):
    return BeautifulSoup(fetch(url), "lxml")

def extract_article_text(url):
    if not url:
        return "待自动提取"
    try:
        soup = get_soup(url)
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        candidates = soup.select(".article, .TRS_Editor, .content, .main, .xxgk-content, .detail")
        if candidates:
            text = max([clean(c.get_text(" ")) for c in candidates], key=len)
        else:
            text = clean(soup.get_text(" "))

        text = text.replace("中国政府网 湖南省人大网 湖南省政协网", "")
        return text[:5000] if text else "待自动提取"
    except Exception as e:
        return f"待自动提取：{e}"

def find_subpage(profile_url, keywords):
    urls_to_scan = [profile_url]

    if profile_url.endswith(".html"):
        base_dir = profile_url.rsplit("/", 1)[0] + "/"
        urls_to_scan.append(base_dir)

    for page_url in urls_to_scan:
        try:
            soup = get_soup(page_url)

            for a in soup.find_all("a"):
                text = clean(a.get_text())
                href = a.get("href")
                if not href:
                    continue

                full = urljoin(page_url, href)

                bad_parts = ["hdjl", "zfhy", "xw", "zwgk", "zwfw", "sjfb", "jxlx", "wzdt"]
                if any(bad in full for bad in bad_parts):
                    continue

                if any(k in text for k in keywords):
                    return full

                if any(k in keywords for k in ["简历", "领导简历"]) and ("jl" in full or "jianli" in full):
                    return full

                if any(k in keywords for k in ["工作分工", "分工"]) and ("gzfg" in full or "fg" in full):
                    return full

        except Exception:
            continue

    return ""

def extract_position_from_profile(profile_url, name):
    try:
        soup = get_soup(profile_url)
        text = clean(soup.get_text(" "))

        # 优先从页面文字中找完整职务
        patterns = [
            r"二十届中央委员，湖南省委副书记，省人民政府党组书记、省长",
            r"湖南省委副书记，省人民政府党组书记、省长",
            r"湖南省委常委，省人民政府常务副省长、党组副书记",
            r"湖南省人民政府副省长、党组成员，省公安厅党委书记、厅长",
            r"湖南省人民政府副省长，民革湖南省委会主委",
            r"湖南省人民政府副省长、党组成员",
            r"湖南省人民政府秘书长、党组成员",
            r"湖南省人民政府秘书长"
        ]

        for p in patterns:
            m = re.search(p, text)
            if m:
                return m.group(0)

        # 如果页面只写短职务，则兜底
        fallback_titles = [
            "省长",
            "常务副省长",
            "副省长",
            "秘书长"
        ]

        for title in fallback_titles:
            if title in text:
                return title

        return "待自动提取"

    except Exception:
        return "待自动提取"

def parse_leaders():
    soup = get_soup(LEADERS_PAGE)
    leaders = []
    seen = set()

    for a in soup.find_all("a"):
        href = a.get("href")
        text = clean(a.get_text(" "))
        if not href or not text:
            continue

        full_url = urljoin(LEADERS_PAGE, href)

        if "/zfld/" not in full_url:
            continue

        if "/2026" in full_url or "/2025" in full_url:
            continue

        if "hydj" in full_url or "zfhy" in full_url or "xw" in full_url:
            continue

        name = None
        for valid_name in VALID_NAMES:
            if valid_name in text or valid_name in full_url:
                name = valid_name
                break

        if not name:
            continue

        if name in seen:
            continue

        seen.add(name)

        print(f"正在处理：{name} {full_url}")

        position = extract_position_from_profile(full_url, name)
        resume_url = find_subpage(full_url, ["简历", "领导简历"])
        division_url = find_subpage(full_url, ["工作分工", "分工"])

        resume_text = extract_article_text(resume_url)
        division_text = extract_article_text(division_url)

        leaders.append({
            "name": name,
            "position": position,
            "category": "省政府领导",
            "profile_url": full_url,
            "resume_url": resume_url,
            "division_url": division_url,
            "basic": [
                ["姓名", name],
                ["现任职务", position],
                ["工作分工", division_text[:800] if division_text != "待自动提取" else "待自动提取"],
                ["数据版本", "Auto V3.0（湖南）"],
                ["最后自动提取时间", "2026-06-25"],
                ["信息状态", "由 crawler.py 从湖南省人民政府官网自动提取，需人工复核"]
            ],
            "career": [
                resume_text
            ],
            "appointments": [
                "待自动提取"
            ],
            "sources": [
                f"湖南省人民政府官网——个人页面：{full_url}",
                f"湖南省人民政府官网——简历页面：{resume_url or '待自动提取'}",
                f"湖南省人民政府官网——工作分工：{division_url or '待自动提取'}"
            ]
        })

    return leaders

def main():
    print("开始抓取湖南省政府领导页面...")
    leaders = parse_leaders()

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(leaders, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"完成：共提取 {len(leaders)} 位领导")
    print(f"保存路径：{OUTPUT_PATH}")

if __name__ == "__main__":
    main()