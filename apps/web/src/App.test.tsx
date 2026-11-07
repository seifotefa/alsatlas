import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { App } from './App';
describe('ALSense MVP',()=>{it('shows the research disclosure',()=>{render(<App/>);expect(screen.getByText('Research prototype')).toBeInTheDocument();expect(screen.getByText(/does not diagnose ALS/i)).toBeInTheDocument();});});
