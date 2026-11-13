#!/usr/bin/env python3
"""Настройка Handy под русскую диктовку на GigaAM v3.

Запускать только при закрытом Handy: работающее приложение перезапишет файл своим.
Меняет только те ключи, которые уже есть в файле настроек, и делает копию рядом.

    python handy_settings.py                      # показать, что изменится, и применить
    python handy_settings.py --key fn             # заодно поставить клавишу диктовки
    python handy_settings.py --dry-run            # только показать
    python handy_settings.py --file /путь/settings_store.json
"""
import argparse
import json
import os
import shutil
import sys
import time

MODEL_FILE = "gigaam-v3-e2e-rnnt-Q8_0.gguf"
MODEL_ID = "handy-computer/gigaam-v3-e2e-rnnt-gguf/" + MODEL_FILE

WANTED = {
    "selected_model": MODEL_ID,
    "selected_language": "ru",
    "app_language": "ru",
    "push_to_talk": True,
    "reliable_paste": True,
    "paste_delay_ms": 100,
    "paste_delay_after_ms": 400,
}


def default_dir():
    if sys.platform == "darwin":
        return os.path.expanduser("~/Library/Application Support/com.pais.handy")
    if sys.platform.startswith("win"):
        return os.path.join(os.environ.get("APPDATA", ""), "com.pais.handy")
    return os.path.expanduser("~/.local/share/com.pais.handy")


def main():
    ap = argparse.ArgumentParser(description="Настройка Handy под GigaAM v3")
    ap.add_argument("--file", help="путь к settings_store.json")
    ap.add_argument("--key", help="клавиша диктовки, например fn или option+space")
    ap.add_argument("--dry-run", action="store_true", help="ничего не записывать")
    args = ap.parse_args()

    path = args.file or os.path.join(default_dir(), "settings_store.json")
    if not os.path.isfile(path):
        print("НЕТ ФАЙЛА НАСТРОЕК: " + path)
        print("Запусти Handy один раз, пройди первый экран, закрой Handy и повтори.")
        return 2

    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    settings = data.get("settings") if isinstance(data.get("settings"), dict) else data

    model_path = os.path.join(os.path.dirname(path), "models", MODEL_FILE)
    if not args.file and not os.path.isfile(model_path):
        print("НЕТ ФАЙЛА МОДЕЛИ: " + model_path)
        print("Сначала скачай модель (шаг 2.2 инструкции), потом повтори.")
        return 3

    changed, same, skipped = [], [], []
    for key, value in WANTED.items():
        if key not in settings:
            skipped.append(key)
        elif settings[key] == value:
            same.append(key)
        else:
            changed.append("%s: %r -> %r" % (key, settings[key], value))
            settings[key] = value

    if args.key:
        binding = settings.get("bindings", {}).get("transcribe")
        if not isinstance(binding, dict) or "current_binding" not in binding:
            skipped.append("bindings.transcribe.current_binding")
        elif binding["current_binding"] == args.key:
            same.append("клавиша диктовки")
        else:
            changed.append("клавиша диктовки: %r -> %r" % (binding["current_binding"], args.key))
            binding["current_binding"] = args.key

    print("Файл: " + path)
    print("Изменено (%d):" % len(changed))
    for line in changed:
        print("  " + line)
    print("Уже было как надо: " + (", ".join(same) or "ничего"))
    if skipped:
        print("НЕТ ТАКИХ КЛЮЧЕЙ В ЭТОЙ ВЕРСИИ (не трогал): " + ", ".join(skipped))

    if args.dry_run:
        print("Пробный прогон: файл не менялся.")
        return 0
    if not changed:
        print("Менять нечего.")
        return 0

    backup = path + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
    shutil.copy2(path, backup)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, path)
    print("Копия прежних настроек: " + backup)
    print("Готово.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
