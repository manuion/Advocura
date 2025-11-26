import notifee, { AndroidImportance, TriggerType } from '@notifee/react-native';

class NotificationsService {
    constructor() {
        this.channelId = 'hearings_channel';
    }

    async init() {
        // Create a channel (required for Android)
        await notifee.createChannel({
            id: this.channelId,
            name: 'Hearing Reminders',
            importance: AndroidImportance.HIGH,
        });
    }

    async requestPermission() {
        await notifee.requestPermission();
    }

    async scheduleHearingNotification(hearing) {
        try {
            const hearingDate = hearing.date?.toDate ? hearing.date.toDate() : hearing.date;

            // Schedule for 1 day before
            const reminderDate = new Date(hearingDate);
            reminderDate.setDate(reminderDate.getDate() - 1);
            reminderDate.setHours(9, 0, 0, 0); // 9 AM the day before

            // Don't schedule if in the past
            if (reminderDate.getTime() < Date.now()) {
                console.log('Reminder date is in the past, skipping notification');
                return;
            }

            // Create a time-based trigger
            const trigger = {
                type: TriggerType.TIMESTAMP,
                timestamp: reminderDate.getTime(),
            };

            // Create a trigger notification
            await notifee.createTriggerNotification(
                {
                    id: hearing.id,
                    title: 'Upcoming Hearing Tomorrow',
                    body: `${hearing.type} Hearing at ${hearing.courtName}`,
                    android: {
                        channelId: this.channelId,
                        pressAction: {
                            id: 'default',
                        },
                    },
                    data: {
                        hearingId: hearing.id,
                        caseId: hearing.caseId,
                    },
                },
                trigger,
            );

            console.log('Notification scheduled for:', reminderDate);
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }

    async cancelNotification(hearingId) {
        try {
            await notifee.cancelNotification(hearingId);
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    }
}

export const notificationsService = new NotificationsService();
