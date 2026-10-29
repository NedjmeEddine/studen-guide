import skillMd from "../../skills/SKILL.md?raw";
import skinMd from "../../skills/SKIN.md?raw";
import domainCs from "../../skills/references/domain-cs.md?raw";
import domainMath from "../../skills/references/domain-math.md?raw";
import domainElectronics from "../../skills/references/domain-electronics.md?raw";
import domainMedicine from "../../skills/references/domain-medicine.md?raw";
import domainDentistry from "../../skills/references/domain-dentistry.md?raw";
import domainPharmacy from "../../skills/references/domain-pharmacy.md?raw";

export type DomainId =
  "cs" | "math" | "electronics" | "medicine" | "dentistry" | "pharmacy" | "general";

export const DOMAINS: { id: DomainId; label: string; ref: string }[] = [
  { id: "cs", label: "Computer Science", ref: domainCs },
  { id: "math", label: "Mathematics", ref: domainMath },
  { id: "electronics", label: "Electronics", ref: domainElectronics },
  { id: "medicine", label: "Medicine", ref: domainMedicine },
  { id: "dentistry", label: "Dentistry", ref: domainDentistry },
  { id: "pharmacy", label: "Pharmacy", ref: domainPharmacy },
  { id: "general", label: "General University", ref: "" },
];

export const SKILL_MD = skillMd;
export const SKIN_MD = skinMd;

export function buildAuthoringPrompt(opts: {
  domainId: DomainId;
  courseTopic?: string;
  mode?: "both" | "exam" | "cram";
  includeQuiz?: boolean;
  includeCards?: boolean;
}): string {
  const domain = DOMAINS.find((d) => d.id === opts.domainId);
  const topic = opts.courseTopic?.trim() || "My University Course";
  const mode = opts.mode || "both";
  const extras = [
    opts.includeQuiz !== false ? "quiz" : null,
    opts.includeCards !== false ? "flashcards" : null,
  ].filter(Boolean);

  let p = `You are an expert university professor and pedagogical author. Generate an authentic, exam-grade StudySheet in raw Markdown dialect for the topic: "${topic}".\n\n`;
  p += `### REQUIRED FRONT MATTER SETTINGS:\n`;
  p += `mode: ${mode}\n`;
  p += `extras: [${extras.join(", ")}]\n\n`;

  p += `### STUDY SHEET DIALECT SPECIFICATION:\n`;
  p += `${SKILL_MD}\n\n`;

  if (domain && domain.ref) {
    p += `### DOMAIN-SPECIFIC PEDAGOGY GUIDELINES (${domain.label.toUpperCase()}):\n`;
    p += `${domain.ref}\n\n`;
  }

  p += `OUTPUT INSTRUCTION: Output ONLY the complete, raw Markdown study sheet starting with '---' and ending with the final block. Do not wrap in chat conversation.`;
  return p;
}

export function buildRicingPrompt(themeIdea?: string): string {
  const idea = themeIdea?.trim() || "a distinctive, production-grade custom aesthetic";
  let p = `You are a StudySheet UI Ricing & CSS design specialist. Design a custom dotfile theme (.css) for the StudySheet web app inspired by: "${idea}".\n\n`;
  p += `### THEME RICING SPECIFICATION (SKIN.md):\n`;
  p += `${SKIN_MD}\n\n`;
  p += `OUTPUT INSTRUCTION: Output ONLY the valid, production-grade CSS stylesheet scoped under [data-skin="custom"]. Include CSS variables, structural overrides, and deep styling.`;
  return p;
}
