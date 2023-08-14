/* eslint-disable */
const chatUtils = document.querySelector('[title="More actions"]')

function triggerMouseEvent(node, eventType) {
    const clickEvent = document.createEvent('MouseEvents')
    clickEvent.initEvent(eventType, true, true)
    node.dispatchEvent(clickEvent)
}

function sendVirtualClick(element) {
    triggerMouseEvent(element, 'mousedown')
    triggerMouseEvent(element, 'click')
    triggerMouseEvent(element, 'click')
}

if (chatUtils) {
    sendVirtualClick(chatUtils);

    setTimeout(function () {
        const leaveBtn = document.getElementsByClassName('MenuItem destructive compact')[0];
        sendVirtualClick(leaveBtn);
    }, 3000);

    setTimeout(function () {
        const btn = [...document.querySelectorAll('button')]
            .findLast(el => el.textContent.toLowerCase().includes('leave group'));
        if (btn) {
            sendVirtualClick(btn);
        }
    }, 5000)
}

