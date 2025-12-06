import { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
  card: {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: 8,
    padding: 14,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  cardEnabled: {
    borderColor: '#4a9eff',
    boxShadow: '0 0 12px rgba(74, 158, 255, 0.15)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: '1px solid #3a3a3a',
  },
  headerEnabled: {
    borderBottomColor: 'rgba(74, 158, 255, 0.25)',
  },
  checkbox: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleEnabled: {
    color: '#e0e0e0',
  },
  params: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    opacity: 0.4,
    pointerEvents: 'none',
  },
  paramsEnabled: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  label: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#888',
    whiteSpace: 'nowrap',
  },
  labelText: {
    minWidth: 85,
    display: 'inline-block',
  },
  slider: {
    flex: 1,
    minWidth: 60,
    margin: 0,
  },
});

interface EffectCardProps {
  title: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  children: ReactNode;
}

export function EffectCard({ title, enabled, onToggle, children }: EffectCardProps) {
  return (
    <div {...stylex.props(styles.card, enabled && styles.cardEnabled)}>
      <div {...stylex.props(styles.header, enabled && styles.headerEnabled)}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          {...stylex.props(styles.checkbox)}
        />
        <span {...stylex.props(styles.title, enabled && styles.titleEnabled)}>
          {title}
        </span>
      </div>
      <div {...stylex.props(styles.params, enabled && styles.paramsEnabled)}>
        {children}
      </div>
    </div>
  );
}

// Shared styles for use in effect widgets
export const labelStyle = styles.label;
export const labelTextStyle = styles.labelText;
export const sliderStyle = styles.slider;
