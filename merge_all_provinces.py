import json
from pathlib import Path

def main():
    data_dir = Path("data")
    output_path = data_dir / "all_leaders_combined.json"
    
    national_combined = {}
    
    print("🔄 开始全自动融合全国 34 省高精在岗数据库...")
    
    # 遍历 data 文件夹下所有省份的单独 JSON 文件
    for json_file in data_dir.glob("*.json"):
        # 跳过总汇总表本身，防止死循环
        if json_file.name == "all_leaders_combined.json":
            continue
            
        province_code = json_file.stem
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                province_data = json.load(f)
                national_combined[province_code] = province_data
                print(f"  📎 成功合入省份数据：[{province_code}]")
        except Exception as e:
            print(f"  ❌ 读取 [{json_file.name}] 失败: {e}")
            
    # 将全国所有数据打包写入前端最终读取的大总表
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(national_combined, f, ensure_ascii=False, indent=2)
        
    print(f"\n🎉 恭喜！全国大融合彻底成功！最终总表已生成至: {output_path}")

if __name__ == "__main__":
    main()