const videoChatConfig = {
    peerJSConfig: {
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'turn:209.145.53.146', username: 'user', credential: 'pass' }
            ]
        } /* Sample servers, please use appropriate ones */,
        host: 'videochat.resetstudio.it',
        secure: true,
        path: 'peerjs/myapp',
        port: '3000'
    },
    socketIOConfig: {
        url: 'https://videochat.resetstudio.it:3000/'
    }
}