// models/Conversation.js
export default class Conversation {
    constructor(sender, text, timestamp, spaceId, fileId, relatedMessageId, userIp, embedding) {
        this.sender = sender;
        this.text = text;
        this.timestamp = timestamp;
        this.spaceId = spaceId;
        this.fileId = fileId;
        this.relatedMessageId = relatedMessageId;
        this.userIp = userIp;
        this.embedding = embedding;
    }
}
