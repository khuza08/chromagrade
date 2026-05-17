import type { Preset } from '../../store/slices/presetsSlice';

export const prebuiltPresets: Preset[] = [
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    category: 'Cinematic',
    parameters: {
      temperature: 15,
      tint: -5,
      contrast: 15,
      saturation: 10,
    }
  },
  {
    id: 'vintage-fade',
    name: 'Vintage Fade',
    category: 'Vintage',
    parameters: {
      contrast: -10,
      saturation: -15,
      temperature: 5,
    }
  },
  {
    id: 'monochrome',
    name: 'Monochrome High',
    category: 'B&W',
    parameters: {
      saturation: -100,
      contrast: 25,
    }
  },
  {
    id: 'cool-nordic',
    name: 'Cool Nordic',
    category: 'Cinematic',
    parameters: {
      temperature: -20,
      tint: 5,
      contrast: 5,
      saturation: -5,
    }
  }
];
