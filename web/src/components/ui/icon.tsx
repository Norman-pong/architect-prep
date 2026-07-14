import * as React from 'react';
import { cn } from '@/lib/utils';

export type IconProps = React.SVGAttributes<SVGSVGElement> & {
  className?: string;
  size?: number | string;
  strokeWidth?: number | string;
};

function IconBase({
  className,
  size = 20,
  strokeWidth = 2,
  viewBox = '0 0 24 24',
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const Icon = IconBase;

export function BookOpenIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7.5v9" />
      <path d="M3 5.25A2.25 2.25 0 0 1 5.25 3h4.5v15h-4.5A2.25 2.25 0 0 1 3 15.75V5.25Z" />
      <path d="M21 5.25A2.25 2.25 0 0 0 18.75 3h-4.5v15h4.5A2.25 2.25 0 0 0 21 15.75V5.25Z" />
    </Icon>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M16.862 4.487 18.55 2.799a2.121 2.121 0 1 1 3 3L19.862 6.487" />
      <path d="M19 7 7.5 18.5a2 2 0 0 1-.878.546l-3.372.844.844-3.372a2 2 0 0 1 .546-.878L15 5" />
      <path d="M14.5 7.5 16.5 9.5" />
    </Icon>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Icon>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </Icon>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </Icon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </Icon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}
export function ReviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <path d="M21 4v5h-5" />
      <path d="M12 8v4l2.5 2.5" />
    </Icon>
  );
}
