import { render, screen } from '@testing-library/react';
import App from './App';

test('renders civic alert app shell', () => {
  render(<App />);
  const loadingText = screen.getByText(/loading civicalert/i);
  expect(loadingText).toBeInTheDocument();
});
