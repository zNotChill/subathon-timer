# apricot

# TODO
<!-- - set up eventsub -->
<!-- - add configs -->
- add commands
- web views (timer + counter)
<!-- - track donations and channel events (bits, raids,) -->

# Setup

This setup has only been tested on Windows 11.

1. Install Deno v2.1.4 for Windows
Install Deno from [the website](https://deno.com/) or use this command in PowerShell:

```
irm https://deno.land/install.ps1 | iex
```

2. Run the install script in Command Prompt
```
.\init.bat
```

This script will install the global Deno command `apricot`.

## 3. Install Chocolatey and Ngrok

This step can be skipped if you are using a server.
This step uses Command Prompt.

### Install Chocolatey
```
.\choco.bat
```

### Install Ngrok
```
choco install ngrok
```

### Make a Ngrok account

Make a Ngrok account at [the website](https://ngrok.com).

Run this command using the authtoken found at [this link](https://dashboard.ngrok.com/get-started/your-authtoken).

```
ngrok config add-authtoken <token>
```