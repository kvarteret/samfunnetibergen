// One-shot codemod for ExecPlan 002 M1: rewrite imports from the deleted
// grab-bag "@/components/ui/form-fields" to per-component modules.
// Idempotent: once no file imports from form-fields, it is a no-op.
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const NAME_TO_MODULE = {
  SectionHeader: "@/components/ui/section-header",
  FieldGroup: "@/components/ui/field-group",
  FieldHint: "@/components/ui/field-group",
  SelectField: "@/components/ui/select-field",
  SelectOption: "@/components/ui/select-field",
  PriceInput: "@/components/ui/price-input",
  CheckboxSquare: "@/components/ui/checkbox-field",
  CheckboxField: "@/components/ui/checkbox-field",
  FormSection: "@/components/ui/form-section",
}

const IMPORT_RE =
  /import\s+(type\s+)?\{([^}]+)\}\s+from\s+"@\/components\/ui\/form-fields"\n?/g

const files = execSync(
  `grep -rl 'from "@/components/ui/form-fields"' src --include='*.tsx' --include='*.ts'`,
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean)

for (const file of files) {
  const source = readFileSync(file, "utf8")
  const rewritten = source.replace(IMPORT_RE, (match, typeKw, names) => {
    const byModule = new Map()
    for (const raw of names.split(",")) {
      const name = raw.trim()
      if (!name) continue
      const bare = name.replace(/^type\s+/, "")
      const target = NAME_TO_MODULE[bare]
      if (!target) {
        throw new Error(`${file}: no module mapping for import "${name}"`)
      }
      if (!byModule.has(target)) byModule.set(target, [])
      byModule.get(target).push(name)
    }
    return [...byModule.entries()]
      .map(
        ([module, moduleNames]) =>
          `import ${typeKw ?? ""}{ ${moduleNames.join(", ")} } from "${module}"`,
      )
      .join("\n")
      .concat("\n")
  })
  if (rewritten !== source) {
    writeFileSync(file, rewritten)
    console.log(`rewrote ${file}`)
  }
}

console.log(`done: ${files.length} files`)
