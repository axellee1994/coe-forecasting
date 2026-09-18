/* Series colors — one place, so the chart, cards and legend can never
   disagree (color follows the category everywhere). Cat A wears the V9
   site accent and Cat B the ink; C/D/E extend the set with muted hues
   that stay apart from each other in both hue and lightness. */

import type { Category } from "@/lib/coe";

export const CATEGORY_COLOR: Record<Category, string> = {
  "Category A": "#06b6d4", // --highlight cyan
  "Category B": "#000000", // --ink
  "Category C": "#f59e0b", // amber
  "Category D": "#8b5cf6", // violet
  "Category E": "#f43f5e", // rose
};
