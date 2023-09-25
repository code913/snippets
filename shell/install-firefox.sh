#!/usr/bin/env bash

# Installs firefox dev edition for linux 64-bit with language en-US
# i have extremely little knowledge of bash so stuff may break
curl "https://download.mozilla.org/?product=firefox-devedition-latest-ssl&os=linux64&lang=en-US" -L --output firefox-archive.tar.bz2
bunzip2 firefox-archive.tar.bz2
tar xvf firefox-archive.tar

clear
echo "Edit ~/.bashrc and add the following at the end:"
echo "alias firefox=\"<the dir you just installed firefox>/firefox\""
echo "Then type firefox in the terminal to launch firefox"
