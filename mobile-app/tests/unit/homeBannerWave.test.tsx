import React, { act } from 'react';
import renderer, { ReactTestRenderer } from 'react-test-renderer';
import { HomeBannerWave } from '@/features/home/components/HomeBannerWave';

describe('HomeBannerWave Component', () => {
  it('renders correctly with default props', () => {
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(<HomeBannerWave />);
    });
    expect(tree?.toJSON()).toBeDefined();
    expect(tree?.toJSON()).toMatchSnapshot();
  });

  it('renders with custom colors and opacities', () => {
    let tree: ReactTestRenderer | undefined;
    act(() => {
      tree = renderer.create(
        <HomeBannerWave
          startColor="#111111"
          endColor="#eeeeee"
          opacities={[0.2, 0.4, 0.6, 0.8]}
          gradientId="custom-gradient-id"
        />
      );
    });
    expect(tree?.toJSON()).toBeDefined();
  });
});
