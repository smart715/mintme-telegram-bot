/* eslint-disable */
function triggerMouseEvent(node, eventType) {
    if (node) {
        const clickEvent = document.createEvent('MouseEvents');
        clickEvent.initEvent(eventType, true, true);
        node.dispatchEvent(clickEvent);
    }
}

function sendVirtualClick(element) {
    triggerMouseEvent(element, 'mousedown');
    triggerMouseEvent(element, 'click');
    triggerMouseEvent(element, 'click');
}

const captchas = document.getElementsByClassName('message-content text media has-shadow has-solid-background has-appendix');

const xhr = new XMLHttpRequest();

xhr.onload = async function () {
    const codes = new Uint8Array(xhr.response);
    const bin = String.fromCharCode.apply(null, codes);
    const b64 = btoa(bin);

    const res = await fetch('https://api.anti-captcha.com/createTask', {
        method: 'post',
        headers: new Headers({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            "clientKey": "7f9d6c6aa5283ffdd5c4c5ca1864a060",
            "task":
            {
                "type": "ImageToTextTask",
                "body": b64,
                "phrase": false,
                "case": true,
                "numeric": 0,
                "math": false,
                "minLength": 0,
                "maxLength": 0
            },
            "softId": 0
        })
    });

    const data = await res.json();
    const taskID = data.taskId;

    if (taskID) {
        const checker = setInterval(async function () {
            const captchaSolvedReq = await fetch('https://api.anti-captcha.com/getTaskResult', {
                method: 'post',
                headers: new Headers({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    "clientKey": "7f9d6c6aa5283ffdd5c4c5ca1864a060",
                    "taskId": taskID
                })
            });
            const result = await captchaSolvedReq.json();

            if (result.status) {
                if (result.status === 'ready') {
                    const solutionText = result.solution.text;
                    const btn = [...document.querySelectorAll('button')]
                        .findLast(el => el.textContent.toLowerCase().includes(solutionText.toLowerCase()));

                    if (btn)
                        sendVirtualClick(btn);

                    clearInterval(checker);
                }
            }
        }, 5000)
    }
};


if (captchas.length > 0) {
    xhr.open('GET', captchas[captchas.length - 1].getElementsByTagName('img')[0].src)
    xhr.responseType = 'arraybuffer'
    xhr.send()
}
