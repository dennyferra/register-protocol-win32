# register-protocol-win32

Register a custom protocol (ie. myapp://) on Windows.

Install
-------

Install via npm

        npm install register-protocol-win32

Documentation
-------------

* `install(protocol, command, options)` (promise) - Creates a new, or updates if existing, protocol in the Windows registry. Returns a promise.

	`protocol` (string required) - The name of the protocol you want to register, example: *myapp*
	`command` (string required) - The command that will be executed when your protocol is run, example: *"C:\\Program Files\\myapp.exe" "%1" "%2"*
	`options` (object optional)
		{
			`allUsers` (boolean) - Creates protocol in HKEY_LOCAL_MACHINE **requires administrator privileges** otherwise creates in HKEY_CURRENT_USER
			`icon` (string) - The path to the icon, example: *C:\\Program Files\\myapp.exe,1*
		}

* `uninstall(protocol, options)` (promise) - Removes the specified protocol from the Windows registry. Returns a promise.

	`protocol` (string required) - The name of the protocol to remove, example: *myapp*
	`options` (object optional)
		{
			`allUsers` (boolean) - Removes protocol from HKEY_LOCAL_MACHINE **requires administrator privileges** otherwise removes from HKEY_CURRENT_USER
		}

Tests
-----

Run via npm

		npm test

Attribution
-----------

This library is based in part by work done on [WebTorrent Desktop](https://github.com/feross/webtorrent-desktop) by [Feross Aboukhadijeh](http://feross.org/).

License
-------

MIT. Copyright (c) [Denny Ferrassoli](http://www.dennyferra.com)