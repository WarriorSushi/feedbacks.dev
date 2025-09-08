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