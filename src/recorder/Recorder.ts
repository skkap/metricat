import { RecordingSession } from '@/recorder/RecortingSession'

export class Recorder {
    /**
     * Active recording sessions.
     */
    private recordingSessions: Map<string, RecordingSession> = new Map();

    /**
     * Starts recording session.
     * 
     * @param delayMilliseconds Delay between requests in milliseconds.
     * @param url Full url of the metrics endpoint.
     * 
     * @returns Id of the recording session.
     */
    public startRecording(delayMilliseconds: number, url: string): string {
        const recordingSession = new RecordingSession(delayMilliseconds, url);
        recordingSession.start();
        this.recordingSessions.set(recordingSession.id, recordingSession);
        return recordingSession.id;
    }

    /**
     * Stops recording session.
     * 
     * @param recordingId Recording identifier.
     */
    public stopRecording(recordingId: string) {
        const recordingSession = this.recordingSessions.get(recordingId);
        if (recordingSession && recordingSession.isRecording()) {
            recordingSession.stop();
        } 
    }

    /**
     * Update interval.
     * 
     * @param recordingId Recording identifier.
     * @param intervalMillis New interval in milliseconds.
     */
    public updateInterval(recordingId: string, intervalMillis: number) {
        const recordingSession = this.recordingSessions.get(recordingId);
        if (recordingSession && recordingSession.isRecording()) {
            recordingSession.setInterval(intervalMillis);
        } 
    }
}

export let recorder = new Recorder()
