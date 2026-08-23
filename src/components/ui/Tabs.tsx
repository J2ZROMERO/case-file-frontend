type TabItem = {
  id: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
};

export function Tabs({ items, activeId, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`min-h-10 flex-1 rounded-md px-3 text-sm font-semibold transition ${
            activeId === item.id
              ? "bg-white text-ink shadow-sm"
              : "text-muted hover:bg-white/70 hover:text-ink"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

