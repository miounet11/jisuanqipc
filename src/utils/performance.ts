/**
 * Performance Utilities
 *
 * 性能优化工具函数，包括记忆化、节流、防抖等
 */

// 记忆化缓存接口
interface MemoCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}

// LRU缓存实现
class LRUCache<T> implements MemoCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移动到最前面（LRU策略）
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最老的项
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 记忆化装饰器
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  options: {
    maxCacheSize?: number;
    keyGenerator?: (...args: Args) => string;
    ttl?: number; // 缓存过期时间（毫秒）
  } = {}
): (...args: Args) => Return {
  const {
    maxCacheSize = 1000,
    keyGenerator = (...args) => JSON.stringify(args),
    ttl
  } = options;

  const cache = new LRUCache<{ value: Return; timestamp?: number }>(maxCacheSize);

  return (...args: Args): Return => {
    const key = keyGenerator(...args);
    const cached = cache.get(key);

    if (cached) {
      // 检查是否过期
      if (ttl && cached.timestamp && Date.now() - cached.timestamp > ttl) {
        cache.set(key, { value: cached.value }); // 移除过期缓存
      } else {
        return cached.value;
      }
    }

    const result = fn(...args);
    const cacheEntry = ttl ? { value: result, timestamp: Date.now() } : { value: result };
    cache.set(key, cacheEntry);

    return result;
  };
}

// 防抖函数
export function debounce<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

// 节流函数
export function throttle<Args extends any[]>(
  fn: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  let lastCall = 0;

  return (...args: Args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

// 性能监控
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  // 测量函数执行时间
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    return result;
  }

  // 异步函数性能测量
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const duration = end - start;

    this.recordMetric(name, duration);
    return result;
  }

  // 记录性能指标
  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const measurements = this.metrics.get(name)!;
    measurements.push(duration);

    // 只保留最近100次测量
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  // 获取性能统计
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const measurements = this.metrics.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  // 清除指标
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // 获取所有指标名称
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 批处理工具
export class BatchProcessor<T> {
  private batch: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processFn: (items: T[]) => void;
  private batchSize: number;
  private delay: number;

  constructor(
    processFn: (items: T[]) => void,
    options: {
      batchSize?: number;
      delay?: number;
    } = {}
  ) {
    this.processFn = processFn;
    this.batchSize = options.batchSize || 10;
    this.delay = options.delay || 100;
  }

  // 添加项目到批处理队列
  add(item: T): void {
    this.batch.push(item);

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  // 立即处理所有待处理项目
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.batch.length > 0) {
      const items = [...this.batch];
      this.batch = [];
      this.processFn(items);
    }
  }

  // 调度批处理
  private scheduleFlush(): void {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }
}

// 对象池
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    options: {
      resetFn?: (obj: T) => void;
      maxSize?: number;
      preAllocate?: number;
    } = {}
  ) {
    this.createFn = createFn;
    this.resetFn = options.resetFn;
    this.maxSize = options.maxSize || 100;

    // 预分配对象
    if (options.preAllocate) {
      for (let i = 0; i < options.preAllocate; i++) {
        this.pool.push(this.createFn());
      }
    }
  }

  // 获取对象
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  // 释放对象
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.pool.push(obj);
    }
  }

  // 清空池
  clear(): void {
    this.pool = [];
  }

  // 获取池大小
  size(): number {
    return this.pool.length;
  }
}

// 惰性计算
export class LazyValue<T> {
  private computed = false;
  private value: T | undefined;
  private computeFn: () => T;

  constructor(computeFn: () => T) {
    this.computeFn = computeFn;
  }

  // 获取值（惰性计算）
  get(): T {
    if (!this.computed) {
      this.value = this.computeFn();
      this.computed = true;
    }
    return this.value!;
  }

  // 重置计算状态
  reset(): void {
    this.computed = false;
    this.value = undefined;
  }

  // 检查是否已计算
  isComputed(): boolean {
    return this.computed;
  }
}

// 计算优化工具
export class CalculationOptimizer {
  private static readonly COMPUTATION_CACHE = new LRUCache<number>(5000);
  private static readonly BATCH_PROCESSOR = new BatchProcessor<() => void>(
    (computations) => computations.forEach(fn => fn()),
    { batchSize: 50, delay: 16 } // 60fps
  );

