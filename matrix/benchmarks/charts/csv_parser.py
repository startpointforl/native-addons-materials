#!/usr/bin/env python3
"""
CSV парсер для визуализации бенчмарков matrix
Новый формат: отдельный CSV файл для каждого метода с временными метками
"""

import pandas as pd
import numpy as np
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from datetime import datetime
from collections import defaultdict

class BenchmarkDataCollector:
    def __init__(self, config_dir: Path = None, data_dir: str = "raw_results"):
        if config_dir is None:
            config_dir = Path(__file__).parent / "config"
        
        self.config_dir = config_dir
        self.results_dir = Path(__file__).parent.parent / data_dir
        self.data_dir = data_dir  # Сохраняем для информативных сообщений
        self.load_configs()
    
    def load_configs(self):
        """Загружаем конфигурационные файлы"""
        try:
            with open(self.config_dir / "method_colors.json", 'r') as f:
                self.method_config = json.load(f)
            
            with open(self.config_dir / "graph_styles.json", 'r') as f:
                self.style_config = json.load(f)
        except FileNotFoundError as e:
            print(f"Предупреждение: Конфигурационный файл не найден: {e}")
            self.method_config = {}
            self.style_config = {}
    
    def scan_directory(self, benchmark_type: str) -> Dict[str, Path]:
        """
        Сканируем директорию для поиска файлов бенчмарков и возвращаем последний файл для каждого метода
        Возвращает: {"имя_метода": Путь_к_последнему_файлу}
        """
        if benchmark_type not in ['isolated', 'server']:
            raise ValueError(f"Неверный тип бенчмарка: {benchmark_type}. Должен быть 'isolated' или 'server'")
        
        benchmark_dir = self.results_dir / benchmark_type
        if not benchmark_dir.exists():
            raise FileNotFoundError(f"Директория бенчмарков не найдена: {benchmark_dir}")
        
        # Группируем файлы по имени метода
        method_files = defaultdict(list)
        
        for csv_file in benchmark_dir.glob("*.csv"):
            method_name, timestamp = self._parse_filename(csv_file.name)
            if method_name and timestamp:
                method_files[method_name].append((timestamp, csv_file))
        
        # Выбираем последний файл для каждого метода
        latest_files = {}
        for method_name, files in method_files.items():
            # Сортируем по времени в убывающем порядке и берем первый (последний)
            files.sort(key=lambda x: x[0], reverse=True)
            latest_files[method_name] = files[0][1]
        
        print(f"📂 Найдено {len(latest_files)} методов в {benchmark_type}: {list(latest_files.keys())}")
        return latest_files
    
    def _parse_filename(self, filename: str) -> Tuple[Optional[str], Optional[datetime]]:
        """
        Парсим имя файла для извлечения имени метода и временной метки
        Формат: {имя_метода}_{временная_метка}.csv
        Пример: js_base_2025-09-05T16-00-58.csv
        """
        if not filename.endswith('.csv'):
            return None, None
        
        # Удаляем расширение .csv
        name_part = filename[:-4]
        
        # Ищем последнее подчеркивание за которым следует паттерн временной метки
        timestamp_pattern = r'(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})$'
        match = re.search(timestamp_pattern, name_part)
        
        if not match:
            return None, None
        
        timestamp_str = match.group(1)
        method_name = name_part[:match.start()].rstrip('_')
        
        try:
            # Парсим временную метку (заменяем - на : для временной части)
            timestamp_str_corrected = re.sub(r'T(\d{2})-(\d{2})-(\d{2})$', r'T\1:\2:\3', timestamp_str)
            timestamp = datetime.fromisoformat(timestamp_str_corrected)
            return method_name, timestamp
        except ValueError:
            return None, None
    
    def validate_methods(self, required_methods: List[str], available_files: Dict[str, Path]) -> None:
        """
        Проверяем что все требуемые методы имеют соответствующие CSV файлы
        Выбрасывает подробную ошибку если какой-то метод отсутствует
        """
        missing_methods = []
        for method in required_methods:
            if method not in available_files:
                missing_methods.append(method)
        
        if missing_methods:
            available_methods = list(available_files.keys())
            error_msg = f"❌ Отсутствуют данные для методов: {', '.join(missing_methods)}\n"
            error_msg += f"   Доступные методы: {', '.join(available_methods)}"
            raise ValueError(error_msg)
    
    def load_method_data(self, method_name: str, csv_path: Path, benchmark_type: str) -> Dict:
        """Загружаем данные для конкретного метода из его CSV файла"""
        try:
            # Читаем CSV с разделителем точка с запятой и европейским десятичным форматом
            df = pd.read_csv(csv_path, sep=';', decimal=',')
            
            # Очищаем названия колонок
            df.columns = df.columns.str.strip()
            
            # Конвертируем числовые колонки
            for col in df.columns:
                if col != 'matrix_size':
                    df[col] = pd.to_numeric(df[col], errors='coerce')

            if benchmark_type == 'isolated':
                method_name = method_name.replace('-', '_')
            
            # Определяем тип метрики на основе типа бенчмарка
            if benchmark_type == 'server':
                metric_key = 'rps'
                avg_col = f'avg_{method_name}'
                min_col = f'min_{method_name}' 
                max_col = f'max_{method_name}'
            else:  # isolated
                metric_key = 'performance'
                avg_col = f'avg_{method_name}'
                min_col = f'min_{method_name}'
                max_col = f'max_{method_name}'
            
            # Проверяем наличие обязательных колонок
            required_cols = ['matrix_size', avg_col]
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Отсутствуют колонки в {csv_path}: {missing_cols}")
            
            method_data = {
                'name': method_name,
                'matrix_sizes': df['matrix_size'].tolist(),
                metric_key: {
                    'mean': df[avg_col].tolist(),
                    'min': df[min_col].tolist() if min_col in df.columns else None,
                    'max': df[max_col].tolist() if max_col in df.columns else None
                }
            }
            
            print(f"📊 Загружен {method_name}: {len(df)} точек данных")
            return method_data
            
        except Exception as e:
            raise Exception(f"Ошибка загрузки данных метода из {csv_path}: {e}")
    
    def collect_benchmark_data(self, benchmark_type: str, methods: List[str]) -> Dict:
        """
        Основной метод для сбора данных для указанных методов
        Возвращает: {"имя_метода": словарь_данных_метода, ...}
        """
        print(f"🔍 Собираем данные {benchmark_type} бенчмарков для методов: {methods}")
        
        # Сканируем директорию для поиска доступных файлов
        available_files = self.scan_directory(benchmark_type)
        
        # Проверяем что все требуемые методы доступны
        self.validate_methods(methods, available_files)
        
        # Загружаем данные для каждого метода
        methods_data = {}
        for method_name in methods:
            csv_path = available_files[method_name]
            method_data = self.load_method_data(method_name, csv_path, benchmark_type)
            methods_data[method_name] = method_data
        
        return methods_data
    
    def list_available_methods(self, benchmark_type: str) -> List[str]:
        """Список всех доступных методов для данного типа бенчмарка"""
        try:
            available_files = self.scan_directory(benchmark_type)
            return sorted(list(available_files.keys()))
        except (FileNotFoundError, ValueError) as e:
            print(f"Ошибка получения списка методов: {e}")
            return []
    
    def get_method_style(self, method_name: str, benchmark_type: str) -> Dict:
        """Получаем цвет и стиль линии для метода"""
        default_style = {
            'color': '#FFFFFF', 
            'linestyle': '-'
        }

        method_name = method_name.replace('-', '_')
        
        return {
            'color': self.method_config.get('colors', {}).get(method_name, default_style['color']),
            'linestyle': self.method_config.get('line_styles', {}).get(method_name, default_style['linestyle']),
            'marker': self.method_config.get('markers', {}).get(method_name, None)
        }

if __name__ == "__main__":
    # Тестируем коллектор
    collector = BenchmarkDataCollector()
    
    import sys
    if len(sys.argv) >= 3:
        benchmark_type = sys.argv[1]  # isolated или server
        methods = sys.argv[2].split(',')
        
        try:
            data = collector.collect_benchmark_data(benchmark_type, methods)
            print(f"\n✅ Успешно собраны данные для {len(data)} методов")
            for method, method_data in data.items():
                sizes = len(method_data['matrix_sizes'])
                print(f"  • {method}: {sizes} размеров матриц")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
    else:
        print("Использование: python csv_parser.py <тип_бенчмарка> <метод1,метод2,...>")
        print("Пример: python csv_parser.py isolated js_base,cpp_simd") 