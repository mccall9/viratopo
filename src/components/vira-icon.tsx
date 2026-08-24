import type { SVGProps } from "react";

export type ViraIconName = "arrow-right" | "bell" | "check" | "copy" | "eye" | "gauge" | "help" | "link" | "menu" | "minus" | "pointer" | "plus" | "radar" | "receipt" | "sliders" | "x";
type ViraIconProps = Omit<SVGProps<SVGSVGElement>, "name"> & { name: ViraIconName; size?: number };

export function ViraIcon({ name, size = 18, ...props }: ViraIconProps) {
  const paths: Record<ViraIconName, React.ReactNode> = {
    "arrow-right": <><path d="M5 12h13" /><path d="m14 7 5 5-5 5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6" /><circle cx="12" cy="12" r="2.5" /></>,
    gauge: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 4-4" /><path d="M8 18h8" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.4 2.4 0 1 1 3.6 2.1c-.9.5-1.4 1-1.4 2" /><path d="M12 17h.01" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" /></>,
    menu: <><path d="M5 8h14" /><path d="M5 12h14" /><path d="M5 16h14" /></>,
    minus: <path d="M5 12h14" />,
    pointer: <><path d="m5 3 13 9-6 1-3 6Z" /><path d="m13 14 4 4" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    radar: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 12V3" /><path d="m12 12 6 5" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    x: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  };

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]}</svg>;
}
