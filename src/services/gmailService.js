import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * Gmail Service - Gmail API integration for fetching and sending emails
 */

// Gmail API base URL
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Gmail scopes required
const GMAIL_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
];

// Configure Google Sign-In (call once at app startup)
export const configureGoogleSignIn = () => {
    GoogleSignin.configure({
        scopes: GMAIL_SCOPES,
        webClientId: '416648406702-d7pp58c8crlg9pr2tb7r24r97r7jcgi1.apps.googleusercontent.com',
        offlineAccess: true, // Required for refresh tokens
        forceCodeForRefreshToken: true,
    });
};

// Link a Gmail account
export const linkGmailAccount = async () => {
    try {
        // Check if Google Play Services are available
        await GoogleSignin.hasPlayServices();

        // Sign in with Google
        const userInfo = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();

        const gmailAccount = {
            email: userInfo.user.email,
            name: userInfo.user.name,
            photo: userInfo.user.photo,
            accessToken: tokens.accessToken,
            idToken: tokens.idToken,
            linkedAt: firestore.FieldValue.serverTimestamp(),
        };

        // Save to Firestore
        const currentUser = auth().currentUser;
        if (!currentUser) {
            return { success: false, error: 'User not authenticated' };
        }

        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        const existingAccounts = userDoc.data()?.linkedGmailAccounts || [];

        // Check if account already linked
        const alreadyLinked = existingAccounts.some(acc => acc.email === gmailAccount.email);
        if (alreadyLinked) {
            return { success: false, error: 'This Gmail account is already linked' };
        }

        // Check max accounts limit (3)
        if (existingAccounts.length >= 3) {
            return { success: false, error: 'Maximum 3 Gmail accounts can be linked' };
        }

        // Add new account
        await firestore().collection('users').doc(currentUser.uid).update({
            linkedGmailAccounts: firestore.FieldValue.arrayUnion(gmailAccount),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true, account: gmailAccount };
    } catch (error) {
        console.error('Error linking Gmail account:', error);

        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            return { success: false, error: 'Sign in cancelled' };
        } else if (error.code === statusCodes.IN_PROGRESS) {
            return { success: false, error: 'Sign in already in progress' };
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            return { success: false, error: 'Google Play Services not available' };
        }

        return { success: false, error: error.message };
    }
};

