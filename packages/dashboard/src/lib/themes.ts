export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts?: {
    sans: string;
    serif?: string;
    mono?: string;
  };
  css: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const themes: Theme[] = [
  {
    id: 'doom-64',
    name: 'Doom 64',
    description: 'Retro gaming aesthetics with sharp edges',
    preview: {
      primary: '#A52A2A',
      secondary: '#4B7C59',
      accent: '#5B9BD5',
      background: '#CCCCCC'
    },
    fonts: {
      sans: 'Oxanium, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'Source Code Pro, monospace'
    },
    css: {
      light: {
        '--background': '0 0% 80%',
        '--foreground': '0 0% 12.1569%',
        '--card': '0 0% 69.0196%',
        '--card-foreground': '0 0% 12.1569%',
        '--popover': '0 0% 69.0196%',
        '--popover-foreground': '0 0% 12.1569%',
        '--primary': '0 73.4597% 41.3725%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '82 38.9610% 30.1961%',
        '--secondary-foreground': '0 0% 100%',
        '--muted': '0 0% 72.1569%',
        '--muted-foreground': '0 0% 29.0196%',
        '--accent': '207.2727 44% 49.0196%',
        '--accent-foreground': '0 0% 100%',
        '--destructive': '26.1176 100% 50%',
        '--destructive-foreground': '0 0% 0%',
        '--border': '0 0% 31.3725%',
        '--input': '0 0% 31.3725%',
        '--ring': '0 73.4597% 41.3725%',
        '--chart-1': '0 73.4597% 41.3725%',
        '--chart-2': '82 38.9610% 30.1961%',
        '--chart-3': '207.2727 44% 49.0196%',
        '--chart-4': '26.1176 100% 50%',
        '--chart-5': '15.7143 17.5000% 47.0588%',
        '--sidebar': '0 0% 69.0196%',
        '--sidebar-foreground': '0 0% 12.1569%',
        '--sidebar-primary': '0 73.4597% 41.3725%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '207.2727 44% 49.0196%',
        '--sidebar-accent-foreground': '0 0% 100%',
        '--sidebar-border': '0 0% 31.3725%',
        '--sidebar-ring': '0 73.4597% 41.3725%',
        '--radius': '0px',
        '--shadow-2xs': '0px 2px 4px 0px hsl(0 0% 0% / 0.20)',
        '--shadow-xs': '0px 2px 4px 0px hsl(0 0% 0% / 0.20)',
        '--shadow-sm': '0px 2px 4px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40)',
        '--shadow': '0px 2px 4px 0px hsl(0 0% 0% / 0.40), 0px 1px 2px -1px hsl(0 0% 0% / 0.40)',
        '--shadow-md': '0px 2px 4px 0px hsl(0 0% 0% / 0.40), 0px 2px 4px -1px hsl(0 0% 0% / 0.40)',
        '--shadow-lg': '0px 2px 4px 0px hsl(0 0% 0% / 0.40), 0px 4px 6px -1px hsl(0 0% 0% / 0.40)',
        '--shadow-xl': '0px 2px 4px 0px hsl(0 0% 0% / 0.40), 0px 8px 10px -1px hsl(0 0% 0% / 0.40)',
        '--shadow-2xl': '0px 2px 4px 0px hsl(0 0% 0% / 1.00)',
        '--tracking-normal': '0em',
        '--spacing': '0.25rem'
      },
      dark: {
        '--background': '0 0% 10.1961%',
        '--foreground': '0 0% 87.8431%',
        '--card': '0 0% 16.4706%',
        '--card-foreground': '0 0% 87.8431%',
        '--popover': '0 0% 16.4706%',
        '--popover-foreground': '0 0% 87.8431%',
        '--primary': '1.3636 77.1930% 55.2941%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '92.0388 47.9070% 42.1569%',
        '--secondary-foreground': '0 0% 0%',
        '--muted': '0 0% 14.5098%',
        '--muted-foreground': '0 0% 62.7451%',
        '--accent': '206.7123 89.0244% 67.8431%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '37.6471 100% 50%',
        '--destructive-foreground': '0 0% 0%',
        '--border': '0 0% 29.0196%',
        '--input': '0 0% 29.0196%',
        '--ring': '1.3636 77.1930% 55.2941%',
        '--chart-1': '1.3636 77.1930% 55.2941%',
        '--chart-2': '92.0388 47.9070% 42.1569%',
        '--chart-3': '206.7123 89.0244% 67.8431%',
        '--chart-4': '37.6471 100% 50%',
        '--chart-5': '15.8824 15.3153% 56.4706%',
        '--sidebar': '0 0% 7.8431%',
        '--sidebar-foreground': '0 0% 87.8431%',
        '--sidebar-primary': '1.3636 77.1930% 55.2941%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '206.7123 89.0244% 67.8431%',
        '--sidebar-accent-foreground': '0 0% 0%',
        '--sidebar-border': '0 0% 29.0196%',
        '--sidebar-ring': '1.3636 77.1930% 55.2941%',
        '--radius': '0px',
        '--shadow-2xs': '0px 2px 5px 0px hsl(0 0% 0% / 0.30)',
        '--shadow-xs': '0px 2px 5px 0px hsl(0 0% 0% / 0.30)',
        '--shadow-sm': '0px 2px 5px 0px hsl(0 0% 0% / 0.60), 0px 1px 2px -1px hsl(0 0% 0% / 0.60)',
        '--shadow': '0px 2px 5px 0px hsl(0 0% 0% / 0.60), 0px 1px 2px -1px hsl(0 0% 0% / 0.60)',
        '--shadow-md': '0px 2px 5px 0px hsl(0 0% 0% / 0.60), 0px 2px 4px -1px hsl(0 0% 0% / 0.60)',
        '--shadow-lg': '0px 2px 5px 0px hsl(0 0% 0% / 0.60), 0px 4px 6px -1px hsl(0 0% 0% / 0.60)',
        '--shadow-xl': '0px 2px 5px 0px hsl(0 0% 0% / 0.60), 0px 8px 10px -1px hsl(0 0% 0% / 0.60)',
        '--shadow-2xl': '0px 2px 5px 0px hsl(0 0% 0% / 1.50)',
        '--tracking-normal': '0em',
        '--spacing': '0.25rem'
      }
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Warm beige tones with orange-red accents',
    preview: {
      primary: '#D2713D',
      secondary: '#E8DFC7',
      accent: '#E8DFC7',
      background: '#F7F4EE'
    },
    fonts: {
      sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    css: {
      light: {
        '--background': '48 33.3333% 97.0588%',
        '--foreground': '48 19.6078% 20%',
        '--card': '48 33.3333% 97.0588%',
        '--card-foreground': '60 2.5641% 7.6471%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '50.7692 19.4030% 13.1373%',
        '--primary': '15.1111 55.5556% 52.3529%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '46.1538 22.8070% 88.8235%',
        '--secondary-foreground': '50.7692 8.4967% 30.0000%',
        '--muted': '44.0000 29.4118% 90%',
        '--muted-foreground': '50.0000 2.3622% 50.1961%',
        '--accent': '46.1538 22.8070% 88.8235%',
        '--accent-foreground': '50.7692 19.4030% 13.1373%',
        '--destructive': '60 2.5641% 7.6471%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '50 7.5000% 84.3137%',
        '--input': '50.7692 7.9755% 68.0392%',
        '--ring': '15.1111 55.5556% 52.3529%',
        '--chart-1': '18.2813 57.1429% 43.9216%',
        '--chart-2': '251.4545 84.6154% 74.5098%',
        '--chart-3': '46.1538 28.2609% 81.9608%',
        '--chart-4': '256.5517 49.1525% 88.4314%',
        '--chart-5': '17.7778 60% 44.1176%',
        '--sidebar': '51.4286 25.9259% 94.7059%',
        '--sidebar-foreground': '60 2.5210% 23.3333%',
        '--sidebar-primary': '15.1111 55.5556% 52.3529%',
        '--sidebar-primary-foreground': '0 0% 98.4314%',
        '--sidebar-accent': '46.1538 22.8070% 88.8235%',
        '--sidebar-accent-foreground': '0 0% 20.3922%',
        '--sidebar-border': '0 0% 92.1569%',
        '--sidebar-ring': '0 0% 70.9804%',
        '--radius': '0.5rem',
        '--shadow-2xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
        '--shadow-xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
        '--shadow-sm': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
        '--shadow': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-md': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-lg': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-xl': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-2xl': '0 1px 3px 0px hsl(0 0% 0% / 0.25)',
        '--tracking-normal': '0em',
        '--spacing': '0.25rem'
      },
      dark: {
        '--background': '60 2.7027% 14.5098%',
        '--foreground': '46.1538 9.7744% 73.9216%',
        '--card': '60 2.7027% 14.5098%',
        '--card-foreground': '48 33.3333% 97.0588%',
        '--popover': '60 2.1277% 18.4314%',
        '--popover-foreground': '60 5.4545% 89.2157%',
        '--primary': '14.7692 63.1068% 59.6078%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '48 33.3333% 97.0588%',
        '--secondary-foreground': '60 2.1277% 18.4314%',
        '--muted': '60 3.8462% 10.1961%',
        '--muted-foreground': '51.4286 8.8608% 69.0196%',
        '--accent': '48 10.6383% 9.2157%',
        '--accent-foreground': '51.4286 25.9259% 94.7059%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '60 5.0847% 23.1373%',
        '--input': '52.5000 5.1282% 30.5882%',
        '--ring': '14.7692 63.1068% 59.6078%',
        '--chart-1': '18.2813 57.1429% 43.9216%',
        '--chart-2': '251.4545 84.6154% 74.5098%',
        '--chart-3': '48 10.6383% 9.2157%',
        '--chart-4': '248.2759 25.2174% 22.5490%',
        '--chart-5': '17.7778 60% 44.1176%',
        '--sidebar': '30 3.3333% 11.7647%',
        '--sidebar-foreground': '46.1538 9.7744% 73.9216%',
        '--sidebar-primary': '0 0% 20.3922%',
        '--sidebar-primary-foreground': '0 0% 98.4314%',
        '--sidebar-accent': '60 3.4483% 5.6863%',
        '--sidebar-accent-foreground': '46.1538 9.7744% 73.9216%',
        '--sidebar-border': '0 0% 92.1569%',
        '--sidebar-ring': '0 0% 70.9804%',
        '--radius': '0.5rem',
        '--shadow-2xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
        '--shadow-xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
        '--shadow-sm': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
        '--shadow': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-md': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-lg': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-xl': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)',
        '--shadow-2xl': '0 1px 3px 0px hsl(0 0% 0% / 0.25)'
      }
    }
  },
  {
    id: 'soft-pop',
    name: 'Soft Pop',
    description: 'Vibrant colors with soft backgrounds',
    preview: {
      primary: '#6366F1',
      secondary: '#22D3EE',
      accent: '#A5B4FC',
      background: '#F5F5F0'
    },
    fonts: {
      sans: 'DM Sans, sans-serif',
      serif: 'DM Sans, sans-serif',
      mono: 'Space Mono, monospace'
    },
    css: {
      light: {
        '--background': '80.0000 33.3333% 96.4706%',
        '--foreground': '0 0% 0%',
        '--card': '0 0% 100%',
        '--card-foreground': '0 0% 0%',
        '--popover': '0 0% 100%',
        '--popover-foreground': '0 0% 0%',
        '--primary': '243.3962 75.3555% 58.6275%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '173.4146 80.3922% 40%',
        '--secondary-foreground': '0 0% 100%',
        '--muted': '0 0% 94.1176%',
        '--muted-foreground': '0 0% 20%',
        '--accent': '243.3962 75.3555% 78.6275%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '0 0% 0%',
        '--input': '0 0% 45.0980%',
        '--ring': '229.6552 93.5484% 81.7647%',
        '--chart-1': '243.3962 75.3555% 58.6275%',
        '--chart-2': '173.4146 80.3922% 40%',
        '--chart-3': '243.3962 75.3555% 78.6275%',
        '--chart-4': '330.3659 81.1881% 60.3922%',
        '--chart-5': '142.0859 70.5628% 45.2941%',
        '--sidebar': '80.0000 33.3333% 96.4706%',
        '--sidebar-foreground': '0 0% 0%',
        '--sidebar-primary': '243.3962 75.3555% 58.6275%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '243.3962 75.3555% 78.6275%',
        '--sidebar-accent-foreground': '0 0% 0%',
        '--sidebar-border': '0 0% 0%',
        '--sidebar-ring': '229.6552 93.5484% 81.7647%',
        '--radius': '0.75rem',
        '--shadow-2xs': '0 2px 4px 0px hsl(243.3962 75.3555% 58.6275% / 0.08)',
        '--shadow-xs': '0 2px 4px 0px hsl(243.3962 75.3555% 58.6275% / 0.08)',
        '--shadow-sm': '0 4px 8px 0px hsl(243.3962 75.3555% 58.6275% / 0.12), 0 2px 4px -1px hsl(243.3962 75.3555% 58.6275% / 0.08)',
        '--shadow': '0 4px 8px 0px hsl(243.3962 75.3555% 58.6275% / 0.12), 0 2px 4px -1px hsl(243.3962 75.3555% 58.6275% / 0.08)',
        '--shadow-md': '0 8px 16px 0px hsl(243.3962 75.3555% 58.6275% / 0.16), 0 4px 8px -2px hsl(243.3962 75.3555% 58.6275% / 0.12)',
        '--shadow-lg': '0 16px 24px 0px hsl(243.3962 75.3555% 58.6275% / 0.20), 0 8px 16px -4px hsl(243.3962 75.3555% 58.6275% / 0.16)',
        '--shadow-xl': '0 24px 32px 0px hsl(243.3962 75.3555% 58.6275% / 0.24), 0 16px 24px -8px hsl(243.3962 75.3555% 58.6275% / 0.20)',
        '--shadow-2xl': '0 32px 48px 0px hsl(243.3962 75.3555% 58.6275% / 0.28)',
        '--tracking-tighter': '-0.02em',
        '--tracking-tight': '-0.01em',
        '--tracking-normal': '0em',
        '--tracking-wide': '0.01em',
        '--tracking-wider': '0.02em',
        '--tracking-widest': '0.04em'
      },
      dark: {
        '--background': '0 0% 0%',
        '--foreground': '0 0% 100%',
        '--card': '215.2941 24.6377% 13.5294%',
        '--card-foreground': '0 0% 100%',
        '--popover': '215.2941 24.6377% 13.5294%',
        '--popover-foreground': '0 0% 100%',
        '--primary': '234.4538 89.4737% 73.9216%',
        '--primary-foreground': '0 0% 0%',
        '--secondary': '172.4551 66.0079% 50.3922%',
        '--secondary-foreground': '0 0% 0%',
        '--muted': '0 0% 20%',
        '--muted-foreground': '0 0% 80%',
        '--accent': '234.4538 89.4737% 83.9216%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '0 90.6040% 70.7843%',
        '--destructive-foreground': '0 0% 0%',
        '--border': '0 0% 32.9412%',
        '--input': '0 0% 100%',
        '--ring': '234.4538 89.4737% 73.9216%',
        '--chart-1': '234.4538 89.4737% 73.9216%',
        '--chart-2': '172.4551 66.0079% 50.3922%',
        '--chart-3': '234.4538 89.4737% 83.9216%',
        '--chart-4': '328.6154 85.5263% 70.1961%',
        '--chart-5': '141.8919 69.1589% 58.0392%',
        '--sidebar': '0 0% 0%',
        '--sidebar-foreground': '0 0% 100%',
        '--sidebar-primary': '234.4538 89.4737% 73.9216%',
        '--sidebar-primary-foreground': '0 0% 0%',
        '--sidebar-accent': '234.4538 89.4737% 83.9216%',
        '--sidebar-accent-foreground': '0 0% 0%',
        '--sidebar-border': '0 0% 100%',
        '--sidebar-ring': '234.4538 89.4737% 73.9216%',
        '--radius': '0.75rem',
        '--shadow-2xs': '0 2px 4px 0px hsl(234.4538 89.4737% 73.9216% / 0.12)',
        '--shadow-xs': '0 2px 4px 0px hsl(234.4538 89.4737% 73.9216% / 0.12)',
        '--shadow-sm': '0 4px 8px 0px hsl(234.4538 89.4737% 73.9216% / 0.16), 0 2px 4px -1px hsl(234.4538 89.4737% 73.9216% / 0.12)',
        '--shadow': '0 4px 8px 0px hsl(234.4538 89.4737% 73.9216% / 0.16), 0 2px 4px -1px hsl(234.4538 89.4737% 73.9216% / 0.12)',
        '--shadow-md': '0 8px 16px 0px hsl(234.4538 89.4737% 73.9216% / 0.20), 0 4px 8px -2px hsl(234.4538 89.4737% 73.9216% / 0.16)',
        '--shadow-lg': '0 16px 24px 0px hsl(234.4538 89.4737% 73.9216% / 0.24), 0 8px 16px -4px hsl(234.4538 89.4737% 73.9216% / 0.20)',
        '--shadow-xl': '0 24px 32px 0px hsl(234.4538 89.4737% 73.9216% / 0.28), 0 16px 24px -8px hsl(234.4538 89.4737% 73.9216% / 0.24)',
        '--shadow-2xl': '0 32px 48px 0px hsl(234.4538 89.4737% 73.9216% / 0.32)',
        '--tracking-tighter': '-0.02em',
        '--tracking-tight': '-0.01em',
        '--tracking-normal': '0em',
        '--tracking-wide': '0.01em',
        '--tracking-wider': '0.02em',
        '--tracking-widest': '0.04em'
      }
    }
  },
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Clean green accents with modern typography',
    preview: {
      primary: '#10B981',
      secondary: '#F3F4F6',
      accent: '#F3F4F6',
      background: '#FCFCFC'
    },
    fonts: {
      sans: 'Outfit, sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'monospace'
    },
    css: {
      light: {
        '--background': '0 0% 98.8235%',
        '--foreground': '0 0% 9.0196%',
        '--card': '0 0% 98.8235%',
        '--card-foreground': '0 0% 9.0196%',
        '--popover': '0 0% 98.8235%',
        '--popover-foreground': '0 0% 32.1569%',
        '--primary': '151.3274 66.8639% 66.8627%',
        '--primary-foreground': '153.3333 13.0435% 13.5294%',
        '--secondary': '0 0% 99.2157%',
        '--secondary-foreground': '0 0% 9.0196%',
        '--muted': '0 0% 92.9412%',
        '--muted-foreground': '0 0% 12.5490%',
        '--accent': '0 0% 92.9412%',
        '--accent-foreground': '0 0% 12.5490%',
        '--destructive': '9.8901 81.9820% 43.5294%',
        '--destructive-foreground': '0 100% 99.4118%',
        '--border': '0 0% 87.4510%',
        '--input': '0 0% 96.4706%',
        '--ring': '151.3274 66.8639% 66.8627%',
        '--chart-1': '151.3274 66.8639% 66.8627%',
        '--chart-2': '217.2193 91.2195% 59.8039%',
        '--chart-3': '258.3117 89.5349% 66.2745%',
        '--chart-4': '37.6923 92.1260% 50.1961%',
        '--chart-5': '160.1183 84.0796% 39.4118%',
        '--sidebar': '0 0% 98.8235%',
        '--sidebar-foreground': '0 0% 43.9216%',
        '--sidebar-primary': '151.3274 66.8639% 66.8627%',
        '--sidebar-primary-foreground': '153.3333 13.0435% 13.5294%',
        '--sidebar-accent': '0 0% 92.9412%',
        '--sidebar-accent-foreground': '0 0% 12.5490%',
        '--sidebar-border': '0 0% 87.4510%',
        '--sidebar-ring': '151.3274 66.8639% 66.8627%',
        '--radius': '0.375rem',
        '--shadow-2xs': '0 1px 2px 0px hsl(151.3274 66.8639% 66.8627% / 0.05)',
        '--shadow-xs': '0 1px 2px 0px hsl(151.3274 66.8639% 66.8627% / 0.05)',
        '--shadow-sm': '0 1px 3px 0px hsl(151.3274 66.8639% 66.8627% / 0.10), 0 1px 2px -1px hsl(151.3274 66.8639% 66.8627% / 0.10)',
        '--shadow': '0 1px 3px 0px hsl(151.3274 66.8639% 66.8627% / 0.10), 0 1px 2px -1px hsl(151.3274 66.8639% 66.8627% / 0.10)',
        '--shadow-md': '0 4px 6px -1px hsl(151.3274 66.8639% 66.8627% / 0.10), 0 2px 4px -2px hsl(151.3274 66.8639% 66.8627% / 0.10)',
        '--shadow-lg': '0 10px 15px -3px hsl(151.3274 66.8639% 66.8627% / 0.10), 0 4px 6px -4px hsl(151.3274 66.8639% 66.8627% / 0.10)',
        '--shadow-xl': '0 20px 25px -5px hsl(151.3274 66.8639% 66.8627% / 0.10), 0 8px 10px -6px hsl(151.3274 66.8639% 66.8627% / 0.10)',
        '--shadow-2xl': '0 25px 50px -12px hsl(151.3274 66.8639% 66.8627% / 0.25)',
        '--tracking-tighter': '-0.025em',
        '--tracking-tight': '-0.0125em',
        '--tracking-normal': '0em',
        '--tracking-wide': '0.0125em',
        '--tracking-wider': '0.025em',
        '--tracking-widest': '0.05em'
      },
      dark: {
        '--background': '0 0% 7.0588%',
        '--foreground': '214.2857 31.8182% 91.3725%',
        '--card': '0 0% 9.0196%',
        '--card-foreground': '214.2857 31.8182% 91.3725%',
        '--popover': '0 0% 14.1176%',
        '--popover-foreground': '0 0% 66.2745%',
        '--primary': '154.8980 100.0000% 19.2157%',
        '--primary-foreground': '152.7273 19.2982% 88.8235%',
        '--secondary': '0 0% 14.1176%',
        '--secondary-foreground': '0 0% 98.0392%',
        '--muted': '0 0% 12.1569%',
        '--muted-foreground': '0 0% 63.5294%',
        '--accent': '0 0% 19.2157%',
        '--accent-foreground': '0 0% 98.0392%',
        '--destructive': '6.6667 60.0000% 20.5882%',
        '--destructive-foreground': '12.0000 12.1951% 91.9608%',
        '--border': '0 0% 16.0784%',
        '--input': '0 0% 14.1176%',
        '--ring': '141.8919 69.1589% 58.0392%',
        '--chart-1': '141.8919 69.1589% 58.0392%',
        '--chart-2': '213.1169 93.9024% 67.8431%',
        '--chart-3': '255.1351 91.7355% 76.2745%',
        '--chart-4': '43.2558 96.4126% 56.2745%',
        '--chart-5': '172.4551 66.0079% 50.3922%',
        '--sidebar': '0 0% 7.0588%',
        '--sidebar-foreground': '0 0% 53.7255%',
        '--sidebar-primary': '154.8980 100.0000% 19.2157%',
        '--sidebar-primary-foreground': '152.7273 19.2982% 88.8235%',
        '--sidebar-accent': '0 0% 19.2157%',
        '--sidebar-accent-foreground': '0 0% 98.0392%',
        '--sidebar-border': '0 0% 16.0784%',
        '--sidebar-ring': '141.8919 69.1589% 58.0392%',
        '--radius': '0.375rem',
        '--shadow-2xs': '0 1px 2px 0px hsl(141.8919 69.1589% 58.0392% / 0.10)',
        '--shadow-xs': '0 1px 2px 0px hsl(141.8919 69.1589% 58.0392% / 0.10)',
        '--shadow-sm': '0 1px 3px 0px hsl(141.8919 69.1589% 58.0392% / 0.15), 0 1px 2px -1px hsl(141.8919 69.1589% 58.0392% / 0.15)',
        '--shadow': '0 1px 3px 0px hsl(141.8919 69.1589% 58.0392% / 0.15), 0 1px 2px -1px hsl(141.8919 69.1589% 58.0392% / 0.15)',
        '--shadow-md': '0 4px 6px -1px hsl(141.8919 69.1589% 58.0392% / 0.15), 0 2px 4px -2px hsl(141.8919 69.1589% 58.0392% / 0.15)',
        '--shadow-lg': '0 10px 15px -3px hsl(141.8919 69.1589% 58.0392% / 0.15), 0 4px 6px -4px hsl(141.8919 69.1589% 58.0392% / 0.15)',
        '--shadow-xl': '0 20px 25px -5px hsl(141.8919 69.1589% 58.0392% / 0.15), 0 8px 10px -6px hsl(141.8919 69.1589% 58.0392% / 0.15)',
        '--shadow-2xl': '0 25px 50px -12px hsl(141.8919 69.1589% 58.0392% / 0.30)',
        '--tracking-tighter': '-0.025em',
        '--tracking-tight': '-0.0125em',
        '--tracking-normal': '0em',
        '--tracking-wide': '0.0125em',
        '--tracking-wider': '0.025em',
        '--tracking-widest': '0.05em'
      }
    }
  }
];

export function applyTheme(themeId: string, isDark: boolean = false) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;

  const root = document.documentElement;
  const cssVars = isDark ? theme.css.dark : theme.css.light;
  
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply theme-specific fonts
  if (theme.fonts) {
    root.style.setProperty('--font-sans', theme.fonts.sans);
    if (theme.fonts.serif) root.style.setProperty('--font-serif', theme.fonts.serif);
    if (theme.fonts.mono) root.style.setProperty('--font-mono', theme.fonts.mono);
    
    // Apply font directly to body element
    document.body.style.fontFamily = theme.fonts.sans;
  }

  // Update theme-specific gradients
  if (themeId === 'claude') {
    if (isDark) {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(14.7692, 63.1068%, 59.6078%) 0%, hsl(60, 2.7027%, 14.5098%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(14.7692, 63.1068%, 59.6078%) 0%, hsl(60, 3.8462%, 10.1961%) 100%)');
    } else {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(15.1111, 55.5556%, 52.3529%) 0%, hsl(46.1538, 22.8070%, 88.8235%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(15.1111, 55.5556%, 52.3529%) 0%, hsl(44.0000, 29.4118%, 90%) 100%)');
    }
  } else if (themeId === 'soft-pop') {
    if (isDark) {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(234.4538, 89.4737%, 73.9216%) 0%, hsl(0, 0%, 0%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(172.4551, 66.0079%, 50.3922%) 0%, hsl(215.2941, 24.6377%, 13.5294%) 100%)');
    } else {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(243.3962, 75.3555%, 58.6275%) 0%, hsl(173.4146, 80.3922%, 40%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(243.3962, 75.3555%, 58.6275%) 0%, hsl(37.6923, 92.1260%, 50.1961%) 100%)');
    }
  } else if (themeId === 'supabase') {
    if (isDark) {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(154.8980, 100.0000%, 19.2157%) 0%, hsl(0, 0%, 7.0588%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(141.8919, 69.1589%, 58.0392%) 0%, hsl(0, 0%, 9.0196%) 100%)');
    } else {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(151.3274, 66.8639%, 66.8627%) 0%, hsl(0, 0%, 92.9412%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(151.3274, 66.8639%, 66.8627%) 0%, hsl(0, 0%, 99.2157%) 100%)');
    }
  } else if (themeId === 'doom-64') {
    if (isDark) {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(1.3636, 77.1930%, 55.2941%) 0%, hsl(0, 0%, 10.1961%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(1.3636, 77.1930%, 55.2941%) 0%, hsl(92.0388, 47.9070%, 42.1569%) 100%)');
    } else {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(0, 73.4597%, 41.3725%) 0%, hsl(0, 0%, 80%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(0, 73.4597%, 41.3725%) 0%, hsl(82, 38.9610%, 30.1961%) 100%)');
    }
  }
  
  // Store theme preference
  localStorage.setItem('feedbacks-theme', themeId);
}

export function getCurrentTheme(): string {
  if (typeof window === 'undefined') return 'doom-64';
  return localStorage.getItem('feedbacks-theme') || 'doom-64';
}

export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  const savedTheme = getCurrentTheme();
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(savedTheme, isDark);
}