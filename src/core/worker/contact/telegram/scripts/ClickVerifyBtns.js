/* eslint-disable */
const veriftStr = [
    'not robot',
    'you\'re human',
    'not robot',
    'unblock',
    'unlock ',
    'verify',
    'human',
    'a bot',
    'unmute me',
]

function triggerMouseEvent(node, eventType) {
    if (node) {
        var clickEvent = document.createEvent('MouseEvents')
        clickEvent.initEvent(eventType, true, true)
        node.dispatchEvent(clickEvent)
    }
}

function sendVirtualClick(element) {
    triggerMouseEvent(element, 'mousedown')
    triggerMouseEvent(element, 'click')
    triggerMouseEvent(element, 'click')
}

for (let i = 0; i < veriftStr.length; i++) {
    const btn = ([ ...document.querySelectorAll('button') ])
        .findLast(el => el.textContent.toLowerCase().includes(veriftStr[i]))
    if (btn) {
        sendVirtualClick(btn)
        break
    }
}

var rulesInterval = setInterval(function () {
    if (document.documentElement.innerHTML.toLowerCase().includes('accept the rules')) {
        btn = ([ ...document.querySelectorAll('button') ])
            .findLast(el => el.textContent.toLowerCase().includes('accept the rules'))
        sendVirtualClick(btn)
        clearInterval(interval)
    }
}, 500)
