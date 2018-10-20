console.log('[worker-parse] init');

onmessage = function (message) {
    const { data } = message;
    postMessage(JSON.parse(data));
}