// Unlink a Gmail account
export const unlinkGmailAccount = async (email) => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            return { success: false, error: 'User not authenticated' };
        }

        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        const existingAccounts = userDoc.data()?.linkedGmailAccounts || [];

        const updatedAccounts = existingAccounts.filter(acc => acc.email !== email);

        await firestore().collection('users').doc(currentUser.uid).update({
            linkedGmailAccounts: updatedAccounts,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Sign out from Google if this was the last account
        if (updatedAccounts.length === 0) {
            try {
                await GoogleSignin.signOut();
            } catch (e) {
                // Ignore sign out errors
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error unlinking Gmail account:', error);
        return { success: false, error: error.message };
    }
};

// Get all linked Gmail accounts
export const getLinkedAccounts = async () => {
    try {
        const currentUser = auth().currentUser;
        if (!currentUser) {
            return { success: false, error: 'User not authenticated', accounts: [] };
        }

        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        const accounts = userDoc.data()?.linkedGmailAccounts || [];

        return { success: true, accounts };
    } catch (error) {
        console.error('Error getting linked accounts:', error);
        return { success: false, error: error.message, accounts: [] };
    }
};

// Refresh access token for an account
const refreshAccessToken = async (account) => {
    try {
        // Check if current Google user matches
        const currentGoogleUser = await GoogleSignin.getCurrentUser();

        if (!currentGoogleUser || currentGoogleUser.user.email !== account.email) {
            // Need to sign in as this user
            await GoogleSignin.signOut();
            await GoogleSignin.signIn();
        }

        const tokens = await GoogleSignin.getTokens();

        // Update token in Firestore
        const currentUser = auth().currentUser;
        if (currentUser) {
            const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
            const accounts = userDoc.data()?.linkedGmailAccounts || [];

            const updatedAccounts = accounts.map(acc => {
                if (acc.email === account.email) {
                    return { ...acc, accessToken: tokens.accessToken };
                }
                return acc;
            });

            await firestore().collection('users').doc(currentUser.uid).update({
                linkedGmailAccounts: updatedAccounts,
            });
        }

        return tokens.accessToken;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Make authenticated Gmail API request
const gmailApiRequest = async (account, endpoint, method = 'GET', body = null) => {
    let accessToken = account.accessToken;

    const makeRequest = async (token) => {
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, options);
        return response;
    };

    let response = await makeRequest(accessToken);

    // If token expired, refresh and retry
    if (response.status === 401) {
        accessToken = await refreshAccessToken(account);
        response = await makeRequest(accessToken);
    }

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Gmail API request failed');
    }

    return response.json();
};

// Search emails by subject keyword across all accounts
export const searchEmails = async (subjectKeyword, maxResults = 50) => {
    try {
        const { accounts } = await getLinkedAccounts();

        if (accounts.length === 0) {
            return { success: true, emails: [], message: 'No Gmail accounts linked' };
        }

        const allEmails = [];
        const query = `subject:${subjectKeyword}`;

        for (const account of accounts) {
            try {
                // Search for messages
                const searchResult = await gmailApiRequest(
                    account,
                    `/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
                );

                if (searchResult.messages && searchResult.messages.length > 0) {
                    // Fetch email details for each message
                    for (const msg of searchResult.messages) {
                        const emailDetail = await gmailApiRequest(
                            account,
                            `/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`
                        );

                        const headers = emailDetail.payload?.headers || [];
                        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

                        allEmails.push({
                            id: emailDetail.id,
                            threadId: emailDetail.threadId,
                            accountEmail: account.email,
                            subject: getHeader('Subject'),
                            from: getHeader('From'),
                            to: getHeader('To'),
                            date: getHeader('Date'),
                            snippet: emailDetail.snippet,
                            labelIds: emailDetail.labelIds,
                            isUnread: emailDetail.labelIds?.includes('UNREAD'),
                        });
                    }
                }
            } catch (accountError) {
                console.error(`Error fetching from ${account.email}:`, accountError);
                // Continue with other accounts
            }
        }

        // Sort by date (newest first)
        allEmails.sort((a, b) => new Date(b.date) - new Date(a.date));

        return { success: true, emails: allEmails };
    } catch (error) {
        console.error('Error searching emails:', error);
        return { success: false, error: error.message, emails: [] };
    }
};

// Get full email details by ID
export const getEmailById = async (accountEmail, emailId) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        const emailDetail = await gmailApiRequest(account, `/messages/${emailId}?format=full`);

        const headers = emailDetail.payload?.headers || [];
        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        // Extract body
        let body = '';
        let htmlBody = '';

        const extractBody = (parts) => {
            if (!parts) return;

            for (const part of parts) {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    body = decodeBase64(part.body.data);
                } else if (part.mimeType === 'text/html' && part.body?.data) {
                    htmlBody = decodeBase64(part.body.data);
                } else if (part.parts) {
                    extractBody(part.parts);
                }
            }
        };

        if (emailDetail.payload?.body?.data) {
            body = decodeBase64(emailDetail.payload.body.data);
        } else if (emailDetail.payload?.parts) {
            extractBody(emailDetail.payload.parts);
        }

        // Extract attachments
        const attachments = [];
        const extractAttachments = (parts) => {
            if (!parts) return;

            for (const part of parts) {
                if (part.filename && part.body?.attachmentId) {
                    attachments.push({
                        id: part.body.attachmentId,
                        filename: part.filename,
                        mimeType: part.mimeType,
                        size: part.body.size,
                    });
                }
                if (part.parts) {
                    extractAttachments(part.parts);
                }
            }
        };
        extractAttachments(emailDetail.payload?.parts);

        return {
            success: true,
            email: {
                id: emailDetail.id,
                threadId: emailDetail.threadId,
                accountEmail: accountEmail,
                subject: getHeader('Subject'),
                from: getHeader('From'),
                to: getHeader('To'),
                cc: getHeader('Cc'),
                date: getHeader('Date'),
                body: body,
                htmlBody: htmlBody,
                snippet: emailDetail.snippet,
                attachments: attachments,
                labelIds: emailDetail.labelIds,
            },
        };
    } catch (error) {
        console.error('Error getting email:', error);
        return { success: false, error: error.message };
    }
};

// Send a reply to an email
export const sendReply = async (accountEmail, originalEmail, replyBody) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        // Extract email address from "Name <email>" format
        const extractEmail = (str) => {
            const match = str.match(/<(.+?)>/);
            return match ? match[1] : str;
        };

        const toEmail = extractEmail(originalEmail.from);
        const subject = originalEmail.subject.startsWith('Re:')
            ? originalEmail.subject
            : `Re: ${originalEmail.subject}`;

        const message = createMimeMessage({
            to: toEmail,
            from: accountEmail,
            subject: subject,
            body: replyBody,
            inReplyTo: originalEmail.id,
            references: originalEmail.id,
            threadId: originalEmail.threadId,
        });

        const result = await gmailApiRequest(account, '/messages/send', 'POST', {
            raw: message,
            threadId: originalEmail.threadId,
        });

        return { success: true, messageId: result.id };
    } catch (error) {
        console.error('Error sending reply:', error);
        return { success: false, error: error.message };
    }
};

// Forward an email
export const forwardEmail = async (accountEmail, originalEmail, toAddress, forwardBody) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        const subject = originalEmail.subject.startsWith('Fwd:')
            ? originalEmail.subject
            : `Fwd: ${originalEmail.subject}`;

        // Include original email in forward body
        const fullBody = `${forwardBody}\n\n---------- Forwarded message ----------\nFrom: ${originalEmail.from}\nDate: ${originalEmail.date}\nSubject: ${originalEmail.subject}\nTo: ${originalEmail.to}\n\n${originalEmail.body || originalEmail.htmlBody}`;

        const message = createMimeMessage({
            to: toAddress,
            from: accountEmail,
            subject: subject,
            body: fullBody,
        });

        const result = await gmailApiRequest(account, '/messages/send', 'POST', {
            raw: message,
        });

        return { success: true, messageId: result.id };
    } catch (error) {
        console.error('Error forwarding email:', error);
        return { success: false, error: error.message };
    }
};

// Download attachment
export const downloadAttachment = async (accountEmail, messageId, attachmentId) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        const result = await gmailApiRequest(
            account,
            `/messages/${messageId}/attachments/${attachmentId}`
        );

        return {
            success: true,
            data: result.data, // Base64 encoded
            size: result.size,
        };
    } catch (error) {
        console.error('Error downloading attachment:', error);
        return { success: false, error: error.message };
    }
};

// Helper: Decode base64 URL-safe string
const decodeBase64 = (data) => {
    try {
        // Replace URL-safe characters
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        return decodeURIComponent(escape(atob(base64)));
    } catch (e) {
        return data;
    }
};

// Helper: Create MIME message for sending
const createMimeMessage = ({ to, from, subject, body, inReplyTo, references, threadId }) => {
    const boundary = '----=_Part_' + Date.now();

    let message = [
        `To: ${to}`,
        `From: ${from}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ];

    if (inReplyTo) {
        message.push(`In-Reply-To: <${inReplyTo}>`);
    }
    if (references) {
        message.push(`References: <${references}>`);
    }

    message.push('');
    message.push(`--${boundary}`);
    message.push('Content-Type: text/plain; charset=UTF-8');
    message.push('');
    message.push(stripHtml(body));
    message.push('');
    message.push(`--${boundary}`);
    message.push('Content-Type: text/html; charset=UTF-8');
    message.push('');
    message.push(body);
    message.push('');
    message.push(`--${boundary}--`);

    const rawMessage = message.join('\r\n');

    // Base64 URL-safe encode
    return btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

// Helper: Strip HTML tags for plain text version
const stripHtml = (html) => {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
};

// Mark email as read
export const markAsRead = async (accountEmail, emailId) => {
    try {
        const { accounts } = await getLinkedAccounts();
        const account = accounts.find(acc => acc.email === accountEmail);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        await gmailApiRequest(account, `/messages/${emailId}/modify`, 'POST', {
            removeLabelIds: ['UNREAD'],
        });

        return { success: true };
    } catch (error) {
        console.error('Error marking as read:', error);
        return { success: false, error: error.message };
    }
};
