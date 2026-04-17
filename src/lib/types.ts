export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'provincia'
  | 'comune';

export interface Step {
  id: string;
  label: string;
}

export interface Field {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultPrefix?: string;
  noPrefix?: boolean;
  linkedProvincia?: string;
  stepId?: string;
  order: number;
}

export interface FormStyle {
  primaryColor?:     string;   // accent colour – button, focus ring, active dots/bar  (default #4f46e5)
  borderRadius?:     string;   // inputs & buttons radius  (default 6px)
  fontFamily?:       string;   // CSS font-family value    (default system-ui)
  fontUrl?:          string;   // optional URL to load font (e.g. Google Fonts stylesheet)
  inputBorderColor?: string;   // idle input border        (default #d1d5db)
  labelColor?:       string;   // field label colour       (default #333)
}

export interface FormConfig {
  title?: string;
  description?: string;
  submitLabel?: string;
  successMessage?: string;
  thankYouUrl?: string;
  multiStep?: boolean;
  stepperStyle?: 'dots' | 'bar';
  style?: FormStyle;
  steps?: Step[];
  fields: Field[];
}

export interface Lead {
  id: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface FormMeta {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  leadCount: number;
}

// ── Export template ────────────────────────────────────────────────────────────

export interface ExportSchemaColumn {
  id: string;     // uuid
  label: string;  // CSV header label
}

export interface FormExportMapping {
  slug: string;
  enabled: boolean;
  // columnId → source key: field name | '_createdAt' | '_formName' | '_formSlug' | '_sourceUrl' | ''
  map: Record<string, string>;
}

export interface ExportTemplate {
  columns: ExportSchemaColumn[];
  formMappings: FormExportMapping[];
}
