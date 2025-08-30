interface Library {
  name: string;
  version: string;
  icon?: string;
}

export const libraries: Library[] = [
  {
    name: 'Vite',
    version: '7.1.3',
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: '2.8.0',
    icon: 'tauri'
  },
  {
    name: 'React',
    version: '19.1.0',
    icon: 'react'
  },
  {
    name: 'Redux',
    version: '2.8.2',
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: '10.9.6',
    icon: 'primereact'
  }
];
