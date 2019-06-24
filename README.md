# HackWeekBotTest
Simple bot test repo for Discord Hack Week

Set this up and tested on Ubuntu 16.04.
It should work on other Ubuntu versions or anywhere node runs at this point.

1. Install Nodejs
 - I followed a guide and installed version 8.12.0, and npm 6.4.1
    ```
    cd ~
    curl -sL https://deb.nodesource.com/setup_8.x -o nodesource_setup.sh
    sudo apt-get install -y nodejs
    ```
  - Then confirm versions of node and npm with `node -v` and `npm -v`. 

  2. Clone the Repository
  
  3. `npm install`
  
  4. Get your bot token from your application on https://discordapp.com/developers/applications/ and add it into token.js
  
  5. Run bot with `node start.js`


Don't have a better place to put this yet so saving it here for now as well.

Ran the following command to ensure token.js with added API token does not get added to repo.
`git update-index --skip-worktree token.js`

