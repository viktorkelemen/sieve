import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EffectsPanel } from './EffectsPanel';

describe('EffectsPanel', () => {
    const defaultProps = {
        onBreathPatternChange: vi.fn(),
        onNoteSkipChange: vi.fn(),
        onPointillistDecayChange: vi.fn(),
        onHarmonicStackChange: vi.fn(),
        onStutterChange: vi.fn(),
        onVelocityHumanizeChange: vi.fn(),
        onLegatoChange: vi.fn(),
        onVoiceAllocationChange: vi.fn(),
    };

    it('renders all effect widgets', () => {
        render(<EffectsPanel {...defaultProps} />);

        expect(screen.getByText('Effects')).toBeDefined();
        expect(screen.getByText('Note Skip')).toBeDefined();
        expect(screen.getByText('Voice Allocation')).toBeDefined();
        expect(screen.getByText('Stutter')).toBeDefined();
        expect(screen.getByText('Humanize')).toBeDefined();
        expect(screen.getByText('Decay')).toBeDefined();
        expect(screen.getByText('Harmonic Stack')).toBeDefined();
        expect(screen.getByText('Breath Pattern')).toBeDefined();
        expect(screen.getByText('Legato')).toBeDefined();
    });
});
