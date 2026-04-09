export interface MenuItem {
  label: string;
  icon?: string;
  to?: string;
  url?: string;
  items?: MenuItem[];
  seperator?: boolean;
  disabled?: boolean;
  visible?: boolean;
  target?: string;
  class?: string;
  replaceUrl?: boolean;
  moTabMoi?: boolean;
  command?: (event: { originalEvent: React.MouseEvent; item: MenuItem }) => void;
}