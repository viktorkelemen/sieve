import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectsPanel } from './EffectsPanel';

describe('EffectsPanel', () => {
    const defaultProps = {
        onBreathPatternChange: vi.fn(),
        onNoteSkipChange: vi.fn(),
        onPointillistDecayChange: vi.fn(),
        onHarmonicStackChange: vi.fn(),
    };

    it('renders correctly', () => {
        render(<EffectsPanel {...defaultProps} />);
        expect(screen.getByText('Effects')).toBeDefined();
        expect(screen.getByText('Pointillist Decay')).toBeDefined();
    });

    describe('Pointillist Decay Slider', () => {
        it('does NOT call onChange handler while dragging (onChange event)', () => {
            render(<EffectsPanel {...defaultProps} />);

            // Enable decay first
            const toggle = screen.getByLabelText('Pointillist Decay');
            fireEvent.click(toggle);
            expect(defaultProps.onPointillistDecayChange).toHaveBeenCalledWith(true, expect.any(Object));
            defaultProps.onPointillistDecayChange.mockClear();

            // Find slider
            const slider = screen.getByLabelText(/Decay:/).querySelector('input[type="range"]');
            expect(slider).toBeDefined();

            if (slider) {
                // Simulate drag (change event)
                fireEvent.change(slider, { target: { value: '0.2' } });

                // Should NOT have called the parent handler yet
                expect(defaultProps.onPointillistDecayChange).not.toHaveBeenCalled();
            }
        });

        it('calls onChange handler on mouse up (commit)', () => {
            render(<EffectsPanel {...defaultProps} />);

            // Enable decay
            const toggle = screen.getByLabelText('Pointillist Decay');
            fireEvent.click(toggle);
            defaultProps.onPointillistDecayChange.mockClear();

            const slider = screen.getByLabelText(/Decay:/).querySelector('input[type="range"]');

            if (slider) {
                // Change value locally
                fireEvent.change(slider, { target: { value: '0.3' } });

                // Commit (mouse up)
                fireEvent.mouseUp(slider);

                // NOW it should have called the handler
                expect(defaultProps.onPointillistDecayChange).toHaveBeenCalledWith(true, expect.objectContaining({
                    decayFactor: 0.3
                }));
            }
        });
    });
});
