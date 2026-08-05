/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(),
}));
jest.mock('../src/navigation/AppNavigator', () => ({
  __esModule: true,
  default: () => null,
}));

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(renderer!).toBeDefined();

  ReactTestRenderer.act(() => renderer!.unmount());
});
