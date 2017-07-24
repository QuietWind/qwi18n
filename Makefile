SHELL := /bin/bash
export PATH := $(shell pwd)/node_modules/.bin:$(PATH)

init:
	yarn

watch:
	tsc -w

build:
	tsc