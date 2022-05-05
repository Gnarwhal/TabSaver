# Tab Saver

### Version Info

Latest Version: [v0.0.1-alpha](https://github.com/Gnarwhal/TabSaver/raw/mia/tab_saver-v0.0.1-alpha.xpi)

### Installation

Once you've downloaded the [latest xpi file](https://github.com/Gnarwhal/TabSaver/raw/mia/tab_saver-v0.0.1-alpha.xpi),
just drag it into your firefox and firefox will recognize it as an extension. Accept all the permissions and firefox will install the addon. 

### Summary

At it's core the aptly named "Tab Saver" is just that. A tab saver. During the duration of a windows life it tracks
the state of your tabs ~~and sells it to google~~. Then, upon the merciless execution of said window
that tab data gets saved and can be restored at a later date. 

## Next Steps

1. Testing. Lots of testing. \*closes book\* Like that's ever gonna happen.
2. Add more features
3. Rinse and repeat

### Feature Ideas

I have a nasty tendency to write these and then never act on them. So...don't get your hopes up. 

- Snapshotting current state
- Living window management
- Keyboard shortcuts <- BIG yes please
- Theming
- Sync vs local storage
- Incremental Loading(? idk what to call it) 

I would take feature requests, but I'm the only user lol (BUT if you want to request features, PLEASE DO!).

## Release Steps (For Personal Use)

### Pre Release

1. Update the version numbers in background.js and manifest.json
2. Remove the `-dev` postfix from the extension id and icon path in manifest.json
	- NOTE: Not necessary to update the logo since it's use case does not cause confusion
3. Create the xpi file
```
///// FILES TO INCLUDE /////
- background/
- icons/
- popup/
- LICENSE
- manifest.json
```
4. Upload the xpi file as a new version on mozilla addons
5. Download the signed xpi file
6. Rename the xpi file: `tab_saver-$version.xpi`
7. Update the download links and version number in the README.md
8. Commit and push the new release
9. Create the release on github

### Post Release

1. Readd the `-dev` postfix to the extension id and icon path in manifest.json
2. Remove the created .xpi file leaving only the signed one
