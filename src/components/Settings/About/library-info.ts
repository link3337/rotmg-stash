interface Library {
  name: string;
  version: string;
  icon?: string;
}

export const libraries: Library[] = [
  {
    name: 'Vite',
    version: '5.4.11',
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: '2.1.1',
    icon: 'tauri'
  },
  {
    name: 'React',
    version: '18.3.1',
    icon: 'react'
  },
  {
    name: 'Redux',
    version: '2.5.1',
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: '10.9.2',
    icon: 'primereact'
  }
];
