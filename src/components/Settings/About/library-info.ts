interface Library {
  name: string;
  version: string;
  icon?: string;
}

export const libraries: Library[] = [
  {
    name: 'Vite',
    version: '8.4.0',
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: '2.12.5',
    icon: 'tauri'
  },
  {
    name: 'React',
    version: '~19.3.0',
    icon: 'react'
  },
  {
    name: 'Redux',
    version: '~2.15.0',
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: '~10.9.9',
    icon: 'primereact'
  }
];
