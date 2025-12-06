import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DecayWidget } from './DecayWidget';

describe('DecayWidget', () => {
    it('renders with title and slider', () => {
        const onChange = vi.fn();
        render(<DecayWidget onChange={onChange} />);

        expect(screen.getByText('Decay')).toBeDefined();
        expect(screen.getByText(/Decay:/)).toBeDefined();
    });

    it('calls onChange when toggled on', () => {
        const onChange = vi.fn();
        render(<DecayWidget onChange={onChange} />);

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({
            decayFactor: 0.5,
            minDuration: 0.01,
        }));
    });

    it('does NOT call onChange while dragging slider', () => {
        const onChange = vi.fn();
        render(<DecayWidget onChange={onChange} />);

        // Enable first
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        onChange.mockClear();

        // Change slider
        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '0.3' } });

        // Should NOT have called onChange yet
        expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange on mouse up (commit)', () => {
        const onChange = vi.fn();
        render(<DecayWidget onChange={onChange} />);

        // Enable first
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        onChange.mockClear();

        // Change and commit
        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '0.3' } });
        fireEvent.mouseUp(slider);

        expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({
            decayFactor: 0.3,
        }));
    });
});
