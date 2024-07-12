export enum ContactMethod {
    EMAIL = 'EMAIL',
    TWITTER = 'TWITTER',
    TELEGRAM = 'TELEGRAM',
    ALL = 'ALL',
}

export enum TokenContactStatusType {
    NOT_CONTACTED = 'NOT_CONTACTED',
    RESPONDED = 'RESPONDED',
    QUEUED = 'QUEUED',
    LIMIT_REACHED = 'LIMIT_REACHED',
    NO_CONTACTS = 'NO_CONTACTS',
    CONTACTED = 'CONTACTED',
    LISTED = 'LISTED',
}

export enum ContactHistoryStatusType {
    DM_NOT_ENABLED = 'DM_NOT_ENABLED',
    ACCOUNT_NOT_EXISTS = 'ACCOUNT_NOT_EXISTS',
    SUSPENDED = 'SUSPENDED',
    SENT = 'SENT',
    SENT_GROUP = 'SENT_GROUP',
    SENT_GROUP_BUT_DELETED = 'SENT_GROUP_BUT_DELETED',
    SENT_DM = 'SENT_DM',
    ERROR = 'ERROR',
    MESSAGES_NOT_ALLOWED = 'MESSAGES_NOT_ALLOWED',
    ANNOUNCEMENTS_POTENTIAL_GROUP = 'ANNOUNCEMENTS_POTENTIAL_GROUP',
    ANNOUNCEMENTS_NO_GROUP = 'ANNOUNCEMENTS_NO_GROUP',
    INVALID_LINK = 'INVALID_LINK',
    ACCOUNT_NOT_AUTHORIZED = 'ACCOUNT_NOT_AUTHORIZED',
    ACCOUNT_LIMIT_HIT = 'ACCOUNT_LIMIT_HIT',
    ACCOUNT_TEMP_BANNED = 'ACCOUNT_TEMP_BANNED',
    ACCOUNT_PERM_BANNED = 'ACCOUNT_PERM_BANNED',
    ACCOUNT_GROUP_JOIN_LIMIT_HIT = 'ACCOUNT_GROUP_JOIN_LIMIT_HIT',
    MESSAGES_RESTRICTED_BY_ADMIN = 'MESSAGES_RESTRICTED_BY_ADMIN',
    BOT_USER = 'BOT_USER',
    NO_MX_RECORD = 'NO_MX_RECORD',
    TELEGRAM_CACHE_BUG = 'TELEGRAM_CACHE_BUG',
    DM_PREMIUM_ONLY = 'DM_PREMIUM_ONLY',
    GROUP_MAX_USERS_LIMIT = 'GROUP_MAX_USERS_LIMIT',
}

export enum ChatType {
    DM = 'DM',
    GROUP = 'GROUP',
}

export interface CMCWorkerConfig {
    requestOffset: number,
    requestLimit: number,
    maxSimultaneousAccounts: number,
    maxPerCycle: number,
    commentFrequency: number,
    maxCommentsPerDay: number,
    maxCommentsPerCoin: number,
    maxCycleContinousFail: number,
    continousFailsDelays: number[],
    currentCategoryTargetId: string,
}

export enum BlacklistType {
    CHAT_LINK = 'CHAT_LINK',
    MESSAGE_CONTENT = 'MESSAGE_CONTENT',
    USERNAME = 'USERNAME',
}

export enum TelegramChannelCheckResultType {
    ACTIVE = 'ACTIVE',
    NOT_ACTIVE = 'NOT_ACTIVE',
    ANNOUNCEMENTS_CHANNEL_WITH_POTENTIAL_GROUP = 'ANNOUNCEMENTS_CHANNEL_WITH_POTENTIAL_GROUP',
    ANNOUNCEMENTS_CHANNEL_NO_GROUP = 'ANNOUNCEMENTS_CHANNEL_NO_GROUP',
    ERROR = 'ERROR',
    FREQUENCY_LIMIT = 'FREQUENCY_LIMIT',
}

export enum AccountType {
    TELEGRAM = 'TELEGRAM',
    TWITTER = 'TWITTER',
    CMC = 'CMC',
    ENQUEUE_WORKER = 'ENQUEUE_WORKER',
}
