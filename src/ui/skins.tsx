import { useStored } from "@/lib/store";

export const SKINS = [
  { id: "paper", label: "Paper (Classic)" },
  { id: "terminal", label: "Terminal (CS)" },
  { id: "chalkboard", label: "Chalkboard (Math)" },
  { id: "oscilloscope", label: "Oscilloscope (EE)" },
  { id: "clinical", label: "Clinical (Med)" },
  { id: "night", label: "Night Lab" },
  { id: "editorial", label: "Editorial" },
  { id: "sprint", label: "Sprint Bold" },
  { id: "custom", label: "🎨 Custom Rice (CSS)" },
] as const;
export type SkinId = (typeof SKINS)[number]["id"];

export function useSkin() {
  return useStored<SkinId>("ss:skin", "paper");
}

export function SkinPicker({ value, onChange }: { value: SkinId; onChange: (s: SkinId) => void }) {
  return (
    <select
      className="ss-skin"
      value={value}
      onChange={(e) => onChange(e.target.value as SkinId)}
      aria-label="Skin"
    >
      {SKINS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
