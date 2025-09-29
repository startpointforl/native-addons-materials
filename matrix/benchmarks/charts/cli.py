#!/usr/bin/env python3
"""
CLI для визуализации бенчмарков matrix
Простой командный интерфейс для генерации графиков из нового CSV формата
"""

import argparse
import sys
from pathlib import Path
from typing import List

from csv_parser import BenchmarkDataCollector
from plot_generator import BenchmarkPlotGenerator

def create_parser() -> argparse.ArgumentParser:
    """Создаем парсер аргументов командной строки"""
    parser = argparse.ArgumentParser(
        description='Генерация графиков из данных бенчмарков matrix (новый формат)',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры:
  # Сгенерировать график для конкретных методов
  python cli.py --benchmark-type isolated --methods js_base cpp_simd rust_base
  
  # С кастомным заголовком
  python cli.py --benchmark-type server --methods cpp_accelerate js_base --title "Производительность macOS"
  
  # Данные с macOS
  python cli.py --benchmark-type isolated --methods js_base cpp_accelerate --data-dir macos_results
  
  # Сравнение Linux vs macOS (две команды)
  python cli.py --benchmark-type isolated --methods js_base --data-dir linux_results --title "Linux"
  python cli.py --benchmark-type isolated --methods js_base --data-dir macos_results --title "macOS"
  
  # Интерактивный режим - выбор методов из списка
  python cli.py --benchmark-type isolated --interactive
  
  # Список доступных методов
  python cli.py --benchmark-type isolated --list-methods
        """
    )
    
    # Обязательные аргументы
    parser.add_argument(
        '--benchmark-type', '-b',
        required=True,
        choices=['isolated', 'server'],
        help='Тип данных бенчмарков для обработки (обязательно)'
    )
    
    # Выбор метода (один из: --methods, --interactive, --list-methods)
    method_group = parser.add_mutually_exclusive_group()
    method_group.add_argument(
        '--methods', '-m',
        nargs='+',
        help='Список имен методов для включения в график'
    )
    
    method_group.add_argument(
        '--interactive', '-i',
        action='store_true',
        help='Интерактивный выбор методов'
    )
    
    method_group.add_argument(
        '--list-methods', '-l',
        action='store_true',
        help='Показать все доступные методы для типа бенчмарка и выйти'
    )
    
    # Опциональные аргументы
    parser.add_argument(
        '--title', '-t',
        help='Кастомный заголовок для графика'
    )
    
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='Подробный вывод'
    )
    
    parser.add_argument(
        '--data-dir', '-d',
        default='raw_results',
        help='Папка с данными (по умолчанию: raw_results, варианты: macos_results, linux_results)'
    )
    
    return parser

def interactive_method_selection(collector: BenchmarkDataCollector, benchmark_type: str) -> List[str]:
    """Интерактивный выбор методов"""
    available_methods = collector.list_available_methods(benchmark_type)
    
    if not available_methods:
        print(f"❌ Не найдено методов для типа бенчмарка: {benchmark_type}")
        sys.exit(1)
    
    print(f"\n📋 Доступные методы для {benchmark_type} бенчмарков:")
    for i, method in enumerate(available_methods, 1):
        print(f"  {i:2d}. {method}")
    
    print(f"\n🎯 Выберите методы (например, '1 3 5' или 'all'):")
    while True:
        try:
            selection = input(">>> ").strip()
            
            if selection.lower() == 'all':
                return available_methods
            
            if selection.lower() in ['', 'q', 'quit', 'exit', 'выход', 'в']:
                print("Отменено.")
                sys.exit(0)
            
            # Парсим номера выбора
            indices = [int(x.strip()) - 1 for x in selection.split()]
            selected_methods = []
            
            for idx in indices:
                if 0 <= idx < len(available_methods):
                    selected_methods.append(available_methods[idx])
                else:
                    raise IndexError(f"Неверный выбор: {idx + 1}")
            
            if selected_methods:
                return selected_methods
            else:
                print("⚠️  Методы не выбраны. Попробуйте снова.")
                
        except (ValueError, IndexError) as e:
            print(f"⚠️  Неверный ввод: {e}")
            print("    Введите номера через пробел (например, '1 3 5') или 'all'")

def main():
    """Главная CLI функция"""
    parser = create_parser()
    args = parser.parse_args()
    
    if args.verbose:
        print(f"🚀 Визуализация бенчмарков matrix")
        print(f"   Тип бенчмарка: {args.benchmark_type}")
        print(f"   Папка данных: {args.data_dir}")
    
    # Инициализируем сборщик данных с кастомной папкой данных
    try:
        collector = BenchmarkDataCollector(data_dir=args.data_dir)
    except Exception as e:
        print(f"❌ Не удалось инициализировать сборщик данных: {e}")
        sys.exit(1)
    
    # Обрабатываем режим list-methods
    if args.list_methods:
        available_methods = collector.list_available_methods(args.benchmark_type)
        if available_methods:
            print(f"\n📋 Доступные методы для {args.benchmark_type} бенчмарков (папка: {args.data_dir}):")
            for method in available_methods:
                print(f"  • {method}")
        else:
            print(f"❌ Не найдено методов для типа бенчмарка: {args.benchmark_type} (папка: {args.data_dir})")
        sys.exit(0)
    
    # Определяем методы для построения графика
    if args.interactive:
        methods = interactive_method_selection(collector, args.benchmark_type)
    elif args.methods:
        methods = args.methods
    else:
        # Если методы не указаны и не интерактивный режим, показываем справку
        print("❌ Укажите либо --methods, либо используйте --interactive режим")
        parser.print_help()
        sys.exit(1)
    
    if args.verbose:
        print(f"   Методы: {', '.join(methods)}")
    
    # Собираем данные бенчмарков
    try:
        methods_data = collector.collect_benchmark_data(args.benchmark_type, methods)
    except Exception as e:
        print(f"❌ Ошибка сбора данных: {e}")
        sys.exit(1)
    
    # Инициализируем генератор графиков
    try:
        generator = BenchmarkPlotGenerator()
    except Exception as e:
        print(f"❌ Не удалось инициализировать генератор графиков: {e}")
        sys.exit(1)
    
    # Генерируем график
    try:
        # Определяем директорию вывода (настраивается в конфиге)
        output_dir = Path(__file__).parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        # Создаем имя выходного файла (добавляем префикс папки данных если не default)
        methods_str = "_".join(methods)
        if args.data_dir != 'raw_results':
            base_name = f"{args.data_dir}_{args.benchmark_type}_{methods_str}"
        else:
            base_name = f"{args.benchmark_type}_{methods_str}"
        
        # Определяем тип графика на основе типа бенчмарка
        if args.benchmark_type == 'server':
            plot_type = 'rps'
            default_title = f"Производительность RPS - {', '.join(methods)}"
        else:
            plot_type = 'performance'  
            default_title = f"Время выполнения - {', '.join(methods)}"
        
        title = args.title or default_title
        
        # Генерируем график
        output_path = generator.create_plot(
            methods_data, 
            args.benchmark_type, 
            plot_type,
            title=title,
            output_path=output_dir / base_name
        )
        
        print(f"✅ График успешно сгенерирован:")
        print(f"   📊 Заголовок: {title}")
        print(f"   📁 Вывод: {output_path}")
        print(f"   📈 Методы: {len(methods)} ({', '.join(methods)})")
        if args.data_dir != 'raw_results':
            print(f"   📂 Данные: {args.data_dir}")
        
        return 0
        
    except Exception as e:
        print(f"❌ Ошибка генерации графика: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())