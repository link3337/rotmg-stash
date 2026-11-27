# RotMG Stash

[![build and publish](https://github.com/link3337/rotmg-stash/actions/workflows/build-and-publish.yml/badge.svg?branch=release)](https://github.com/link3337/rotmg-stash/actions/workflows/build-and-publish.yml)

A desktop application built with Tauri, React, and TypeScript for checking your Realm of the Mad God accounts and items.

## ✨ Features

- 🔒 Secure account management with encrypted storage
- 📊 character/vault item tracking
- 🔍 Item Search
- 🔄 Automatic account refresh queue
- 🎭 Streamer mode for privacy and e-mail masking
- 🎮 ~~Launching Exalt~~ (temporarily disabled, see [Launching Exalt](#launching-exalt))

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://www.rust-lang.org/tools/install)
- [VS Code](https://code.visualstudio.com/) (recommended)

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/link3337/rotmg-stash.git
cd rotmg-stash
```

2. Install dependencies:

```bash
npm install
```

3. Rename `.env.example` to `.env`:

```bash
mv .env.example .env
```

4. Start the development server:

```bash
npm run tauri dev
```

### Launching Exalt

> **⚠️ Temporarily disabled**: DECA has updated its policy, and launching the game separately without the official launcher is now forbidden. The **Launch Exalt** feature and the Device Token setting have been removed from the app until further notice. Please start the game through the official launcher.

The **Exalt Path** setting (Settings > Experimental) is still available, as it is used to extract game assets.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, PrimeReact
- **Backend**: Rust, Tauri
- **State Management**: Redux Toolkit
- **Styling**: SCSS
- **Build Tool**: Vite

## 🔧 Configuration

The application can be configured through the settings menu, including:

- Display preferences
- Privacy settings
- Queue refresh intervals
- Experimental features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔐 Security

All sensitive data is encrypted locally using industry-standard encryption.

## 🙋‍♂️ Support

If you encounter any issues or have questions, please [open an issue](https://github.com/link3337/rotmg-stash/issues).

---

Built with ❤️ by link3337
