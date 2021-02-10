const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
let myStream = null
myVideo.muted = true
const peers = {}
let myID = null;
var videoControlsOriginal = document.getElementById("video-controls-my").cloneNode(true);
document.getElementById("video-controls-my").remove();

let socket = null
let myPeer = null
let users = {}
$(function () {
    navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
        var audioInputSelect = $("#audio-inputs")[0];
        var audioOutputSelect = $("#audio-outputs")[0];
        var videoSelect = $("#video-inputs")[0];
        for (var i = 0; i !== deviceInfos.length; ++i) {
            var deviceInfo = deviceInfos[i];
            var option = document.createElement('option');
            option.value = deviceInfo.deviceId;
            if (deviceInfo.kind === 'audioinput') {
                option.text = deviceInfo.label ||
                    'Microphone ' + (audioInputSelect.length + 1);
                audioInputSelect.appendChild(option);
            } else if (deviceInfo.kind === 'audiooutput') {
                option.text = deviceInfo.label || 'Speaker ' +
                    (audioOutputSelect.length + 1);
                audioOutputSelect.appendChild(option);
            } else if (deviceInfo.kind === 'videoinput') {
                option.text = deviceInfo.label || 'Camera ' +
                    (videoSelect.length + 1);
                videoSelect.appendChild(option);
            }
        }
        $(".remove-me").remove();
    });
});
if (videoChatConfig.peerJSConfig) {
    socket = io(videoChatConfig.socketIOConfig.url)
    myPeer = new Peer(undefined, videoChatConfig.peerJSConfig)

    navigator.mediaDevices.getUserMedia({
        video: { width: { max: 320 }, height: { max: 200 } },
        audio: true
    }).then(stream => {
        addVideoStream(myVideo, stream, "myPeer")
        myStream = stream;
        myPeer.on('call', call => {
            call.answer(stream)
            const video = document.createElement('video')
            call.on('stream', userVideoStream => {
                addVideoStream(video, userVideoStream, call.peer, null, 'myPeerOnCall')
            })
        })
        socket.on('users-updated', (_users) => {
            users = _users;
            updateUsers();
        });
        socket.on('user-connected', (userId, playerName, _users) => {
            console.log("PlayerName: ", playerName)
            if (userId != myID) {
                connectToNewUser(userId, stream, playerName)
            }
            if (users) {
                console.log("requesting user update")
                socket.emit('update-users');
            }
            //users = _users
            //console.log("USERS: ", users);
        })
    })

    socket.on('user-disconnected', userId => {
        if (document.getElementById("video-div-id-" + userId)) {
            document.getElementById("video-div-id-" + userId).remove();
        }
        if (peers[userId]) peers[userId].close()
    })

    myPeer.on('open', id => {
        //socket.emit('join-room', ROOM_ID, id)
        myID = id;
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
function updateUsers() {
    console.log("updating users...")
    for (const u in users) {
        $("#video-div-id-" + u + " .name-label").html(users[u]);
    }
}
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
socket.on('sendPlayerName', data => {
    if (data.playerName) {
        $("#video-div-id-" + data.peerID + " .name-label").html(playerName);
    }
})
//@m0de you should use this function
function switchRoom(_roomId) {
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
// let joinRoomTriggerContainer = document.getElementById("joinRoomTriggers");
// for (let index = 0; index < joinRoomTriggerContainer.children.length; index++) {
//     const joinRoomTrigger = joinRoomTriggerContainer.children[index];
//     joinRoomTrigger.addEventListener("click", function () {
//         switchRoom(joinRoomTrigger.getAttribute("data-room"));
//     });
// }


function connectToNewUser(userId, stream, playerName = null) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
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

function addVideoStream(video, stream, peerID = null, playerName = null, from = 'null') {
    console.log("HELLO FROM " + from);
    if (document.getElementById("video-div-id-" + peerID)) {
        //document.getElementById("video-div-id-" + peerID).remove();
        return
    }
    video.srcObject = stream
    let videoDiv = document.createElement('div');
    videoDiv.setAttribute("class", "video-div")
    videoDiv.setAttribute("id", "video-div-id-" + peerID)
    if (peerID) {
        video.setAttribute('data-peer', peerID);
        video.setAttribute('id', 'video-' + peerID);
        let videoControls = videoControlsOriginal.cloneNode(true);
        videoControls.setAttribute("id", "video-controls-" + peerID);
        for (i = 0; i < videoControls.children.length; i++) {
            videoControls.children[i].setAttribute("data-peer", peerID);
            if (videoControls.children[i].tagName != 'div') {
                videoControls.children[i].addEventListener("click", function (event) {
                    let el = event.target || event.srcElement;
                    // console.log("h3r3");
                    // console.log(this);
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
}
function handleVideoUI(el) {
    let videoID = "video-" + el.getAttribute("data-peer");
    let videoEL = document.getElementById(videoID);
    const btnIcon = el.querySelectorAll("i")[0];
    let nextClass = btnIcon.getAttribute("class")
    btnIcon.setAttribute("class", el.getAttribute("data-nextclass"))
    el.setAttribute("data-nextclass", nextClass)
    if (el.getAttribute("data-action") == "hide") {
        if (el.getAttribute("data-hidden") == 0) {
            videoEL.pause();
            el.setAttribute("data-hidden", 1);
            videoEL.style = "opacity: 0";
        } else {
            videoEL.play();
            el.setAttribute("data-hidden", 0);
            videoEL.style = "opacity: 1";
        }
        if (el.getAttribute("data-peer") == "myPeer") {
            myStream.getVideoTracks()[0].enabled = el.getAttribute("data-hidden") != 1;
        }

    }
    if (el.getAttribute("data-action") == "mute") {
        if (el.getAttribute("data-peer") == "myPeer") {
            myStream.getAudioTracks()[0].enabled = !myStream.getAudioTracks()[0].enabled;
        } else {
            videoEL.muted = !videoEL.muted;
        }
    }
}