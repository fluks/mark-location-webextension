dirs := content_scripts icons
js := content_scripts/location.js

.PHONY: firefox clean change_to_firefox change_to_chromium lint doc

firefox: change_to_firefox
	zip -r mark_location_firefox.xpi $(dirs) manifest.json

change_to_firefox:
	cp firefox/manifest.json .

change_to_chromium:
	cp chromium/manifest.json .

lint:
	eslint --env es6 $(js)

doc:
	jsdoc -c conf.json $(js)

clean:
	rm mark_location_firefox.xpi manifest.json
