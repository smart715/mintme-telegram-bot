/* eslint-disable */
const btns = document.getElementsByTagName('button')

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

for (i = 0; i < btns.length; i++) {
    if ('join group' === btns[i].innerText.toLowerCase()) {
        sendVirtualClick(btns[i])
    }
}

var interval = setInterval(function () {
    if (document.documentElement.innerHTML.toLowerCase().includes('animated emoji')) {
        document.dispatchEvent(new KeyboardEvent('keydown', { 'key': 'Escape' }))
        document.dispatchEvent(new KeyboardEvent('keyup', { 'key': 'Escape' }))
        clearInterval(interval)
    }
}, 100)
