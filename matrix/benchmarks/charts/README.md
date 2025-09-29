# Matrix Benchmark Charts

Cистема генерации графиков для бенчмарков.

## Быстрый старт

```bash
# 1. Установка зависимостей
cd benchmarks/charts
python3 -m venv venv --clear
source venv/bin/activate
pip install -r requirements.txt

# 2. Генерация графиков
python cli.py --benchmark-type isolated --methods js_base cpp_accelerate
```

## Команды CLI

### Основные команды

```bash
# Сгенерировать график для конкретных методов
python cli.py --benchmark-type isolated --methods js_base cpp_accelerate

# С кастомным заголовком
python cli.py --benchmark-type server --methods cpp_accelerate --title "macOS Performance"

# С кастомной директорией
python cli.py --benchmark-type server --methods cpp_accelerate --data-dir macos_results

# Посмотреть доступные методы
python cli.py --benchmark-type isolated --list-methods
python cli.py --benchmark-type server --list-methods

# Интерактивный выбор методов
python cli.py --benchmark-type isolated --interactive
```

### Параметры

| Параметр | Краткая форма | Описание | Обязательный |
|----------|---------------|----------|--------------|
| `--benchmark-type` | `-b` | Тип бенчмарка: `isolated` или `server` | ✅ |
| `--methods` | `-m` | Список методов через пробел | * |
| `--interactive` | `-i` | Интерактивный выбор методов | * |
| `--list-methods` | `-l` | Показать доступные методы | * |
| `--title` | `-t` | Кастомный заголовок графика | ❌ |
| `--data-dir` | `-d` | Кастомная директория с данными | ❌ |
| `--verbose` | `-v` | Подробный вывод | ❌ |

*Один из параметров `--methods`, `--interactive`, `--list-methods` обязателен*

## Структура данных

Система ожидает файлы в формате:
```
../raw_results/
├── isolated/
│   ├── js_base_2025-09-05T16-00-58.csv
│   ├── cpp_accelerate_2025-09-05T15-59-30.csv
│   └── rust_simd_2025-09-05T14-30-15.csv
└── server/
    ├── js_base_2025-09-05T15-54-05.csv
    └── cpp_accelerate_2025-09-05T15-57-13.csv
```

**Формат filename:** `{method_name}_{timestamp}.csv`  
**Автоматический выбор:** Всегда берется файл с последним timestamp для каждого метода.

## Конфигурация

Все настройки (цвета, форматы сохранения, шкалы) находятся в:
- `config/method_colors.json` - цвета и стили методов
- `config/graph_styles.json` - настройки графиков

### Пример настроек в graph_styles.json:
```json
{
  "export": {
    "formats": ["png", "svg"],
    "png_dpi": 300
  },
  "scales": {
    "rps_log_scale": true,
    "performance_log_scale": true
  }
}
```

## Примеры результатов

После выполнения команды график сохраняется в `output/`:
- `isolated_js_base_cpp_accelerate.png`
- `isolated_js_base_cpp_accelerate.svg`

### Isolated бенчмарки
- **Y-ось:** Execution Time (ms)
- **Метрика:** Время выполнения (меньше = лучше)

### Server бенчмарки  
- **Y-ось:** Requests per Second (RPS)
- **Метрика:** Пропускная способность (больше = лучше)

## Валидация

Система строго валидирует наличие данных:

```bash
❌ Missing data for methods: rust_simd, nonexistent_method
   Available methods: js_base, cpp_accelerate
```

**При отсутствии любого из запрошенных методов:** график не строится, выводится понятная ошибка.

## Автоматизация

```bash
# Сгенерировать все графики, используемые в презентации
./generate_charts.sh
```

## Решение проблем

### Virtual Environment
Если venv не активируется или pip не работает:
```bash
rm -rf venv
python3 -m venv venv --clear
source venv/bin/activate
pip install -r requirements.txt
```

### Отсутствие данных
```bash
# Проверить какие методы доступны
python cli.py -b isolated -l
python cli.py -b server -l
```

### Отладка
```bash
# Включить подробный вывод
python cli.py -b isolated -m js_base -v
```
