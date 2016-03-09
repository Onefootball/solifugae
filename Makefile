.PHONY: all test build deps

all: deps

deps:
	npm install

build: deps
	tar -jcf app.bz2 *

test:
	true
