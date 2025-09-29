#!/usr/bin/env python3
"""
Генератор графиков для визуализации бенчмарков matrix
Создает линейные графики с планками ошибок в темной теме
"""

import matplotlib.pyplot as plt
import matplotlib.style as mplstyle
from matplotlib.lines import Line2D
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import warnings

from csv_parser import BenchmarkDataCollector

# Подавляем предупреждения matplotlib
warnings.filterwarnings("ignore", category=UserWarning)

class BenchmarkPlotGenerator:
    def __init__(self, config_dir: Path = None):
        if config_dir is None:
            config_dir = Path(__file__).parent / "config"
        
        self.collector = BenchmarkDataCollector(config_dir)
        self.style_config = self.collector.style_config
        self.setup_matplotlib_style()
    
    def setup_matplotlib_style(self):
        """Настройка matplotlib для темной темы"""
        # Устанавливаем темный фон
        plt.style.use('dark_background')
        
        # Конфигурируем параметры matplotlib
        plt.rcParams.update({
            'figure.facecolor': self.style_config.get('theme', {}).get('background_color', '#2E2E2E'),
            'axes.facecolor': self.style_config.get('theme', {}).get('background_color', '#2E2E2E'),
            'axes.edgecolor': self.style_config.get('theme', {}).get('axis_color', '#CCCCCC'),
            'axes.labelcolor': self.style_config.get('theme', {}).get('text_color', '#FFFFFF'),
            'text.color': self.style_config.get('theme', {}).get('text_color', '#FFFFFF'),
            'xtick.color': self.style_config.get('theme', {}).get('text_color', '#FFFFFF'),
            'ytick.color': self.style_config.get('theme', {}).get('text_color', '#FFFFFF'),
            'grid.color': self.style_config.get('theme', {}).get('grid_color', '#444444'),
            'grid.alpha': self.style_config.get('axes', {}).get('grid_alpha', 0.3),
            'font.size': self.style_config.get('axes', {}).get('tick_font_size', 12),
        })
    
    def create_plot(self, methods_data: Dict, benchmark_type: str, 
                   metric_type: str = 'rps', title: str = None,
                   output_path: Path = None) -> Path:
        """Создает линейный график с планками ошибок"""
        
        # Определяем размер фигуры
        figsize = self.style_config.get('figure', {}).get('size', [12, 8])
        fig, ax = plt.subplots(figsize=figsize)

        legend_handles = []
        
        # Конфигурируем график в зависимости от типа метрики
        if metric_type == 'rps' and benchmark_type == 'server':
            self._plot_rps_data(ax, methods_data, benchmark_type, legend_handles)
            ylabel = 'Запросов в секунду (RPS)'
            if self.style_config.get('scales', {}).get('rps_log_scale', True):
                ax.set_yscale('log')
        elif benchmark_type == 'isolated':
            self._plot_performance_data(ax, methods_data, benchmark_type, legend_handles)
            ylabel = 'Время выполнения (мс)'
            if self.style_config.get('scales', {}).get('performance_log_scale', True):
                ax.set_yscale('log')
        else:
            raise ValueError(f"Неподдерживаемый тип метрики: {metric_type} для типа бенчмарка: {benchmark_type}")
        
        # Конфигурируем оси
        ax.set_xlabel('Размер матрицы', 
                     fontsize=self.style_config.get('axes', {}).get('label_font_size', 14))
        ax.set_ylabel(ylabel, 
                     fontsize=self.style_config.get('axes', {}).get('label_font_size', 14))
        
        if title:
            ax.set_title(title, 
                        fontsize=self.style_config.get('axes', {}).get('title_font_size', 16))
        
        # Конфигурируем сетку
        if self.style_config.get('axes', {}).get('grid', True):
            ax.grid(True, alpha=self.style_config.get('axes', {}).get('grid_alpha', 0.3))
        
        # Конфигурируем легенду
        legend_config = self.style_config.get('legend', {})
        ax.legend(
            handles=legend_handles,
            fontsize=legend_config.get('font_size', 12),
            loc=legend_config.get('location', 'best'),
            frameon=legend_config.get('frameon', True),
            fancybox=legend_config.get('fancybox', True),
            shadow=legend_config.get('shadow', True),
            framealpha=legend_config.get('framealpha', 0.9),
            handlelength=legend_config.get('handlelength', 3.5),
            handletextpad=legend_config.get('handletextpad', 0.6)
        )
        
        # Устанавливаем плотную компоновку
        if self.style_config.get('figure', {}).get('tight_layout', True):
            plt.tight_layout()
        
        # Сохраняем график
        if output_path is None:
            output_path = Path(f"{benchmark_type}_{metric_type}_plot.png")
        
        self._save_plot(fig, output_path)
        plt.close(fig)
        
        return output_path
    
    def _plot_rps_data(self, ax, methods_data: Dict, benchmark_type: str, legend_handles: list):
        """Отображаем данные RPS с планками ошибок"""
        for method_name, data in methods_data.items():
            if 'rps' not in data or not data['rps'].get('mean'):
                continue
            
            x = data['matrix_sizes']
            y = data['rps']['mean']
            
            # Вычисляем планки ошибок
            yerr_lower, yerr_upper = self._calculate_error_bars(
                y, data['rps'].get('min'), data['rps'].get('max')
            )
            
            # Получаем стиль метода
            style = self.collector.get_method_style(method_name, benchmark_type)
            
            # Отображаем линию с планками ошибок
            line_config = self.style_config.get('lines', {})
            error_config = self.style_config.get('error_bars', {})
            
            ax.errorbar(
                x, y, 
                yerr=[yerr_lower, yerr_upper],
                label='_nolegend_',
                color=style['color'],
                linestyle=style['linestyle'],
                marker=style.get('marker', None),
                linewidth=line_config.get('width', 2.5),
                markersize=line_config.get('marker_size', 8),
                markeredgewidth=line_config.get('marker_edge_width', 1.5),
                alpha=line_config.get('alpha', 0.8),
                capsize=error_config.get('cap_size', 4),
                capthick=error_config.get('width', 2.0),
                elinewidth=error_config.get('width', 2.0),
                errorevery=1
            )

            proxy = Line2D(
                [], [], 
                color=style['color'],
                linestyle=style['linestyle'],
                marker=style.get('marker', None),
                linewidth=line_config.get('width', 2.5),
                markersize=line_config.get('marker_size', 0),
                alpha=line_config.get('alpha', 0.8),
                label=self._format_method_name(method_name)
            )
            legend_handles.append(proxy)
    
    def _plot_performance_data(self, ax, methods_data: Dict, benchmark_type: str, legend_handles: list):
        """Отображаем данные производительности изолированных бенчмарков с планками ошибок"""
        for method_name, data in methods_data.items():
            if 'performance' not in data or not data['performance'].get('mean'):
                continue
            
            x = data['matrix_sizes']
            y = data['performance']['mean']
            
            # Вычисляем планки ошибок
            yerr_lower, yerr_upper = self._calculate_error_bars(
                y, data['performance'].get('min'), data['performance'].get('max')
            )
            
            # Получаем стиль метода
            style = self.collector.get_method_style(method_name, benchmark_type)
            
            # Отображаем линию с планками ошибок
            line_config = self.style_config.get('lines', {})
            error_config = self.style_config.get('error_bars', {})
            
            ax.errorbar(
                x, y, 
                yerr=[yerr_lower, yerr_upper],
                label='_nolegend_',
                color=style['color'],
                linestyle=style['linestyle'],
                marker=style.get('marker', None),
                linewidth=line_config.get('width', 2.5),
                markersize=line_config.get('marker_size', 8),
                markeredgewidth=line_config.get('marker_edge_width', 1.5),
                alpha=line_config.get('alpha', 0.8),
                capsize=error_config.get('cap_size', 4),
                capthick=error_config.get('width', 2.0),
                elinewidth=error_config.get('width', 2.0),
                errorevery=1
            )

            proxy = Line2D(
                [], [], 
                color=style['color'],
                linestyle=style['linestyle'],
                marker=style.get('marker', None),
                linewidth=line_config.get('width', 2.5),
                markersize=line_config.get('marker_size', 0),
                alpha=line_config.get('alpha', 0.8),
                label=self._format_method_name(method_name)
            )
            legend_handles.append(proxy)
    
    def _calculate_error_bars(self, mean_values: List[float], 
                            min_values: Optional[List[float]], 
                            max_values: Optional[List[float]]) -> Tuple[List[float], List[float]]:
        """Вычисляем значения планок ошибок из min/max данных"""
        if min_values is None or max_values is None:
            # Нет планок ошибок
            return [0] * len(mean_values), [0] * len(mean_values)
        
        yerr_lower = []
        yerr_upper = []
        
        for i, mean in enumerate(mean_values):
            if i < len(min_values) and i < len(max_values):
                # Планки ошибок представляют расстояние от среднего до min/max
                yerr_lower.append(max(0, mean - min_values[i]))
                yerr_upper.append(max(0, max_values[i] - mean))
            else:
                yerr_lower.append(0)
                yerr_upper.append(0)
        
        return yerr_lower, yerr_upper
    
    def _format_method_name(self, method_name: str) -> str:
        """Форматируем имя метода для отображения в легенде"""
        # Конвертируем подчеркивания в пробелы и делаем заглавными
        formatted = method_name.replace('_', ' ').replace('-', ' ').title()
        
        # Заменяем общие сокращения
        replacements = {
            'Js': 'JavaScript',
            'Cpp': 'C++',
            'Wasm': 'WebAssembly',
            'Simd': 'SIMD',
            'Rps': 'RPS',
            'Worker': 'Worker Threads',
            'Async': 'AsyncWorker'
        }
        
        for old, new in replacements.items():
            formatted = formatted.replace(old, new)
        
        return formatted
    
    def _save_plot(self, fig, output_path: Path):
        """Сохраняем график в настроенных форматах"""
        export_config = self.style_config.get('export', {})
        formats = export_config.get('formats', ['png'])
        
        for fmt in formats:
            if fmt == 'png':
                dpi = export_config.get('png_dpi', 300)
                save_path = output_path.with_suffix('.png')
                fig.savefig(save_path, dpi=dpi, bbox_inches='tight', 
                          facecolor=fig.get_facecolor())
                print(f"📊 График сохранен: {save_path}")
            
            elif fmt == 'svg':
                transparent = export_config.get('svg_transparent', True)
                save_path = output_path.with_suffix('.svg')
                fig.savefig(save_path, format='svg', bbox_inches='tight',
                          transparent=transparent)
                print(f"📊 График сохранен: {save_path}")

if __name__ == "__main__":
    # Тестируем генератор графиков с новым форматом
    generator = BenchmarkPlotGenerator()
    
    import sys
    if len(sys.argv) >= 3:
        benchmark_type = sys.argv[1]  # isolated или server
        methods = sys.argv[2].split(',')
        
        try:
            methods_data = generator.collector.collect_benchmark_data(benchmark_type, methods)
            
            # Создаем путь для вывода
            output_path = Path(f"тест_{benchmark_type}_{'_'.join(methods)}")
            
            # Определяем тип метрики
            metric_type = 'rps' if benchmark_type == 'server' else 'performance'
            
            plot_path = generator.create_plot(
                methods_data, benchmark_type, metric_type,
                title=f"Тестовый график {benchmark_type.title()}",
                output_path=output_path
            )
            
            print(f"\n✅ Тестовый график сгенерирован: {plot_path}")
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
    else:
        print("Использование: python plot_generator.py <тип_бенчмарка> <метод1,метод2,...>")
        print("Пример: python plot_generator.py isolated js_base,cpp_simd") 