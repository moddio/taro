const videoChatConfig = {
    peerJSConfig: {
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },

            ]
        } /* Sample servers, please use appropriate ones */,
        host: '',
        secure: true,
        path: 'peerjs/myapp',
        port: '3000'
    },
    socketIOConfig: {
        url: ''
    }

}