  // 缓存数学计算结果
  static memoizedMath = {
    sin: memoize(Math.sin),
    cos: memoize(Math.cos),
    tan: memoize(Math.tan),
    asin: memoize(Math.asin),
    acos: memoize(Math.acos),
    atan: memoize(Math.atan),
    sinh: memoize(Math.sinh),
    cosh: memoize(Math.cosh),
    tanh: memoize(Math.tanh),
    log: memoize(Math.log),
    log10: memoize(Math.log10),
    exp: memoize(Math.exp),
    sqrt: memoize(Math.sqrt),
    pow: memoize(Math.pow),
    abs: memoize(Math.abs),
    ceil: memoize(Math.ceil),
    floor: memoize(Math.floor),
    round: memoize(Math.round),
  };

  // 优化的factorial计算（带缓存）
  static factorial = memoize((n: number): number => {
    if (n < 0) throw new Error('Factorial undefined for negative numbers');
    if (n === 0 || n === 1) return 1;

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  });

  // 优化的组合数计算
  static combination = memoize((n: number, k: number): number => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // 使用帕斯卡三角形的性质优化
    k = Math.min(k, n - k);

    let result = 1;
    for (let i = 0; i < k; i++) {
      result = result * (n - i) / (i + 1);
    }

    return Math.round(result);
  });

  // 批量计算
  static batchCalculate(calculations: Array<() => void>): void {
    calculations.forEach(calc => this.BATCH_PROCESSOR.add(calc));
  }

  // 清除所有缓存
  static clearCaches(): void {
    this.COMPUTATION_CACHE.clear();
    // 清除所有记忆化函数的缓存
    Object.values(this.memoizedMath).forEach(memoizedFn => {
      if (typeof (memoizedFn as any).clear === 'function') {
        (memoizedFn as any).clear();
      }
    });
  }

  // 预热缓存
  static warmupCaches(): void {
    // 预计算常用的三角函数值
    const commonAngles = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2, Math.PI];
    commonAngles.forEach(angle => {
      this.memoizedMath.sin(angle);
      this.memoizedMath.cos(angle);
      if (angle !== Math.PI/2) {
        this.memoizedMath.tan(angle);
      }
    });

    // 预计算常用的对数值
    const commonLogValues = [1, Math.E, 10, 100, 1000];
    commonLogValues.forEach(value => {
      this.memoizedMath.log(value);
      this.memoizedMath.log10(value);
    });

    // 预计算常用的平方根
    for (let i = 1; i <= 100; i++) {
      this.memoizedMath.sqrt(i);
    }

    // 预计算常用的阶乘
    for (let i = 0; i <= 20; i++) {
      this.factorial(i);
    }
  }
}

// React Native 特定优化
export class ReactNativeOptimizer {
  // 优化的状态更新（批量更新）
  static batchStateUpdates<T>(
    updates: Array<() => void>,
    callback?: () => void
  ): void {
    // 使用 React 的批量更新机制
    if (updates.length === 0) {
      callback?.();
      return;
    }

    // 批量执行状态更新
    updates.forEach(update => update());

    // 在下一个事件循环中执行回调
    setTimeout(() => {
      callback?.();
    }, 0);
  }

  // 优化的重新渲染控制
  static shouldComponentUpdate(
    prevProps: any,
    nextProps: any,
    compareKeys?: string[]
  ): boolean {
    const keysToCompare = compareKeys || Object.keys(nextProps);

    return keysToCompare.some(key => {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];

      if (typeof prevValue !== typeof nextValue) {
        return true;
      }

      if (typeof prevValue === 'object' && prevValue !== null) {
        return JSON.stringify(prevValue) !== JSON.stringify(nextValue);
      }

      return prevValue !== nextValue;
    });
  }

  // 内存使用监控
  static monitorMemoryUsage(): {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  } {
    if (typeof (global as any).performance?.memory !== 'undefined') {
      const memory = (global as any).performance.memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return {};
  }
}

// 导出主要工具
export {
  LRUCache,
  PerformanceMonitor,
  BatchProcessor,
  ObjectPool,
  LazyValue,
  CalculationOptimizer,
  ReactNativeOptimizer,
};