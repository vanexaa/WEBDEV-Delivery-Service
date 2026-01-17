# How to Run the Login Page

## Step 1: Start the UnifiedService Backend

Open a terminal/PowerShell and run:

```bash
  
dotnet run
```  

The service will start on `http://localhost:5000`

Wait until you see:
```
Now listening on: http://localhost:5000
```

## Step 2: Open the Login Page

You have two options:

### Option A: Open directly in browser
1. Navigate to: `Frontend\login-test.html`
2. Right-click the file
3. Select "Open with" → Choose your browser (Chrome, Edge, Firefox, etc.)

### Option B: Use a simple HTTP server (Recommended)

**Using Python (if installed):**
```bash
cd Frontend
python -m http.server 8080
```
Then open: `http://localhost:8080/login-test.html`

**Using Node.js (if installed):**
```bash
cd Frontend
npx http-server -p 8080
```
Then open: `http://localhost:8080/login-test.html`

**Using PowerShell (Windows):**
```powershell
cd Frontend
# Start a simple HTTP server
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running at http://localhost:8080/"
Write-Host "Open http://localhost:8080/login-test.html in your browser"
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/login-test.html" }
    $filePath = Join-Path $PWD $localPath.TrimStart('/')
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
    }
    $response.Close()
}
```

## Step 3: Test Login

Use these test credentials:

- **Admin:** `admin` / `password123`
- **Rider:** `rider1` / `password123`
- **Customer:** `customer1` / `password123`

After successful login, you'll be redirected to:
- Admin → `http://localhost:3003`
- Rider → `http://localhost:3001`
- Customer → `http://localhost:3002`

## Troubleshooting

1. **Backend not running?**
   - Make sure UnifiedService is running on port 5000
   - Check: `http://localhost:5000/swagger` should show the API documentation

2. **CORS errors?**
   - The UnifiedService has CORS enabled, but if you open the HTML file directly (file://), some browsers may block requests
   - Use Option B (HTTP server) instead

3. **Login fails?**
   - Check browser console (F12) for errors
   - Verify backend is running: `http://localhost:5000/api/auth/login`
   - Make sure databases are initialized (UnifiedService does this automatically on startup)
