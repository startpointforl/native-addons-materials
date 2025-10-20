# Memory Examples

Примеры работы с памятью в нативных модулях Node.js.

## Примеры

### Process Array (demo/array.js)

**Что делает:** Обработка обычного JS массива с копированием данных

**Код:**

```cpp
// Копируем данные из JS Array в C++ массив
for (uint32_t i = 0; i < length; i++) {
    data[i] = input[i].As<Napi::Number>().Int32Value();
}
// Обработка...
// Копируем обратно в JS Array
```

**Метрики:** Двойное копирование данных (JS→C++→JS), высокое использование heap

**Пример результатов:**

```
Before: {
  rss: '60.94 MB',
  heapTotal: '24.38 MB',
  heapUsed: '18.91 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After 50 calls: {
  rss: '131.30 MB',
  heapTotal: '29.27 MB',
  heapUsed: '26.51 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After GC: {
  rss: '116.44 MB',
  heapTotal: '12.73 MB',
  heapUsed: '11.11 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
```

---

### Process Buffer (demo/buffer.js)

**Что делает:** Обработка Buffer in-place без копирования (zero-copy)

**Код:**

```cpp
// Получаем прямой доступ к памяти Buffer
int32_t* data = buffer.Data();
// Обработка напрямую в памяти
for (size_t i = 0; i < length; i++) {
    data[i] = data[i] * 2;
}
```

**Метрики:** Нет копирования и лишнего использования памяти

**Пример результатов:**

```
Before: {
  rss: '52.66 MB',
  heapTotal: '7.59 MB',
  heapUsed: '3.86 MB',
  external: '5.24 MB',
  arrayBuffers: '3.82 MB'
}
After 50 calls: {
  rss: '52.77 MB',
  heapTotal: '7.59 MB',
  heapUsed: '3.88 MB',
  external: '5.24 MB',
  arrayBuffers: '3.82 MB'
}
After GC: {
  rss: '53.19 MB',
  heapTotal: '6.34 MB',
  heapUsed: '3.87 MB',
  external: '5.24 MB',
  arrayBuffers: '3.82 MB'
}
```

---

### Create External Buffer (demo/ext-buffer.js)

**Что делает:** Создает Buffer с памятью, управляемой C++

**Код:**

```cpp
int32_t* data = new int32_t[size];
// Заполняем данными...
return Napi::Buffer<int32_t>::New(
    env, data, size,
    FinalizeExternalBuffer  // Вызовется при GC
);
```

**Метрики:** `external` увеличивается, память освободится автоматически

**Пример результатов:**

```
=== External Buffer (память управляется C++) ===
Before: {
  rss: '41.67 MB',
  heapTotal: '5.84 MB',
  heapUsed: '3.85 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After 50 calls: {
  rss: '234.27 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.48 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}
After first GC: {
  rss: '234.41 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.50 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}
After clear buffers: {
  rss: '234.42 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.88 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}
After second GC: {
  rss: '234.47 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.49 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}
After third GC: {
  rss: '234.50 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.50 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
🗑️  Finalizer called: buffer memory freed (x50)
```

---

### GC Phases Comparison (demo/gc.js)

**Что делает:** Демонстрирует разницу в работе GC для V8 heap и external memory

**Особенность:** Показывает почему для external memory нужно **два GC цикла**:

- **GC #1** - помечает объекты как мёртвые, планирует вызов finalizers
- **GC #2** - реально вызывает finalizers и освобождает C++ память

**Код:**

```javascript
// V8 Heap - всё чистится за один GC
let arrays = [
  /* много массивов */
];
arrays = null;
gc(); // ← Всё очищено сразу

// External Memory - нужно два GC
let buffers = [
  /* много external буферов */
];
buffers = null;
gc(); // ← Только помечено
gc(); // ← Теперь finalizers вызваны и память освобождена
```

**Почему так:**

- V8 управляет своей памятью напрямую → синхронная очистка
- External память требует коллбэков в C++ → асинхронная очистка
- Finalizers выполняются между GC циклами

**Метрики:**

- V8 heap: первый GC очищает ~38 MB, второй ~0.38 MB
- External: первый GC без изменений, второй освобождает ~190 MB

**Пример результатов:**

