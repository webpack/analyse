onmessage = function (message) {
    const { data } = message;
    postMessage(JSON.parse(data));
}