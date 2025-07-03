# DockerTokenViewer

DockerTokenViewer is an alternative to the DockerHub frontend, designed to allow users to view images and their respective tags associated with a profile or organization using an access token.

**Key Features**

- Access with Docker Tokens: Use Docker CLI tokens (commonly used for pull and push operations) to query repositories and view image tags.
- Read-Only Interface: Tokens cannot be used to log into the DockerHub website, but they work seamlessly with this tool to retrieve repository information.
- Utility: Ideal for scenarios where you need to inspect tags of a specific repository without full access to DockerHub’s GUI.

**Technical Details**

- Official DockerHub API: Interacts with the official DockerHub API to fetch and display data.
- Built With:
  - **Express**: Backend framework for handling requests.
  - **Cors Anywhere**: Enables the tool to bypass CORS restrictions.
  - **Svelte & Sveltestrap**: Frontend built with Svelte and styled using Sveltestrap for a responsive and clean interface.

![screenshot](./screenshot.gif)

# 🐳 Docker

```
docker run -d -p 3000:3000 --name dockertokenviewer borrageiros/docker-token-viewer:latest
```
