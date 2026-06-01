/**
 * @file Code.gs
 * Extreme SPA Proxy with Fetch/XHR Hijacking
 */

function authorize() {
  Logger.log("Authorized.");
}

// Robust fetch with exponential backoff
function fetchWithRetry(url, options, maxRetries) {
  var attempts = 0;
  var delay = 500; 
  
  while (attempts < maxRetries) {
    try {
      return UrlFetchApp.fetch(url, options);
    } catch (e) {
      attempts++;
      if (attempts >= maxRetries) {
        throw new Error("Target server timeout or unreachable after " + maxRetries + " attempts. (" + e.message + ")");
      }
      Utilities.sleep(delay);
      delay *= 2; 
    }
  }
}

// Handle POST requests for API Proxying
function doPost(e) {
  var proxyUrl = ScriptApp.getService().getUrl();
  
  // API Proxy Endpoint
  if (e.parameter.__api_proxy === "true" && e.parameter.target) {
    try {
      var targetUrl = decodeURIComponent(e.parameter.target);
      var method = e.parameter.method || "POST";
      var body = e.postData ? e.postData.contents : null;
      
      var customHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*"
      };

      // Try to parse headers sent from the hijacked client
      if (e.parameter.headers) {
        try {
          var parsedHeaders = JSON.parse(decodeURIComponent(e.parameter.headers));
          for (var key in parsedHeaders) {
            // Prevent overriding essential headers that break UrlFetchApp
            if (key.toLowerCase() !== "host" && key.toLowerCase() !== "origin" && key.toLowerCase() !== "referer" && key.toLowerCase() !== "content-length") {
               customHeaders[key] = parsedHeaders[key];
            }
          }
        } catch(err) {}
      }
      
      // Spoof Origin and Referer based on the target URL to bypass server-side CORS checks
      try {
        var urlObj = new URL(targetUrl);
        customHeaders["Origin"] = urlObj.origin;
        customHeaders["Referer"] = urlObj.origin + "/";
      } catch(err) {}

      var options = {
        method: method,
        headers: customHeaders,
        muteHttpExceptions: true,
        followRedirects: true
      };

      if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
        options.payload = body;
      }

      var response = UrlFetchApp.fetch(targetUrl, options);
      var responseText = response.getContentText();
      
      // Determine response type
      var responseHeaders = response.getHeaders();
      var contentType = (responseHeaders['Content-Type'] || responseHeaders['content-type'] || 'text/plain').toLowerCase();
      var mimeType = ContentService.MimeType.TEXT;
      
      if (contentType.includes('json')) mimeType = ContentService.MimeType.JSON;
      else if (contentType.includes('javascript')) mimeType = ContentService.MimeType.JAVASCRIPT;
      else if (contentType.includes('xml')) mimeType = ContentService.MimeType.XML;

      return ContentService.createTextOutput(responseText).setMimeType(mimeType);

    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput("Invalid POST request.");
}


