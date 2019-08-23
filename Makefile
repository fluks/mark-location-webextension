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
	firefox/*.svg
chromium_files := \
	$(common_files) \
	chromium/mark_location*.png

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint doc \
	compare_install_and_source

run:
	/home/jukka/Downloads/firefox_dev/firefox --debug https://www.wikipedia.org

firefox: change_to_firefox
	# Default screenshot size 100%.
	sed -i 's/captured_tab_size:\([^0-9]*\)\([0-9]*\)%/captured_tab_size:\1100%/' \
		background/background.js
	zip -r mark_location_firefox.xpi $(firefox_files)

chromium: change_to_chromium
	# Default screenshot size 30%.
	sed -i 's/captured_tab_size:\([^0-9]*\)\([0-9]*\)%/captured_tab_size:\130%/' \
		background/background.js
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

# usage: make compare_install_and_source install=PATH1 source=PATH2
# where PATH1 is path to the installed addon in
# ~/.mozilla/firefox/PROFILE/extensions/redirectlink@fluks.xpi and PATH2 is
# path to the generated xpi you can create with make firefox.
tmp_install := /tmp/_install
tmp_source := /tmp/_source
compare_install_and_source:
	@mkdir $(tmp_install)
	@unzip -qqd $(tmp_install) $(install)
	@rm -rf $(tmp_install)/META-INF
	@mkdir $(tmp_source)
	@unzip -qqd $(tmp_source) $(source)
	diff -r $(tmp_install) $(tmp_source)
	@rm -rf $(tmp_install) $(tmp_source)
