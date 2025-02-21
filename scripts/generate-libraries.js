import fs from 'fs';
import path from 'path';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const libraries = [
  {
    name: 'Vite',
    version: packageJson.devDependencies['vite'].replace('^', ''),
    icon: 'vite'
  },
  {
    name: 'Tauri',
    version: packageJson.dependencies['@tauri-apps/api'].replace('^', ''),
    icon: 'tauri'
  },
  {
    name: 'React',
    version: packageJson.dependencies['react'].replace('^', ''),
    icon: 'react'
  },
  {
    name: 'Redux',
    version: packageJson.dependencies['@reduxjs/toolkit'].replace('^', ''),
    icon: 'redux'
  },
  {
    name: 'PrimeReact',
    version: packageJson.dependencies['primereact'].replace('^', ''),
    icon: 'primereact'
  }
];

// replace json array in library-info.ts
const librariesPath = path.join('src', 'components', 'Settings', 'About', 'library-info.ts');

const libraryInfoContent = `interface Library {
  name: string;
  version: string;
  icon?: string;
}
  
export const libraries: Library[] = ${JSON.stringify(libraries, null, 2)};`;

// Write back to file
fs.writeFileSync(librariesPath, libraryInfoContent);