function doGet(e) {
  var proxyUrl = ScriptApp.getService().getUrl();
  
  // API Proxy Endpoint (GET requests)
  if (e.parameter.__api_proxy === "true" && e.parameter.target) {
     try {
      var targetUrl = decodeURIComponent(e.parameter.target);
      var customHeaders = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "*/*"
      };

      if (e.parameter.headers) {
        try {
          var parsedHeaders = JSON.parse(decodeURIComponent(e.parameter.headers));
          for (var key in parsedHeaders) {
             if (key.toLowerCase() !== "host" && key.toLowerCase() !== "origin" && key.toLowerCase() !== "referer" && key.toLowerCase() !== "content-length") {
               customHeaders[key] = parsedHeaders[key];
            }
          }
        } catch(err) {}
      }
      
      try {
        var urlObj = new URL(targetUrl);
        customHeaders["Origin"] = urlObj.origin;
        customHeaders["Referer"] = urlObj.origin + "/";
      } catch(err) {}

      var response = UrlFetchApp.fetch(targetUrl, {
        method: "GET",
        headers: customHeaders,
        muteHttpExceptions: true
      });
      
      var responseHeaders = response.getHeaders();
      var contentType = (responseHeaders['Content-Type'] || responseHeaders['content-type'] || 'text/plain').toLowerCase();
      var mimeType = ContentService.MimeType.TEXT;
      if (contentType.includes('json')) mimeType = ContentService.MimeType.JSON;
      else if (contentType.includes('javascript')) mimeType = ContentService.MimeType.JAVASCRIPT;
      else if (contentType.includes('xml')) mimeType = ContentService.MimeType.XML;

      return ContentService.createTextOutput(response.getContentText()).setMimeType(mimeType);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
    }
  }


  var initialUrl = e && e.parameter && e.parameter.url ? e.parameter.url.trim() : '';

  if (!initialUrl) {
    var template = HtmlService.createTemplateFromFile('Index');
    template.isHome = true;
    template.proxyUrl = proxyUrl;
    template.targetUrl = '';
    template.b64Data = '';
    return template.evaluate()
      .setTitle('Ultra Proxy')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  if (!initialUrl.startsWith('http')) {
    initialUrl = 'https://' + initialUrl;
  }

  try {
    // Redirect Tracker
    var fetchUrl = initialUrl;
    var response;
    var maxRedirects = 5;
    
    for (var i = 0; i < maxRedirects; i++) {
      response = fetchWithRetry(fetchUrl, {
        muteHttpExceptions: true,
        followRedirects: false,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1"
        }
      }, 3); 
      
      var code = response.getResponseCode();
      if (code >= 300 && code < 400) {
        var headers = response.getHeaders();
        var loc = headers['Location'] || headers['location'];
        if (loc) {
          if (loc.startsWith('/')) {
             var baseMatch = fetchUrl.match(/^(https?:\/\/[^\/]+)/i);
             loc = (baseMatch ? baseMatch[1] : fetchUrl) + loc;
          } else if (!loc.startsWith('http')) {
             loc = fetchUrl.substring(0, fetchUrl.lastIndexOf('/') + 1) + loc;
          }
          fetchUrl = loc;
        } else break;
      } else break;
    }

    var contentType = (response.getHeaders()['Content-Type'] || response.getHeaders()['content-type'] || '').toLowerCase();
    
    if (contentType.includes('text/html')) {
      var html = response.getContentText();
      
      // Strip CSP tags
      var cspLower = html.toLowerCase();
      var cspIdx = cspLower.indexOf('content-security-policy');
      if (cspIdx !== -1) {
        var metaStart = html.lastIndexOf('<meta', cspIdx);
        var metaEnd = html.indexOf('>', cspIdx);
        if (metaStart !== -1 && metaEnd !== -1 && metaStart < cspIdx) {
          html = html.substring(0, metaStart) + html.substring(metaEnd + 1);
        }
      }
      
      // FETCH/XHR HIJACKER AND DOM REWRITER
      var hydrator = '<base href="' + fetchUrl + '"><script>(' + function() {
        var P = "___PROXY___";
        var B = "___BASE___";
        
        // 1. Resolve relative URLs to absolute URLs
        function makeAbs(u) {
          if (!u || u.startsWith('data:') || u.startsWith('blob:') || u.startsWith('javascript:')) return u;
          if (u.startsWith('http://') || u.startsWith('https://')) return u;
          if (u.startsWith('//')) return "https:" + u;
          try { return new URL(u, B).href; } catch(e) { return u; }
        }

        // 2. Fetch API Override
        var originalFetch = window.fetch;
        window.fetch = async function() {
          var args = Array.prototype.slice.call(arguments);
          var url = args[0];
          var options = args[1] || {};
          
          if (typeof url === 'string') {
            url = makeAbs(url);
            // Route through proxy if it's an HTTP request
            if (url.startsWith('http')) {
               var method = options.method || 'GET';
               var headersStr = options.headers ? encodeURIComponent(JSON.stringify(options.headers)) : "";
               var proxyEndpoint = P + "?__api_proxy=true&target=" + encodeURIComponent(url) + "&method=" + method + "&headers=" + headersStr;
               
               if (method.toUpperCase() === 'GET') {
                 args[0] = proxyEndpoint;
               } else {
                 // For POST/PUT, we must send it to the Proxy's doPost via fetch
                 args[0] = proxyEndpoint;
               }
            }
          } else if (url instanceof Request) {
             // Handle Request objects (complex) - simplified fallback
             var reqUrl = makeAbs(url.url);
             if (reqUrl.startsWith('http')) {
                var method = url.method || 'GET';
                args[0] = P + "?__api_proxy=true&target=" + encodeURIComponent(reqUrl) + "&method=" + method;
             }
          }
          return originalFetch.apply(this, args);
        };

        // 3. XMLHttpRequest Override
        var originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
          var xhr = new originalXHR();
          var originalOpen = xhr.open;
          
          xhr.open = function(method, url, async, user, password) {
             var absUrl = makeAbs(url);
             if (typeof absUrl === 'string' && absUrl.startsWith('http')) {
                // Route through proxy
                var proxyEndpoint = P + "?__api_proxy=true&target=" + encodeURIComponent(absUrl) + "&method=" + method;
                arguments[1] = proxyEndpoint;
                // Note: XHR headers are hard to proxy perfectly without complex interceptors, 
                // but this intercepts the core URL routing.
             }
             return originalOpen.apply(this, arguments);
          };
          return xhr;
        };

        // 4. Proactive DOM Rewriter
        function R() {
          try {
            document.querySelectorAll("a").forEach(function(a) {
              if (a.__px) return;
              var h = a.getAttribute("href");
              if (h && !h.startsWith("#") && !h.startsWith("javascript:") && !h.startsWith("data:") && !h.startsWith("mailto:") && !h.startsWith("tel:")) {
                a.href = P + "?url=" + encodeURIComponent(a.href);
                a.target = "_parent"; 
                a.__px = true;
              }
            });
          } catch(e) {}
        }
        
        R();
        document.addEventListener("DOMContentLoaded", R);
        setInterval(R, 800); 
        
        document.addEventListener("submit", function(e) {
          try {
            e.preventDefault();
            e.stopPropagation();
            var t = e.target.action || document.baseURI;
            if (e.target.method && e.target.method.toLowerCase() === 'get') {
              var u = new URL(t);
              var fd = new FormData(e.target);
              for (var p of fd.entries()) u.searchParams.append(p[0], p[1]);
              t = u.toString();
            }
            window.parent.location.href = P + "?url=" + encodeURIComponent(t);
          } catch(err) {}
        }, true);
        
      }.toString().replace("___PROXY___", proxyUrl).replace("___BASE___", fetchUrl) + ')();</script>';
      
      var headIdx = html.toLowerCase().indexOf('<head>');
      if (headIdx !== -1) {
        var insertPos = headIdx + 6;
        html = html.substring(0, insertPos) + hydrator + html.substring(insertPos);
      } else {
        html = hydrator + html;
      }

      var b64Content = Utilities.base64Encode(html, Utilities.Charset.UTF_8);
      
      var template = HtmlService.createTemplateFromFile('Index');
      template.isHome = false;
      template.proxyUrl = proxyUrl;
      template.targetUrl = fetchUrl;
      template.b64Data = b64Content;
      
      return template.evaluate()
        .setTitle('Browsing: ' + fetchUrl)
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    } else {
      var mimeType = ContentService.MimeType.TEXT;
      if (contentType.includes('javascript')) mimeType = ContentService.MimeType.JAVASCRIPT;
      else if (contentType.includes('json')) mimeType = ContentService.MimeType.JSON;
      else if (contentType.includes('xml')) mimeType = ContentService.MimeType.XML;
      else if (contentType.includes('csv')) mimeType = ContentService.MimeType.CSV;
      return ContentService.createTextOutput(response.getContentText()).setMimeType(mimeType);
    }
  } catch (err) {
    var errorUI = '<div style="font-family:sans-serif; text-align:center; padding:50px;">';
    errorUI += '<h1 style="color:#d93025;">Proxy Overload Error</h1>';
    errorUI += '<p style="font-size:16px; color:#5f6368; max-width:600px; margin:0 auto;">The target website is too heavy or refused to respond in time.</p>';
    errorUI += '<pre style="background:#f1f3f4; padding:15px; border-radius:8px; margin-top:20px; text-align:left; overflow-x:auto;">' + err.toString() + '</pre>';
    errorUI += '<button onclick="window.history.back()" style="margin-top:20px; padding:10px 20px; background:#1a73e8; color:white; border:none; border-radius:4px; cursor:pointer;">Go Back</button>';
    errorUI += '</div>';
    return HtmlService.createHtmlOutput(errorUI);
  }
}