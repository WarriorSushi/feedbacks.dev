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
        '--sidebar-ring': '0 0% 70.9804%'
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
        '--sidebar-ring': '0 0% 70.9804%'
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
      accent: '#F59E0B',
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
        '--accent': '37.6923 92.1260% 50.1961%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '0 0% 0%',
        '--input': '0 0% 45.0980%',
        '--ring': '229.6552 93.5484% 81.7647%',
        '--chart-1': '243.3962 75.3555% 58.6275%',
        '--chart-2': '173.4146 80.3922% 40%',
        '--chart-3': '37.6923 92.1260% 50.1961%',
        '--chart-4': '330.3659 81.1881% 60.3922%',
        '--chart-5': '142.0859 70.5628% 45.2941%',
        '--sidebar': '80.0000 33.3333% 96.4706%',
        '--sidebar-foreground': '0 0% 0%',
        '--sidebar-primary': '243.3962 75.3555% 58.6275%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '37.6923 92.1260% 50.1961%',
        '--sidebar-accent-foreground': '0 0% 0%',
        '--sidebar-border': '0 0% 0%',
        '--sidebar-ring': '229.6552 93.5484% 81.7647%'
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
        '--accent': '45.9429 96.6851% 64.5098%',
        '--accent-foreground': '0 0% 0%',
        '--destructive': '0 90.6040% 70.7843%',
        '--destructive-foreground': '0 0% 0%',
        '--border': '0 0% 32.9412%',
        '--input': '0 0% 100%',
        '--ring': '234.4538 89.4737% 73.9216%',
        '--chart-1': '234.4538 89.4737% 73.9216%',
        '--chart-2': '172.4551 66.0079% 50.3922%',
        '--chart-3': '45.9429 96.6851% 64.5098%',
        '--chart-4': '328.6154 85.5263% 70.1961%',
        '--chart-5': '141.8919 69.1589% 58.0392%',
        '--sidebar': '0 0% 0%',
        '--sidebar-foreground': '0 0% 100%',
        '--sidebar-primary': '234.4538 89.4737% 73.9216%',
        '--sidebar-primary-foreground': '0 0% 0%',
        '--sidebar-accent': '45.9429 96.6851% 64.5098%',
        '--sidebar-accent-foreground': '0 0% 0%',
        '--sidebar-border': '0 0% 100%',
        '--sidebar-ring': '234.4538 89.4737% 73.9216%'
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
        '--sidebar-ring': '151.3274 66.8639% 66.8627%'
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
        '--sidebar-ring': '141.8919 69.1589% 58.0392%'
      }
    }
  },
  {
    id: 'claymorphism',
    name: 'Claymorphism',
    description: 'Soft clay textures with purple accents',
    preview: {
      primary: '#6366F1',
      secondary: '#F3F4F6',
      accent: '#F0E6FF',
      background: '#F5F5F0'
    },
    fonts: {
      sans: 'Plus Jakarta Sans, sans-serif',
      serif: 'Lora, serif',
      mono: 'Roboto Mono, monospace'
    },
    css: {
      light: {
        '--background': '20 5.8824% 90%',
        '--foreground': '217.2414 32.5843% 17.4510%',
        '--card': '60 4.7619% 95.8824%',
        '--card-foreground': '217.2414 32.5843% 17.4510%',
        '--popover': '60 4.7619% 95.8824%',
        '--popover-foreground': '217.2414 32.5843% 17.4510%',
        '--primary': '238.7324 83.5294% 66.6667%',
        '--primary-foreground': '0 0% 100%',
        '--secondary': '24.0000 5.7471% 82.9412%',
        '--secondary-foreground': '215 13.7931% 34.1176%',
        '--muted': '20 5.8824% 90%',
        '--muted-foreground': '220 8.9362% 46.0784%',
        '--accent': '292.5000 44.4444% 92.9412%',
        '--accent-foreground': '216.9231 19.1176% 26.6667%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '0 0% 100%',
        '--border': '24.0000 5.7471% 82.9412%',
        '--input': '24.0000 5.7471% 82.9412%',
        '--ring': '238.7324 83.5294% 66.6667%',
        '--chart-1': '238.7324 83.5294% 66.6667%',
        '--chart-2': '243.3962 75.3555% 58.6275%',
        '--chart-3': '244.5205 57.9365% 50.5882%',
        '--chart-4': '243.6522 54.5024% 41.3725%',
        '--chart-5': '242.1687 47.4286% 34.3137%',
        '--sidebar': '24.0000 5.7471% 82.9412%',
        '--sidebar-foreground': '217.2414 32.5843% 17.4510%',
        '--sidebar-primary': '238.7324 83.5294% 66.6667%',
        '--sidebar-primary-foreground': '0 0% 100%',
        '--sidebar-accent': '292.5000 44.4444% 92.9412%',
        '--sidebar-accent-foreground': '216.9231 19.1176% 26.6667%',
        '--sidebar-border': '24.0000 5.7471% 82.9412%',
        '--sidebar-ring': '238.7324 83.5294% 66.6667%',
        '--radius': '1.25rem'
      },
      dark: {
        '--background': '30 11.1111% 10.5882%',
        '--foreground': '214.2857 31.8182% 91.3725%',
        '--card': '25.7143 8.6420% 15.8824%',
        '--card-foreground': '214.2857 31.8182% 91.3725%',
        '--popover': '25.7143 8.6420% 15.8824%',
        '--popover-foreground': '214.2857 31.8182% 91.3725%',
        '--primary': '234.4538 89.4737% 73.9216%',
        '--primary-foreground': '30 11.1111% 10.5882%',
        '--secondary': '25.7143 6.4220% 21.3725%',
        '--secondary-foreground': '216.0000 12.1951% 83.9216%',
        '--muted': '25.7143 8.6420% 15.8824%',
        '--muted-foreground': '217.8947 10.6145% 64.9020%',
        '--accent': '25.7143 5.1095% 26.8627%',
        '--accent-foreground': '216.0000 12.1951% 83.9216%',
        '--destructive': '0 84.2365% 60.1961%',
        '--destructive-foreground': '30 11.1111% 10.5882%',
        '--border': '25.7143 6.4220% 21.3725%',
        '--input': '25.7143 6.4220% 21.3725%',
        '--ring': '234.4538 89.4737% 73.9216%',
        '--chart-1': '234.4538 89.4737% 73.9216%',
        '--chart-2': '238.7324 83.5294% 66.6667%',
        '--chart-3': '243.3962 75.3555% 58.6275%',
        '--chart-4': '244.5205 57.9365% 50.5882%',
        '--chart-5': '243.6522 54.5024% 41.3725%',
        '--sidebar': '25.7143 6.4220% 21.3725%',
        '--sidebar-foreground': '214.2857 31.8182% 91.3725%',
        '--sidebar-primary': '234.4538 89.4737% 73.9216%',
        '--sidebar-primary-foreground': '30 11.1111% 10.5882%',
        '--sidebar-accent': '25.7143 5.1095% 26.8627%',
        '--sidebar-accent-foreground': '216.0000 12.1951% 83.9216%',
        '--sidebar-border': '25.7143 6.4220% 21.3725%',
        '--sidebar-ring': '234.4538 89.4737% 73.9216%',
        '--radius': '1.25rem'
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
  } else if (themeId === 'claymorphism') {
    if (isDark) {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(234.4538, 89.4737%, 73.9216%) 0%, hsl(30, 11.1111%, 10.5882%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(234.4538, 89.4737%, 73.9216%) 0%, hsl(25.7143, 8.6420%, 15.8824%) 100%)');
    } else {
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(238.7324, 83.5294%, 66.6667%) 0%, hsl(20, 5.8824%, 90%) 100%)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, hsl(238.7324, 83.5294%, 66.6667%) 0%, hsl(292.5000, 44.4444%, 92.9412%) 100%)');
    }
  }
  
  // Store theme preference
  localStorage.setItem('feedbacks-theme', themeId);
}

export function getCurrentTheme(): string {
  if (typeof window === 'undefined') return 'claude';
  return localStorage.getItem('feedbacks-theme') || 'claude';
}

export function initializeTheme() {
  if (typeof window === 'undefined') return;
  
  const savedTheme = getCurrentTheme();
  const isDark = document.documentElement.classList.contains('dark');
  applyTheme(savedTheme, isDark);
}