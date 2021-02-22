//@@@@@@@ IMPORTANT NOTICE @@@@@//
//@@ WEBRTC WORKS ONLY ON HTTPS, edit igeRoot and igeClientRoot on engine/loader.js in production

const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
let myStream = null
myVideo.muted = true
const peers = {}
//# id from PeerJs
let myID = null;
const peerSettings = {}
// I'll use this node to generate all the video-controls
var videoControlsOriginal = document.getElementById("video-controls-my").cloneNode(true);
document.getElementById("video-controls-my").remove();

var videoChatEnabled = false;

let socket = null
let myPeer = null
let users = {}

//#functions
//##updateUsers: used mostly to update username, for now.
function updateUsers() {
    console.log("updating users...")
    for (const u in users) {
        $("#video-div-id-" + u + " .name-label").html(users[u]);
    }
}
//##disconnectFromRoom: used to disconnect user from current room.
function disconnectFromRoom(newRoom = null) {
    if (newRoom == ROOM_ID) {
        return
    }
    if (ROOM_ID) {
        socket.emit('disconnect-from-room', ROOM_ID, myID);
        console.log("Disconnecting...")
        socket.emit('disconnected', myID);
        ROOM_ID = null;
    }
    console.log(peers);
    //Remove others
    if (Object.keys(peers).length) {
        let i = 0
        while (i < Object.keys(peers).length) {
            let key = Object.keys(peers)[i];
            if (document.getElementById("video-div-id-" + key)) {
                document.getElementById("video-div-id-" + key).remove();
            }
            i++;
        }
    }

}
function videoChatUpdateSpatialVideo(players) {
    // if (Object.keys(players).length) {
    //     console.log(players)
    // }
    for (p in players) {
        const v = document.getElementById("video-" + p)
        if (v) {
            const dist = players[p]
            let presence = (dist < ige.videoChat.minRange) ? 1 : 1 - ((dist - ige.videoChat.minRange) / (ige.videoChat.maxRange - ige.videoChat.minRange))
            if (presence < 0) {
                presence = 0
            }
            if (presence > 1) {
                presence = 1
            }
            v.volume = presence
            if (!peerSettings[p].hidden) {
                v.style = "opacity: " + presence
            }
            if (dist > ige.videoChat.maxRange) {
                document.getElementById("video-div-id-" + p).style = "display: none"
                v.pause()
            } else {
                document.getElementById("video-div-id-" + p).style = "display: block"
                if (!peerSettings[p].hidden) {
                    v.play()
                }
            }
        }
    }
}
//## switchRoom: used to join a new room or switch (disconnecting from the previous) to a new one.
function switchRoom(_roomId) {
    if (!myID) {
        switchRoomBuffer = _roomId
        return
    }
    if (!videoChatEnabled) {
        return false;
    }
    if (_roomId != myID) {

    }
    const player = ige.game.getPlayerByClientId(ige.client.myPlayer._stats.clientId);
    $("#video-div-id-myPeer .name-label").html(player._stats.name);
    //socket.emit('sendPlayerName', { peerID: myID, playerName: player._stats.name });
    disconnectFromRoom(_roomId);
    ROOM_ID = _roomId;
    console.log(myID + " moving to " + ROOM_ID);
    socket.emit('join-room', ROOM_ID, myID, player._stats.name)
    //document.getElementById("currentRoom").innerHTML = ROOM_ID;
}

