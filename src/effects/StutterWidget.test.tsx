import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StutterWidget } from './StutterWidget';

describe('StutterWidget', () => {
    it('renders with title and sliders', () => {
        const onChange = vi.fn();
        render(<StutterWidget onChange={onChange} />);

        expect(screen.getByText('Stutter')).toBeDefined();
        expect(screen.getByText(/Reps:/)).toBeDefined();
        expect(screen.getByText(/Decay:/)).toBeDefined();
        expect(screen.getByText(/Gap:/)).toBeDefined();
    });

    it('calls onChange when toggled on', () => {
        const onChange = vi.fn();
        render(<StutterWidget onChange={onChange} />);

        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);

        expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({
            repetitions: 3,
            velocityDecay: 0.85,
            gapRatio: 0.1,
        }));
    });

    it('does NOT call onChange while dragging slider', () => {
        const onChange = vi.fn();
        render(<StutterWidget onChange={onChange} />);

        // Enable first
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        onChange.mockClear();

        // Find reps slider and change it
        const sliders = screen.getAllByRole('slider');
        fireEvent.change(sliders[0], { target: { value: '4' } });

        // Should NOT have called onChange yet
        expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange on mouse up (commit)', () => {
        const onChange = vi.fn();
        render(<StutterWidget onChange={onChange} />);

        // Enable first
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        onChange.mockClear();

        // Change and commit
        const sliders = screen.getAllByRole('slider');
        fireEvent.change(sliders[0], { target: { value: '4' } });
        fireEvent.mouseUp(sliders[0]);

        expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({
            repetitions: 4,
        }));
    });
});
