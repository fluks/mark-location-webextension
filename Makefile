dirs := content_scripts icons
js := content_scripts/location.js

.PHONY: firefox clean change_to_firefox change_to_chromium doc

firefox: change_to_firefox
	cp firefox/manifest.json .
	zip -r mark_location_firefox.xpi $(dirs) manifest.json
	rm manifest.json

change_to_firefox:
	sed -i 's/isFirefox = .*;/isFirefox = true;/' content_scripts/location.js

change_to_chromium:
	sed -i 's/isFirefox = .*;/isFirefox = false;/' content_scripts/location.js

doc:
	jsdoc -c conf.json $(js)

clean:
	rm mark_location_firefox.xpi
