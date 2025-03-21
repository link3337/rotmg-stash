interface Library {
  name: string;
  version: string;
  icon?: string;
}

export const libraries: Library[] = [
  {
    name: 'Vite',
    version: '6.2.2',
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: '2.4.0',
    icon: 'tauri'
  },
  {
    name: 'React',
    version: '19.0.0',
    icon: 'react'
  },
  {
    name: 'Redux',
    version: '2.6.1',
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: '10.9.3',
    icon: 'primereact'
  }
];
