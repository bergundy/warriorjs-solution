dist/compiled.js: src/*.ts
	tsc

Player.js: dist/compiled.js
	cat src/amd.js dist/compiled.js > Player.js

build: Player.js

play: build
	warriorjs

.PHONY = build play
.DEFAULT_GOAL = play
