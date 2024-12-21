# apricot

# TODO
- add saving to settings page
- page of completed goals
- save data if program crashes

# Setup

This setup has only been tested on Windows 11.

1. Install Deno v2.1.4 for Windows
Install Deno from [the website](https://deno.com/)

2. Run the install script in Command Prompt
```
.\init.bat
```
or:
```
.\init.sh
```

This script will install the global Deno command `apricot`.

## 3. Install Chocolatey and Ngrok

This step can be skipped if you are using a server.

### Make a Ngrok account

Make a Ngrok account at [the website](https://ngrok.com).

Run this command using the authtoken found at [this link](https://dashboard.ngrok.com/get-started/your-authtoken).

```
ngrok config add-authtoken <token>
```