dist/compiled.js: src/*.ts
	tsc

Player.js: dist/compiled.js
	cat src/amd.js dist/compiled.js > Player.js

build: Player.js

speed=0.3

play: build
	warriorjs -t $(speed)

.PHONY = build play
.DEFAULT_GOAL = play
