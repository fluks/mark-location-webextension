dirs := content_scripts icons

.PHONY: firefox clean

firefox:
	cp firefox/manifest.json .
	zip -r mark_location_firefox.xpi $(dirs) manifest.json
	rm manifest.json

clean:
	rm mark_location_firefox.xpi
