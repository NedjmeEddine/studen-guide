import { renderInline } from "@/dialect/markdown";
import { useStored } from "@/lib/store";

function Item({ text, storeKey }: { text: string; storeKey: string }) {
  const [on, setOn] = useStored<boolean>(storeKey, false);
  return (
    <li data-done={on}>
      <label>
        <input type="checkbox" checked={on} onChange={() => setOn(!on)} />
        <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
      </label>
    </li>
  );
}

/** Keys: `<prefix>:<idx>` → true when ticked. */
export function ChecklistItems({ items, prefix }: { items: string[]; prefix: string }) {
  return (
    <ul className="ss-checklist">
      {items.map((it, i) => (
        <Item key={i} text={it} storeKey={`${prefix}:${i}`} />
      ))}
    </ul>
  );
}
