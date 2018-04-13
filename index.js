const net = require('net');

const socket = new net.Socket();
socket.on('close', (err) => {
    console.log(`closed,${err}`);
});
socket.on('connect', () => {
    console.log('connect');
});
socket.on('data', (data) => {
    console.log(`data transfered, ${data.toString('utf8')}`);
});
socket.on('end', () => {
    console.log('ended');
});
socket.on('error', (err) => {
    console.log(err.message);
});
socket.on('lookup', (err, addr, fam, host) => {
    console.log(`host looked up,err:${err},addr:${addr},fam:${fam},host:${host}`);
});
socket.on('timeout', () => {
    console.log('timeout');
});
const handler = () => {
    socket.connect(135, '192.168.95.59', () => {
        console.dir(socket);
        socket.end();
        handler();
    });
};
handler();