import { useState } from 'react';

/**
 * useDragAndDropList - Custom hook for drag-and-drop reordering of a list.
 * @returns {object} Drag-and-drop state and handlers.
 *
 * Usage:
 *   const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDrop, handleDragEnd } = useDragAndDropList(onReorder);
 *   - onReorder: (fromIdx, toIdx) => void, called when a drop occurs.
 */
export function useDragAndDropList(onReorder: (fromIdx: number, toIdx: number) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (index: number) => setDragOverIndex(index);
  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    onReorder(draggedIndex, index);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
} 