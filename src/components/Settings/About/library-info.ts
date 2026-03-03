interface Library {
  name: string;
  version: string;
  icon?: string;
}

export const libraries: Library[] = [
  {
    name: 'Vite',
    version: '7.3.1',
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: '2.10.1',
    icon: 'tauri'
  },
  {
    name: 'React',
    version: '19.2.0',
    icon: 'react'
  },
  {
    name: 'Redux',
    version: '2.11.0',
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: '10.9.6',
    icon: 'primereact'
  }
];
