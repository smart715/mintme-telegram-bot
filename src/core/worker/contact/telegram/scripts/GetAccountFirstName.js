/* eslint-disable */
let ttGlobalStats = JSON.parse(localStorage.getItem('tt-global-state'))

if (ttGlobalStats) {
    let users = ttGlobalStats.users.byId

    for (const id of Object.keys(users)) {
        const user = users[id];
        if (user.isSelf) {
            return user.firstName;
        }
    }
}

return 'NO_RESULT'