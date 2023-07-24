export enum ChannelStatusType {
    DM_NOT_ENABLED = 'DM_NOT_ENABLED',
    ACCOUNT_NOT_EXISTS = 'ACCOUNT_NOT_EXISTS',
    SUSPENDED = 'SUSPENDED',
    ACTIVE = 'ACTIVE',
}

export enum ContactMethod {
    EMAIL = 'EMAIL',
    TWITTER = 'TWITTER',
    TELEGRAM = 'TELEGRAM',
}

export enum TokenContactStatusType {
    NOT_CONTACTED = 'NOT_CONTACTED',
    RESPONDED = 'RESPONDED',
    QUEUED = 'QUEUED',
    LIMIT_REACHED = 'LIMIT_REACHED',
    NO_CONTACTS = 'NO_CONTACTS',
}

export enum ContactHistoryStatusType {
    DM_NOT_ENABLED = 'DM_NOT_ENABLED',
    ACCOUNT_NOT_EXISTS = 'ACCOUNT_NOT_EXISTS',
    SUSPENDED = 'SUSPENDED',
    SENT = 'SENT',
}
