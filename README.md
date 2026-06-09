<p align="center">
  <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/googlechrome.svg" width="120" height="120" />
</p>

<h1 align="center">Google Semi-Browser</h1>

<p align="center">
  <strong>A high-performance, SPA-compatible web proxy built on Google Apps Script.</strong>
</p>

---

**Google Semi-Browser** leverages the power of Google's infrastructure to bypass CORS restrictions, spoof headers, and provide a seamless browsing experience through a familiar Chrome-like interface.

## 🚀 Features

- **Extreme SPA Proxying**: Advanced hijacking of `fetch` and `XMLHttpRequest` (XHR) to route API requests through the proxy automatically.
- **CORS Bypass**: Seamlessly access resources that are otherwise blocked by Cross-Origin Resource Sharing policies.
- **Chrome-Inspired UI**: A professional web interface that mimics the look and feel of the Chrome browser, complete with a functional address bar, navigation controls, and tabs.
- **Robust Networking**: Built-in exponential backoff for retrying failed requests and handling server timeouts.
- **Dynamic DOM Rewriting**: Proactively rewrites links, forms, and other navigation elements to ensure the browsing session stays within the proxy.
- **Header Spoofing**: Automatically spoof `Origin`, `Referer`, and `User-Agent` headers to bypass server-side security checks.
- **Lightweight & Serverless**: Runs entirely on Google Apps Script—no external servers or maintenance required.

## 🛠️ Technology Stack

- **Backend**: Google Apps Script (JavaScript/V8)
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript
- **API Interception**: Client-side `fetch`/`XHR` monkey-patching
- **Deployment**: Google Apps Script Web App

## 📦 Installation & Setup

1. **Create a new Google Apps Script project**:
   - Go to [script.google.com](https://script.google.com).
   - Create a new project.
2. **Copy the code**:
   - Copy the contents of `Code.gs` into the script editor's `Code.gs` file.
   - Create a new HTML file named `Index.html` and paste the contents of `Index.html`.
3. **Deploy as a Web App**:
   - Click **Deploy** > **New deployment**.
   - Select **Web app**.
   - Set **Execute as** to `Me`.
   - Set **Who has access** to `Anyone`.
   - Copy the **Web App URL**.
4. **Authorize**:
   - Run the `authorize` function in `Code.gs` once to grant the necessary permissions for `UrlFetchApp`.

## 📖 Usage

Once deployed, simply navigate to your Web App URL. You can:
- Use the Google-style search box to search or enter a URL.
- Use the address bar to navigate directly to any website.
- Experience modern SPAs with full API support through the integrated proxy logic.

## ⚠️ Limitations

- **Content Security Policy (CSP)**: While the proxy attempts to strip CSP tags, some highly secure sites may still experience loading issues.
- **Complex WebSockets**: WebSockets are not supported by the Google Apps Script `UrlFetchApp` infrastructure.
- **Large Payloads**: Google Apps Script has limits on the size of requests and responses (typically 50MB).

## 🛡️ License

This project is open-source and available under the MIT License.
