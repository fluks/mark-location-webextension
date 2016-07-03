dirs := content_scripts icons

.PHONY: firefox clean change_to_firefox change_to_chromium

firefox: change_to_firefox
	cp firefox/manifest.json .
	zip -r mark_location_firefox.xpi $(dirs) manifest.json
	rm manifest.json

change_to_firefox:
	sed -i 's/isFirefox = .*;/isFirefox = true;/' content_scripts/location.js

change_to_chromium:
	sed -i 's/isFirefox = .*;/isFirefox = false;/' content_scripts/location.js

clean:
	rm mark_location_firefox.xpi
