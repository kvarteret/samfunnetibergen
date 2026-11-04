// The parts of shadcn-svelte's Sheet this app uses, on Bits UI's Dialog
// (MIT). Only the root and the content are needed; the page supplies its own
// title (the place panel's heading), so there is no SheetTitle or trigger.
import { Dialog } from "bits-ui"
import SheetContent from "./sheet-content.svelte"

const Sheet = Dialog.Root

export { Sheet, SheetContent }
