# Admin Module for livestreaming solutions
This is a solution for controlling livestreaming of various events and conferences remotely by admin. In addition to support to OBS studio, one can check the audience size, claps, hands raised, questions asked at single place making it convinient and resourceful. 

# Prerequsites Needed:<br/>
*Node and npm installed in th system<br/>
*OBS studio<br/>
*OBS websocket Plugin<br/>
*Redis Server<br/>
<br/>

## Set Up Instructions:<br/>
1.Clone/Download the project from the github repository.<br/>
2. Run **npm install** command<br/>
3. Ensure that you have added gulp and gulp cli as dev dependencies in the node modules.If not, use: <br/>
4. Now, run: **node app.js** and open your browser .Go to "https://localhost:port_no".<br/>
5. In case you make any changes in stylesheets in theme of the project, run **gulp serve** to update the changes in server side.<br/>
