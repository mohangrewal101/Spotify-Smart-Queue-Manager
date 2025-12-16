import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isPending?: boolean;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const wrappedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-dnd]")) {
        e.stopPropagation();
        return;
      }
      if (listeners!.onPointerDown) listeners!.onPointerDown(e);
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...wrappedListeners}
    >
      {children}
    </div>
  );
}