//## connectToNewUser: used to establish peer connection using PeerJs
function connectToNewUser(userId, stream, playerName = null) {
    console.log(userId, myPeer, "stream: ", stream)
    const video = document.createElement('video')
    const call = stream ? myPeer.call(userId, stream) : myPeer.connect(userId)
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream, userId, playerName, 'connectToNewUser')
    })
    call.on('close', () => {
        if (document.getElementById("video-div-id-" + userId)) {
            document.getElementById("video-div-id-" + userId).remove();
        }
        console.log(userId + ' removed');
        if (peers[userId]) peers[userId].close()
        //video.remove()
    })

    peers[userId] = call

}
//## addVideoStream: used to generate new videoelement.
function addVideoStream(video, stream, peerID = null, playerName = null, from = 'null') {
    if (!stream) {
        return
    }
    console.log(myID + ": adding videostream FROM " + from + " for: " + peerID);
    //#If we don't have settings for the peer we resore defaults.
    if (!peerSettings[peerID]) {
        peerSettings[peerID] = { muted: false, hidden: false }
    }
    if (document.getElementById("video-div-id-" + peerID)) {
        //document.getElementById("video-div-id-" + peerID).remove();
        return
    }
    video.srcObject = stream
    //#setting up the video container.
    let videoDiv = document.createElement('div');
    videoDiv.setAttribute("class", "video-div")
    videoDiv.setAttribute("id", "video-div-id-" + peerID)
    if (peerID) {
        video.setAttribute('data-peer', peerID);
        video.setAttribute('id', 'video-' + peerID);
        //# clone the controls.
        let videoControls = videoControlsOriginal.cloneNode(true);
        videoControls.setAttribute("id", "video-controls-" + peerID);
        for (i = 0; i < videoControls.children.length; i++) {
            //# adding the peerID to the data attr
            videoControls.children[i].setAttribute("data-peer", peerID);
            //# if it's not a div (then it's a button by design)
            if (videoControls.children[i].tagName != 'div') {
                //adding click listener
                videoControls.children[i].addEventListener("click", function (event) {
                    let el = event.target || event.srcElement;
                    handleVideoUI(this)
                });
            }
            if ($(videoControls.children[i]).hasClass('name-label') && playerName) {
                console.log("Appending player name...")
                $(videoControls.children[i]).html(playerName);
            }
        }
        if (from == "myPeerOnCall") {
            console.log("requesting user update")
            socket.emit('update-users');
        }
        videoDiv.append(videoControls);
    }

    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoDiv.prepend(video)
    videoGrid.append(videoDiv)
    if (peerID && peerSettings[peerID]) {
        setAudioStatus(peerID, !peerSettings[peerID].muted)
        setVideoVisibility(peerID, !peerSettings[peerID].hidden)
    }
}
//# status = true / audible, false / mute
function setAudioStatus(peerID, status) {
    const controls = $("#video-controls-" + peerID);
    const iconClass = !status ? $(".mute-btn", controls).attr("data-istrueclass") : $(".mute-btn", controls).attr("data-isfalseclass")
    $(".mute-btn i", controls).attr("class", iconClass)
    const videoID = "video-" + peerID
    const videoEl = document.getElementById(videoID)
    if (!videoEl) {
        return
    }
    if (peerID == "myPeer") {
        if (!myStream) {
            myStream = window.stream
        }
        if (!myStream) {
            return false;
        }
        console.log("audio will be: ", status)
        myStream.getAudioTracks()[0].enabled = status;
    } else {
        videoEl.muted = !status
        peerSettings[peerID].muted = !status;
    }
}
//# status = true / visible, false / hidden
function setVideoVisibility(peerID, status) {
    const controls = $("#video-controls-" + peerID);
    const iconClass = !status ? $(".hide-btn", controls).attr("data-istrueclass") : $(".hide-btn", controls).attr("data-isfalseclass")
    $(".hide-btn i", controls).attr("class", iconClass)
    const videoID = "video-" + peerID
    const videoEl = document.getElementById(videoID)
    if (!videoEl) {
        return
    }
    if (status) {
        //video is visible
        videoEl.play();
        $(".hide-btn", controls).attr("data-hidden", 0);
        videoEl.style = "opacity: 1";
        peerSettings[peerID].hidden = false;
    } else {
        //video is hidden
        videoEl.pause();
        $(".hide-btn", controls).attr("data-hidden", 1);
        videoEl.style = "opacity: 0";
        peerSettings[peerID].hidden = true;
    }
}
//## handleVideoUI: used to manage video-controls button presses.
function handleVideoUI(el) {
    let videoID = "video-" + el.getAttribute("data-peer");
    let videoEl = document.getElementById(videoID);
    // const btnIcon = el.querySelectorAll("i")[0];
    // let nextClass = btnIcon.getAttribute("class")
    // btnIcon.setAttribute("class", el.getAttribute("data-nextclass"))
    // el.setAttribute("data-nextclass", nextClass)
    if (el.getAttribute("data-action") == "hide") {
        if (el.getAttribute("data-hidden") == 0) {
            setVideoVisibility(el.getAttribute("data-peer"), false)
        } else {
            setVideoVisibility(el.getAttribute("data-peer"), true)
        }
        if (el.getAttribute("data-peer") == "myPeer") {
            myStream.getVideoTracks()[0].enabled = el.getAttribute("data-hidden") != 1;
        }

    }
    if (el.getAttribute("data-action") == "mute") {
        if (el.getAttribute("data-peer") == "myPeer") {
            setAudioStatus(el.getAttribute("data-peer"), !myStream.getAudioTracks()[0].enabled)
        } else {
            // to set the new status (true / false) we send the current muted state (inverted state)
            setAudioStatus(el.getAttribute("data-peer"), videoEl.muted)
        }
    }
}


//#device-selection form https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
const videoElement = document.querySelector('video#my-video-preview');
const audioInputSelect = document.querySelector('select#audio-inputs');
const audioOutputSelect = document.querySelector('select#audio-outputs');
const videoSelect = document.querySelector('select#video-inputs');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];

audioOutputSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'audiooutput') {
            option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log('Some other kind of source/device: ', deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== 'undefined') {
        element.setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch(error => {
                let errorMessage = error;
                if (error.name === 'SecurityError') {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn('Browser does not support output device selection.');
    }
}

function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value;
    attachSinkId(videoElement, audioDestination);
}

function gotStream(stream) {
    window.stream = stream; // make stream available to console
    console.log("stream refreshed")
    videoElement.srcObject = stream;
    videoElement.muted = true;
    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function vChatStart() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
        video: { deviceId: videoSource ? { exact: videoSource } : undefined, width: { max: 160 }, height: { max: 100 }, frameRate: { min: 5, max: 14 }, resizeMode: 'crop-and-scale' }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
}

audioInputSelect.onchange = vChatStart;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = vChatStart;
$(function () {
    //#modal-step integration
    $(".modal-step-link").on("click", function () {
        const step = $(this).data("step")
        $(this).closest(".modal-step").hide();
        $(".modal-step-" + step).removeClass("d-none").show();
        if (step == 2) {
            //# Starts the video/audio selection.
            setTimeout(() => {
                vChatStart();
            }, 100);
        }
    });

    $(".videochat-choice").on("click", function () {
        $(".modal-videochat, .modal-backdrop").removeClass("d-block").hide();
        const choice = $(this).attr("data-choice");
        //moved from the IF below.
        videoChatEnabled = true;
        if (choice == "enable") {
            //startVideoChat();
        } else {
            videoElement.pause();
            videoElement.src = "";
            if (window.stream) {
                window.stream.getTracks().forEach(track => {
                    track.stop();
                });
            }
            window.stream = null;
        }
        //startVideoChat();
        return false;
    });
})
function processMyStream(stream) {
    if (stream) {
        addVideoStream(myVideo, stream, "myPeer")
    }
    myStream = stream;
    myVideo.muted = true
    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream, call.peer, null, 'myPeerOnCall')
        })
    })
    myPeer.on('connection', call => {
        // call.answer(stream)
        // const video = document.createElement('video')
        // call.on('stream', userVideoStream => {
        //     addVideoStream(video, userVideoStream, call.peer, null, 'myPeerOnCall')
        // })
        if (myStream) {
            myPeer.call(call.peer, myStream)
        }
    })
    socket.on('users-updated', (_users) => {
        users = _users;
        updateUsers();
    });
    socket.on('user-connected', (userId, playerName, _users) => {
        console.log("PlayerName: ", playerName)
        if (userId != myID) {
            //console.log(userId, stream, playerName, " line: 369")
            connectToNewUser(userId, stream, playerName)
        }
        if (users) {
            console.log("requesting user update")
            socket.emit('update-users');
        }
        //users = _users
        //console.log("USERS: ", users);
    })
}
function refreshUserName(_name) {
    $("#video-div-id-myPeer .name-label").html(_name);
    if (socket) {
        socket.emit('update-users');
    }
}
var switchRoomBuffer = null
function startVideoChat(_peerID = undefined) {
    if (videoChatConfig.peerJSConfig) {
        socket = io(videoChatConfig.socketIOConfig.url)
        myPeer = new Peer(_peerID, videoChatConfig.peerJSConfig)
        //#EVENTS
        socket.on('sendPlayerName', data => {
            if (data.playerName) {
                $("#video-div-id-" + data.peerID + " .name-label").html(playerName);
            }
        })
        if (window.stream) {
            processMyStream(window.stream)
        } else {
            processMyStream(null)
            // navigator.mediaDevices.getUserMedia({
            //     video: { width: { max: 320 }, height: { max: 200 } },
            //     audio: true
            // }).then(stream => {
            //     processMyStream(stream)
            // })
        }


        socket.on('user-disconnected', userId => {
            if (document.getElementById("video-div-id-" + userId)) {
                document.getElementById("video-div-id-" + userId).remove();
            }
            if (peers[userId]) peers[userId].close()
        })

        myPeer.on('open', id => {
            //socket.emit('join-room', ROOM_ID, id)
            myID = id;
            if (switchRoomBuffer) {
                switchRoom(switchRoomBuffer)
                switchRoomBuffer = null
            }
        })
        if (ROOM_ID) {
            console.log(ROOM_ID)
            myPeer.on('open', id => {
                myID = id;
                const player = ige.game.getPlayerByClientId(ige.client.myPlayer._stats.clientId);
                const playerName = (player._stats.name);
                socket.emit('join-room', ROOM_ID, id, playerName)
            })
        }
    }
}