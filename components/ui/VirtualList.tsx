"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

// ============================================================================
// VirtualList Component
// ============================================================================

interface VirtualListProps<T> {
    /** Array of items to render */
    items: T[];
    /** Height of each item in pixels (or function for variable heights) */
    estimateSize: number | ((index: number) => number);
    /** Render function for each item */
    renderItem: (item: T, index: number) => ReactNode;
    /** Optional container height (default: 400px) */
    height?: number | string;
    /** Optional gap between items */
    gap?: number;
    /** Optional class for the container */
    className?: string;
    /** Optional overscan count (items to render outside viewport) */
    overscan?: number;
    /** Key extractor for items */
    getItemKey?: (item: T, index: number) => string | number;
}

/**
 * Virtualized list component for efficiently rendering long lists.
 * Only renders visible items plus a small overscan buffer.
 * 
 * @example
 * <VirtualList
 *   items={meals}
 *   estimateSize={80}
 *   height={600}
 *   renderItem={(meal, index) => (
 *     <MealCard key={meal.id} meal={meal} />
 *   )}
 * />
 * 
 * @example with variable heights
 * <VirtualList
 *   items={messages}
 *   estimateSize={(index) => messages[index].isLong ? 200 : 80}
 *   renderItem={(msg) => <Message {...msg} />}
 * />
 */
export function VirtualList<T>({
    items,
    estimateSize,
    renderItem,
    height = 400,
    gap = 0,
    className = "",
    overscan = 5,
    getItemKey,
}: VirtualListProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: typeof estimateSize === "function"
            ? estimateSize
            : () => estimateSize,
        overscan,
        gap,
        getItemKey: getItemKey
            ? (index) => getItemKey(items[index], index)
            : undefined,
    });

    const virtualItems = virtualizer.getVirtualItems();

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualItems.map((virtualItem) => {
                    const item = items[virtualItem.index];
                    return (
                        <div
                            key={virtualItem.key}
                            data-index={virtualItem.index}
                            ref={virtualizer.measureElement}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualItem.start}px)`,
                            }}
                        >
                            {renderItem(item, virtualItem.index)}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// VirtualGrid Component
// ============================================================================

interface VirtualGridProps<T> {
    /** Array of items to render */
    items: T[];
    /** Number of columns */
    columns: number;
    /** Height of each row in pixels */
    rowHeight: number;
    /** Render function for each item */
    renderItem: (item: T, index: number) => ReactNode;
    /** Optional container height */
    height?: number | string;
    /** Optional gap between items */
    gap?: number;
    /** Optional class for the container */
    className?: string;
}

/**
 * Virtualized grid component for efficiently rendering large grids.
 * 
 * @example
 * <VirtualGrid
 *   items={recipes}
 *   columns={3}
 *   rowHeight={200}
 *   height={600}
 *   renderItem={(recipe) => <RecipeCard {...recipe} />}
 * />
 */
export function VirtualGrid<T>({
    items,
    columns,
    rowHeight,
    renderItem,
    height = 400,
    gap = 16,
    className = "",
}: VirtualGridProps<T>) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowCount = Math.ceil(items.length / columns);

    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 2,
        gap,
    });

    const virtualRows = virtualizer.getVirtualItems();

    if (items.length === 0) {
        return null;
    }

    return (
        <div
            ref={parentRef}
            className={`overflow-auto ${className}`}
            style={{ height: typeof height === "number" ? `${height}px` : height }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualRows.map((virtualRow) => {
                    const startIndex = virtualRow.index * columns;
                    const rowItems = items.slice(startIndex, startIndex + columns);

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: `${rowHeight}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                                display: "grid",
                                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                                gap: `${gap}px`,
                            }}
                        >
                            {rowItems.map((item, i) => (
                                <div key={startIndex + i}>
                                    {renderItem(item, startIndex + i)}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// useVirtualScroll Hook (for custom implementations)
// ============================================================================

interface UseVirtualScrollOptions {
    count: number;
    estimateSize: number | ((index: number) => number);
    overscan?: number;
    gap?: number;
}

/**
 * Hook for creating custom virtualized scrolling implementations.
 * 
 * @example
 * const { parentRef, virtualItems, totalSize } = useVirtualScroll({
 *   count: items.length,
 *   estimateSize: 80,
 * });
 */
export function useVirtualScroll(options: UseVirtualScrollOptions) {
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: options.count,
        getScrollElement: () => parentRef.current,
        estimateSize: typeof options.estimateSize === "function"
            ? options.estimateSize
            : () => options.estimateSize as number,
        overscan: options.overscan ?? 5,
        gap: options.gap ?? 0,
    });

    return {
        parentRef,
        virtualizer,
        virtualItems: virtualizer.getVirtualItems(),
        totalSize: virtualizer.getTotalSize(),
        scrollToIndex: virtualizer.scrollToIndex,
        measureElement: virtualizer.measureElement,
    };
}
