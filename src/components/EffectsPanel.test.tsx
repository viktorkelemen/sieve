import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EffectsPanel } from './EffectsPanel';

describe('EffectsPanel', () => {
    const defaultProps = {
        onBreathPatternChange: vi.fn(),
        onNoteSkipChange: vi.fn(),
        onPointillistDecayChange: vi.fn(),
        onHarmonicStackChange: vi.fn(),
        onStutterChange: vi.fn(),
        onVelocityHumanizeChange: vi.fn(),
    };

    it('renders correctly', () => {
        render(<EffectsPanel {...defaultProps} />);
        expect(screen.getByText('Effects')).toBeDefined();
        expect(screen.getByText('Decay')).toBeDefined();
    });

    describe('Pointillist Decay Slider', () => {
        it('does NOT call onChange handler while dragging (onChange event)', () => {
            render(<EffectsPanel {...defaultProps} />);

            // Enable decay first - find by the exact header text
            const decayCards = screen.getAllByText('Decay');
            // The header "Decay" is in the effect-card-header
            const decayHeader = decayCards.find(el => el.closest('.effect-card-header'));
            const toggle = decayHeader?.closest('.effect-card-header')?.querySelector('input[type="checkbox"]');
            expect(toggle).toBeDefined();
            if (toggle) fireEvent.click(toggle);
            expect(defaultProps.onPointillistDecayChange).toHaveBeenCalledWith(true, expect.any(Object));
            defaultProps.onPointillistDecayChange.mockClear();

            // Find the decay slider in the Decay card (not Stutter's decay)
            const decayCard = decayHeader?.closest('.effect-card');
            const slider = decayCard?.querySelector('.effect-card-params input[type="range"]');
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

            // Enable decay - find by the exact header text
            const decayCards = screen.getAllByText('Decay');
            const decayHeader = decayCards.find(el => el.closest('.effect-card-header'));
            const toggle = decayHeader?.closest('.effect-card-header')?.querySelector('input[type="checkbox"]');
            if (toggle) fireEvent.click(toggle);
            defaultProps.onPointillistDecayChange.mockClear();

            const decayCard = decayHeader?.closest('.effect-card');
            const slider = decayCard?.querySelector('.effect-card-params input[type="range"]');

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

    describe('Stutter Sliders', () => {
        const getStutterCard = () => {
            const stutterHeader = screen.getByText('Stutter');
            return stutterHeader.closest('.effect-card');
        };

        const enableStutter = () => {
            const card = getStutterCard();
            const toggle = card?.querySelector('.effect-card-header input[type="checkbox"]');
            if (toggle) fireEvent.click(toggle);
            defaultProps.onStutterChange.mockClear();
        };

        it('does NOT call onChange handler while dragging Reps slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const repsSlider = sliders?.[0]; // First slider is Reps

            if (repsSlider) {
                fireEvent.change(repsSlider, { target: { value: '5' } });
                expect(defaultProps.onStutterChange).not.toHaveBeenCalled();
            }
        });

        it('calls onChange handler on mouse up for Reps slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const repsSlider = sliders?.[0];

            if (repsSlider) {
                fireEvent.change(repsSlider, { target: { value: '4' } });
                fireEvent.mouseUp(repsSlider);

                expect(defaultProps.onStutterChange).toHaveBeenCalledWith(true, expect.objectContaining({
                    repetitions: 4
                }));
            }
        });

        it('does NOT call onChange handler while dragging Decay slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const decaySlider = sliders?.[1]; // Second slider is Decay

            if (decaySlider) {
                fireEvent.change(decaySlider, { target: { value: '0.7' } });
                expect(defaultProps.onStutterChange).not.toHaveBeenCalled();
            }
        });

        it('calls onChange handler on mouse up for Decay slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const decaySlider = sliders?.[1];

            if (decaySlider) {
                fireEvent.change(decaySlider, { target: { value: '0.75' } });
                fireEvent.mouseUp(decaySlider);

                expect(defaultProps.onStutterChange).toHaveBeenCalledWith(true, expect.objectContaining({
                    velocityDecay: 0.75
                }));
            }
        });

        it('does NOT call onChange handler while dragging Gap slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const gapSlider = sliders?.[2]; // Third slider is Gap

            if (gapSlider) {
                fireEvent.change(gapSlider, { target: { value: '0.3' } });
                expect(defaultProps.onStutterChange).not.toHaveBeenCalled();
            }
        });

        it('calls onChange handler on mouse up for Gap slider', () => {
            render(<EffectsPanel {...defaultProps} />);
            enableStutter();

            const card = getStutterCard();
            const sliders = card?.querySelectorAll('.effect-card-params input[type="range"]');
            const gapSlider = sliders?.[2];

            if (gapSlider) {
                fireEvent.change(gapSlider, { target: { value: '0.25' } });
                fireEvent.mouseUp(gapSlider);

                expect(defaultProps.onStutterChange).toHaveBeenCalledWith(true, expect.objectContaining({
                    gapRatio: 0.25
                }));
            }
        });
    });
});
