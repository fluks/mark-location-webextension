js := \
	content_scripts/location.js \
	background/*.js \
	browser_action/*.js \
	settings/*.js
locale_files := $(shell find _locales -type f)
common_files := \
	$(locale_files) \
	l10n/* \
	manifest.json \
	background/* \
	browser_action/* \
	content_scripts/location.js \
	settings/*
firefox_files := \
	$(common_files) \
	icons/*.svg
chromium_files := \
	$(common_files) \
	icons/*.png

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint doc

run:
	/home/jukka/Downloads/firefox_dev/firefox --debug https://www.wikipedia.org

firefox: change_to_firefox
	zip -r mark_location_firefox.xpi $(firefox_files)

chromium: change_to_chromium
	zip mark_location_chromium.zip $(chromium_files)

change_to_firefox:
	cp firefox/manifest.json .

change_to_chromium:
	cp chromium/manifest.json .

lint:
	eslint --env es6 $(js)

doc:
	jsdoc -c conf.json -d doc $(js)

clean:
	rm mark_location_firefox.xpi manifest.json
