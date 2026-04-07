import dark_deeppurple from 'primereact/resources/themes/mdc-dark-deeppurple/theme.css?url';
import dark_indigo from 'primereact/resources/themes/mdc-dark-indigo/theme.css?url';
import light_deeppurple from 'primereact/resources/themes/mdc-light-deeppurple/theme.css?url';
import light_indigo from 'primereact/resources/themes/mdc-light-indigo/theme.css?url';
import viva_dark from 'primereact/resources/themes/viva-dark/theme.css?url';
import viva_light from 'primereact/resources/themes/viva-light/theme.css?url';

export interface ThemeEntry {
  id: string;
  label: string;
  url: string;
}

export const AVAILABLE_THEMES: ThemeEntry[] = [
  { id: 'mdc-dark-deeppurple', label: 'MDC Dark - Deep Purple', url: dark_deeppurple },
  { id: 'mdc-dark-indigo', label: 'MDC Dark - Indigo', url: dark_indigo },
  { id: 'mdc-light-deeppurple', label: 'MDC Light - Deep Purple', url: light_deeppurple },
  { id: 'mdc-light-indigo', label: 'MDC Light - Indigo', url: light_indigo },
  { id: 'viva-dark', label: 'Viva Dark', url: viva_dark },
  { id: 'viva-light', label: 'Viva Light', url: viva_light }
];

export function findThemeById(id?: string) {
  if (!id) return null;
  return AVAILABLE_THEMES.find((t) => t.id === id) ?? null;
}
