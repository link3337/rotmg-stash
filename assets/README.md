# Asset Caching

## Hosted and Cached Files

The following assets are hosted and cached to ensure a seamless user experience with fast, reliable, and up-to-date resources:

- **`renders.png`**: The main sprite sheet containing all regular item images.
- **`renders-april-fools.png`**: Sprite sheet containing April Fools item variants.
- **`items.json`**: JSON data containing properties of RotMG items.
- **`april-fools-items.json`**: JSON data for April Fools item variants.

## Service Worker Responsibilities

The service worker (`service-worker.js`) handles the following tasks:

1. **Caching Assets on Install**:
   - Ensures all required assets are cached during the installation phase.
2. **Serving Cached Versions**:
   - Provides cached assets immediately for fast loading, even on slow connections.
3. **Background Updates**:
   - Checks for updated versions of assets in the background and refreshes the cache.
4. **Cache Cleanup**:
   - Removes old cache versions to free up storage and ensure only the latest assets are used.

## Benefits of This Setup

- **Fast Loading**: Assets are served from the cache, ensuring quick load times.
- **Offline Support**: Cached assets allow the application to function even without an internet connection.
- **Automatic Updates**: New versions of assets are automatically fetched and cached in the background.

## Hosting Information

The assets are publicly available and currently hosted on a free Cloudflare "Workers & Pages" deployment.