```
Test 1: V8 Heap (обычные JS объекты)

Initial: {
  rss: '41.78 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.86 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After creating arrays: {
  rss: '83.09 MB',
  heapTotal: '75.38 MB',
  heapUsed: '41.78 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After clearing reference: {
  rss: '83.14 MB',
  heapTotal: '75.38 MB',
  heapUsed: '42.27 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}

⚡ Calling GC #1...
After GC #1: {
  rss: '45.33 MB',
  heapTotal: '36.59 MB',
  heapUsed: '4.11 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}

⚡ Calling GC #2...
After GC #2: {
  rss: '45.61 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.50 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}

Difference between GC #1 and GC #2: -0.61 MB

============================================================

Test 2: External Memory (C++ Buffer)

Initial: {
  rss: '45.67 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.89 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}
After creating buffers: {
  rss: '237.47 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.58 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}
After clearing reference: {
  rss: '237.48 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.59 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}

⚡ Calling GC #1...
After GC #1: {
  rss: '237.64 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.58 MB',
  external: '192.16 MB',
  arrayBuffers: '0.01 MB'
}

⚡ Calling GC #2...
After GC #2: {
  rss: '237.70 MB',
  heapTotal: '36.34 MB',
  heapUsed: '3.61 MB',
  external: '1.42 MB',
  arrayBuffers: '0.01 MB'
}

Difference between GC #1 and GC #2: -190.73 MB
🗑️  Finalizer called: buffer memory freed (x50)

```

---

### Simple Allocation (demo/simple.js)

**Что делает:** Правильное выделение памяти через `new[]` и освобождение через `delete[]`

**Код:**

```cpp
int* data = new int[size];
// ... работа с данными
delete[] data;  // ✅ Правильно освобождаем
```

**Метрики:** Память выделяется временно и сразу освобождается

**Пример результатов:**

```
Before: {
  rss: '41.80 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.85 MB',
  external: '1.42 MB'
}
After 50 calls: {
  rss: '86.89 MB',
  heapTotal: '13.73 MB',
  heapUsed: '11.25 MB',
  external: '1.42 MB'
}
After GC: {
  rss: '81.33 MB',
  heapTotal: '5.59 MB',
  heapUsed: '3.48 MB',
  external: '1.42 MB'
}
```

---

### Allocation with Memory Leak (demo/leak.js)

**Что делает:** Демонстрация утечки памяти

**Код:**

```cpp
int* data = new int[size];
// ... работа с данными
// ❌ НЕТ delete[] data - утечка памяти!
```

**Метрики:** RSS (Resident Set Size) растет при каждом вызове и не освобождается

**Пример результатов:**

```
Before: {
  rss: '42.00 MB',
  heapTotal: '6.09 MB',
  heapUsed: '3.85 MB',
  external: '1.42 MB'
}
After 50 calls: {
  rss: '271.00 MB',
  heapTotal: '13.73 MB',
  heapUsed: '11.25 MB',
  external: '1.42 MB'
}
After GC: {
  rss: '265.47 MB',
  heapTotal: '5.59 MB',
  heapUsed: '3.48 MB',
  external: '1.42 MB'
}
```

---

## Установка и запуск

```bash
npm install

# Примеры
npm run demo:simple  # Простое выделение памяти
npm run demo:leak    # Пример утечки памяти
npm run demo:array         # JS Array с копированием
npm run demo:buffer        # Buffer zero-copy
npm run demo:ext-buffer    # External Buffer
npm run demo:gc            # GC и профилирование памяти
```

## Метрики памяти

- **rss** - реальная память процесса
- **heapTotal** - общий размер V8 heap
- **heapUsed** - использованная часть V8 heap (актуальная для JS объектов)
- **external** - память вне V8 heap (актуальна для C++ объектов)
- **arrayBuffers** - память в ArrayBuffer/Buffer

## Сравнение производительности

| Способ          | Копирование | Скорость | Использование памяти | GC циклов для очистки |
| --------------- | ----------- | -------- | -------------------- | --------------------- |
| Array           | Да (×2)     | Медленно | Высокое              | 1                     |
| Buffer          | Нет         | Быстро   | Низкое               | 1                     |
| External Buffer | Нет         | Быстро   | Контролируется C++   | 2+                    |

## Важные выводы

1. **Buffer** - оптимальный выбор для больших данных (zero-copy)
2. **Array** - удобно для маленьких данных, но неэффективно для больших
3. **External Buffer** - когда нужен полный контроль над памятью в C++
4. **GC и External Memory** - делайте 2+ вызова GC для полной очистки external ресурсов

## Требования

- **Node.js** 22+ (см. `.nvmrc` в каждой папке)
- **C++ компилятор** (Xcode/GCC/MSVC)
- **node-gyp** для сборки модулей
