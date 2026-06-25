import json
import re
import subprocess
from pathlib import Path
from datetime import datetime

DATA_JS = Path("data.js")
AUTO_JSON = Path("data/leaders.json")
OUTPUT_JSON = Path("data/leaders.json")

EMPTY_WORDS = ["待自动提取", "待补充", "官方完整早年工作经历持续整理中。", ""]

def load_manual_from_data_js():
    js_code = DATA_JS.read_text(encoding="utf-8")
    js_code = re.sub(r"const\s+leaders\s*=", "global.leaders =", js_code, count=1)

    node_code = f"""
    {js_code}
    console.log(JSON.stringify(global.leaders));
    """

    result = subprocess.run(
        ["node", "-e", node_code],
        capture_output=True,
        text=True,
        check=True
    )

    return json.loads(result.stdout)

def is_empty_value(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() in EMPTY_WORDS or value.strip().startswith("待自动提取")
    if isinstance(value, list):
        if len(value) == 0:
            return True
        return all(is_empty_value(v) for v in value)
    return False

def merge_person(manual, auto):
    merged = dict(auto)

    for key, manual_value in manual.items():
        auto_value = merged.get(key)

        # 人工核验内容优先，只在人工内容为空/待提取时用自动结果
        if not is_empty_value(manual_value):
            merged[key] = manual_value
        elif not is_empty_value(auto_value):
            merged[key] = auto_value
        else:
            merged[key] = manual_value

    return merged

def main():
    if not DATA_JS.exists():
        raise FileNotFoundError("找不到 data.js")

    if not AUTO_JSON.exists():
        raise FileNotFoundError("找不到 data/leaders.json，请先运行 crawler.py")

    manual_data = load_manual_from_data_js()
    auto_data = json.loads(AUTO_JSON.read_text(encoding="utf-8"))

    manual_by_name = {p["name"]: p for p in manual_data if "name" in p}
    auto_by_name = {p["name"]: p for p in auto_data if "name" in p}

    final = []

    # 以 data.js 顺序为主
    for manual_person in manual_data:
        name = manual_person.get("name")
        auto_person = auto_by_name.get(name, {})
        final.append(merge_person(manual_person, auto_person))

    # 自动抓到但 data.js 没有的人，追加进去
    for auto_person in auto_data:
        name = auto_person.get("name")
        if name and name not in manual_by_name:
            final.append(auto_person)

    backup_path = Path(f"data/leaders_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    backup_path.write_text(json.dumps(auto_data, ensure_ascii=False, indent=2), encoding="utf-8")

    OUTPUT_JSON.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"安全合并完成：共 {len(final)} 人")
    print(f"已备份旧 leaders.json：{backup_path}")
    print(f"已输出：{OUTPUT_JSON}")
    print("注意：data.js 没有被修改。")

if __name__ == "__main__":
    main()