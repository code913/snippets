#!/usr/bin/env bash

# Installs firefox dev edition for linux 64-bit with language en-US
# i have extremely little knowledge of bash so stuff may break
declare -A editions
editions["Firefox"]="firefox-latest-ssl"
editions["Firefox Beta"]="firefox-beta-latest-ssl"
editions["Firefox Developer Edition"]="firefox-devedition-latest-ssl"
editions["Firefox Nightly"]="firefox-nightly-latest-ssl"
editions["Firefox Extended Support Release"]="firefox-esr-latest-ssl"

keys=("${!editions[@]}")
editionId=${editions["Firefox"]}

PS3="Which firefox edition do you want to use? "
select edition in "${keys[@]}"; do
    if [ -n "$edition" ]; then
        editionId=${editions["$edition"]}
    else
        echo "Invalid choice, selecting Firefox"
    fi
    break
done

curl "https://download.mozilla.org/?product=${editionId}&os=linux64&lang=en-US" -L --output firefox-archive.tar.bz2
bunzip2 firefox-archive.tar.bz2
tar xvf firefox-archive.tar

echo "Edit ~/.bashrc and add the following at the end:"
echo "alias firefox=\"<the dir you just installed firefox>/firefox\""
echo "Then type firefox in the terminal to launch firefox"
