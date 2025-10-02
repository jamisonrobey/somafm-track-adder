# Privacy Policy

## Data Handling

- This extension does not collect, store, or transmit any personal user data to any external server.
- Authentication tokens (`access_token`, `refresh_token`) provided by the Spotify API are the only data handled.
- These tokens are stored exclusively on the user's local device using the [browser.storage](https://developer.chrome.com/docs/extensions/reference/api/storage) API.

## Permissions and Justification

- **`identity`**: Required to initiate the Spotify OAuth 2.0 authentication flow. The extension does not see or handle user credentials.
- **`storage`**: Required to locally persist the authentication tokens to avoid repeated logins.

## Network Communication

- All network communication occurs directly between the user's browser and official Spotify API endpoints.

## Contact

- For questions, open an issue on the project's GitHub repository.
