# RotMG Stash

[![build and publish](https://github.com/link3337/rotmg-stash/actions/workflows/build-and-publish.yml/badge.svg?branch=release)](https://github.com/link3337/rotmg-stash/actions/workflows/build-and-publish.yml)

A desktop application built with Tauri, React, and TypeScript for checking your Realm of the Mad God accounts and items.

## ✨ Features

- 🔒 Secure account management with encrypted storage
- 📊 character/vault item tracking
- 🔍 Item Search
- 🔄 Automatic account refresh queue
- 🎭 Streamer mode for privacy and e-mail masking
- 🎮 Launching Exalt

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

To use RotMG Stash with the game client, you'll need to generate a device token. This is similar to Unity's [Device Unique Identifier](https://docs.unity3d.com/6000.0/Documentation/ScriptReference/SystemInfo-deviceUniqueIdentifier.html).

1. Get the PowerShell script:
   - Download `generate-device-token.ps1` from the `scripts` folder, or
   - Copy the script content

2. Run the script:

   ```powershell
   .\generate-device-token.ps1
   ```

   or copy paste the content into Powershell

3. Configure RotMG Stash:
   - Copy the generated device token
   - Open Settings > Experimental
   - Paste the token into the Device Token field
   - Set your Exalt path

> **Note**: The device token is uniquely generated from your hardware information (Win32_BaseBoard, Win32_BIOS, and Win32_OperatingSystem SerialNumbers).

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
